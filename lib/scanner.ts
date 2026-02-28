import { parseRepoUrl } from "./repo";
import type { ScanResult, ScoreDetail, ScoreBreakdownItem } from "./types";
import { fetchScorecard } from "./scorecard";
import { getSnykIssueCount } from "./snyk";
import { fetchSocketScore, socketScoreTo100 } from "./socket";

const GITHUB_API = "https://api.github.com";

function getGrade(totalScore: number): string {
  if (totalScore >= 90) return "S";
  if (totalScore >= 80) return "A";
  if (totalScore >= 70) return "B";
  if (totalScore >= 60) return "C";
  return "D";
}

function clamp(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

async function fetchGitHub<T>(path: string): Promise<T | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SafeVibesOnly",
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${GITHUB_API}${path}`, { headers, cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

/** Fetch repo and return error message when failed (for user-facing feedback). */
async function fetchRepoOrError(
  owner: string,
  repo: string
): Promise<{ data: RepoResponse } | { error: string; status: number }> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "SafeVibesOnly",
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers, cache: "no-store" });
  if (res.ok) {
    const data = (await res.json()) as RepoResponse;
    return { data };
  }
  const status = res.status;
  if (status === 404) return { error: "Repository not found or private.", status };
  if (status === 403) {
    const json = await res.json().catch(() => ({})) as { message?: string };
    const msg = json?.message ?? "";
    if (msg.includes("rate limit") || msg.includes("API rate limit"))
      return { error: "GitHub API rate limit. Try again in an hour or set GITHUB_TOKEN.", status };
    return { error: "Access denied (403). Check repo visibility and GITHUB_TOKEN.", status };
  }
  if (status === 401) return { error: "Invalid GITHUB_TOKEN or token expired.", status };
  return { error: `GitHub API error (${status}).`, status };
}

type RepoResponse = {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  default_branch: string;
  has_issues: boolean;
  has_wiki: boolean;
  license: { spdx_id: string } | null;
  updated_at: string;
  created_at: string;
  open_issues_count: number;
};

type ContentResponse = { content?: string; encoding?: string };

type DirItem = { name: string; type: string };

const DANGEROUS_ENV_FILES = [".env", ".env.local", ".env.development", ".env.production", ".env.prod"];
const SAFE_ENV_FILES = [".env.example", ".env.sample", ".env.example.local", ".env.template"];
const LOCK_FILES = ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"];

/** Fetch repo root file list once (reused for env, SECURITY.md, lock). */
async function getRepoRoot(owner: string, repo: string): Promise<DirItem[]> {
  const list = await fetchGitHub<DirItem[]>(`/repos/${owner}/${repo}/contents`);
  return Array.isArray(list) ? list : [];
}

function checkExposedEnvFromList(list: DirItem[]): string[] {
  const exposed: string[] = [];
  for (const item of list) {
    if (item.type !== "file") continue;
    const name = item.name;
    if (SAFE_ENV_FILES.some((s) => name === s || name.startsWith(s + "."))) continue;
    if (name === ".env" || DANGEROUS_ENV_FILES.includes(name)) exposed.push(name);
    if (name.startsWith(".env.") && !name.endsWith(".example")) exposed.push(name);
  }
  return exposed;
}

function hasSecurityMd(list: DirItem[]): boolean {
  return list.some((x) => x.type === "file" && (x.name === "SECURITY.md" || x.name === "SECURITY.rst"));
}

function hasLockFile(list: DirItem[]): boolean {
  return list.some((x) => x.type === "file" && LOCK_FILES.includes(x.name));
}

function hasReadme(list: DirItem[]): boolean {
  return list.some(
    (x) => x.type === "file" && /^readme\.(md|txt|rst)$/i.test(x.name)
  );
}

function hasContributing(list: DirItem[]): boolean {
  return list.some(
    (x) => x.type === "file" && /^contributing\.(md|txt|rst)$/i.test(x.name)
  );
}

/** Check if repo has at least one GitHub Actions workflow. */
async function hasCiWorkflow(owner: string, repo: string): Promise<boolean> {
  const list = await fetchGitHub<DirItem[]>(
    `/repos/${owner}/${repo}/contents/.github/workflows`
  );
  return Array.isArray(list) && list.some((x) => x.type === "file");
}

/** Check if .gitignore includes .env so secrets aren't committed. */
async function checkGitignoreEnv(owner: string, repo: string): Promise<boolean> {
  const file = await fetchGitHub<ContentResponse>(`/repos/${owner}/${repo}/contents/.gitignore`);
  if (!file?.content) return false;
  try {
    const text = Buffer.from(file.content, "base64").toString("utf-8").toLowerCase();
    return /\.env/.test(text) || /\.env\*/.test(text);
  } catch {
    return false;
  }
}

/** README: secret-like patterns + use of http:// (should be https). */
async function checkReadme(owner: string, repo: string): Promise<{ sensitive: boolean; hasHttp: boolean }> {
  const file = await fetchGitHub<ContentResponse>(`/repos/${owner}/${repo}/contents/README.md`);
  if (!file?.content) return { sensitive: false, hasHttp: false };
  try {
    const text = Buffer.from(file.content, "base64").toString("utf-8");
    const suspicious = [
      /\b(?:api[_-]?key|apikey|secret|password)\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/i,
      /\bsk-[a-zA-Z0-9]{20,}\b/,
      /\bAKIA[0-9A-Z]{16}\b/,
      /\bghp_[a-zA-Z0-9]{36}\b/,
      /\bgho_[a-zA-Z0-9]{36}\b/,
    ];
    const sensitive = suspicious.some((re) => re.test(text));
    const hasHttp = /\[?[^\]]*\]?\s*\(\s*http:\/\/(?!localhost)/.test(text) || /http:\/\/(?!localhost)[^\s\)]+/.test(text);
    return { sensitive, hasHttp };
  } catch {
    return { sensitive: false, hasHttp: false };
  }
}

/** package.json scripts that could run arbitrary code (eval, curl/wget to external URL). */
function hasDangerousScripts(scripts: Record<string, string> | undefined): boolean {
  if (!scripts || typeof scripts !== "object") return false;
  const dangerous = [
    /\beval\s*\(/,
    /\bcurl\s+https?:\/\/(?!localhost|127\.0\.0\.1)/,
    /\bwget\s+https?:\/\/(?!localhost|127\.0\.0\.1)/,
    /\|\s*(sh|bash)\b/,
  ];
  const allScripts = Object.values(scripts).join(" ");
  return dangerous.some((re) => re.test(allScripts));
}

const SOURCE_EXT = /\.(js|ts|jsx|tsx|py)$/i;
const MAX_SOURCE_FILES = 12;

/** Fetch content of source files from root (and optionally src/) to scan for secrets. */
async function fetchSourceContents(
  owner: string,
  repo: string,
  rootList: DirItem[]
): Promise<string[]> {
  const toFetch: string[] = [];
  for (const item of rootList) {
    if (item.type !== "file") continue;
    if (SOURCE_EXT.test(item.name)) toFetch.push(item.name);
    if (toFetch.length >= MAX_SOURCE_FILES) break;
  }
  const srcDir = rootList.find((x) => x.type === "dir" && x.name === "src");
  if (srcDir && toFetch.length < MAX_SOURCE_FILES) {
    const srcList = await fetchGitHub<DirItem[]>(`/repos/${owner}/${repo}/contents/src`);
    if (Array.isArray(srcList)) {
      for (const item of srcList) {
        if (item.type !== "file" || !SOURCE_EXT.test(item.name)) continue;
        toFetch.push(`src/${item.name}`);
        if (toFetch.length >= MAX_SOURCE_FILES) break;
      }
    }
  }
  const contents: string[] = [];
  for (const path of toFetch.slice(0, MAX_SOURCE_FILES)) {
    const file = await fetchGitHub<ContentResponse>(`/repos/${owner}/${repo}/contents/${path}`);
    if (!file?.content) continue;
    try {
      contents.push(Buffer.from(file.content, "base64").toString("utf-8"));
    } catch {
      // skip binary or bad encoding
    }
  }
  return contents;
}

/** Detect console.log with sensitive-looking args (password, token, apiKey, etc.). */
function hasConsoleLogSecrets(contents: string[]): boolean {
  const re = /console\.log\s*\([^)]*?(password|token|apiKey|api_key|secret|credential|Authorization|Bearer|apikey)/i;
  return contents.some((text) => re.test(text));
}

/** Detect hardcoded secrets: password = "...", apiKey = "...", etc. (string 6+ chars). */
function hasHardcodedSecrets(contents: string[]): boolean {
  const re = /(password|apiKey|api_key|secret|token|apikey)\s*[:=]\s*['"][^'"]{6,}['"]/i;
  return contents.some((text) => re.test(text));
}

// 품질: 기본 없이 항목별 합 = 100 (27+34+14+7+4+3+4+4+3)
const QUALITY_MAX = 100;

type PackageInfo = {
  depCount: number;
  depNames: string[]; // dependency + devDependency 패키지 이름 (npm 조회용, 최대 30개)
  name?: string;
  version?: string;
  description?: string;
  scripts?: Record<string, string>;
  hasTestScript: boolean;
  hasRepositoryField: boolean;
};

async function getPackageInfo(owner: string, repo: string): Promise<PackageInfo> {
  const content = await fetchGitHub<ContentResponse>(
    `/repos/${owner}/${repo}/contents/package.json`
  );
  const empty: PackageInfo = {
    depCount: -1,
    depNames: [],
    hasTestScript: false,
    hasRepositoryField: false,
  };
  if (!content?.content) return empty;
  try {
    const raw = Buffer.from(content.content, "base64").toString("utf-8");
    const json = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      name?: string;
      version?: string;
      description?: string;
      scripts?: Record<string, string>;
      repository?: string | { url?: string; type?: string };
    };
    const depKeys = Object.keys(json.dependencies ?? {});
    const devKeys = Object.keys(json.devDependencies ?? {});
    const allNames = [...new Set([...depKeys, ...devKeys])].slice(0, 30);
    const deps = depKeys.length;
    const devDeps = devKeys.length;
    const name = typeof json.name === "string" ? json.name : undefined;
    const version = typeof json.version === "string" ? json.version : "latest";
    const description = typeof json.description === "string" ? json.description : undefined;
    const scripts = json.scripts && typeof json.scripts === "object" ? json.scripts : undefined;
    const hasTestScript =
      typeof scripts?.test === "string" && scripts.test.trim().length > 0;
    const repoField = json.repository;
    const hasRepositoryField =
      repoField != null &&
      (typeof repoField === "string" || (typeof repoField === "object" && "url" in repoField));
    return {
      depCount: deps + devDeps,
      depNames: allNames,
      name,
      version,
      description,
      scripts,
      hasTestScript,
      hasRepositoryField: !!hasRepositoryField,
    };
  } catch {
    return empty;
  }
}

// 의존성 위험: 개수만 점수화 (0~25점 만점). 나머지는 lock/활동/라이선스로 별도
function scoreDepCountPoints(depCount: number): number {
  if (depCount < 0) return 25;
  if (depCount <= 25) return 25;
  if (depCount <= 60) return 15;
  if (depCount <= 100) return 10;
  return Math.max(5, 10 - Math.floor((depCount - 100) / 50));
}

const NPM_REGISTRY = "https://registry.npmjs.org";
const MAX_DEPS_LICENSE_CHECK = 20; // npm 조회 수 제한
const COPYLEFT_PATTERN = /^(GPL|AGPL|LGPL|SSPL)/i;

/** npm 레지스트리에서 패키지의 license 필드 조회 (최신 버전 기준) */
async function fetchNpmLicense(packageName: string): Promise<string | null> {
  try {
    const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(packageName)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      license?: string | { type?: string };
      versions?: Record<string, { license?: string | { type?: string } }>;
    };
    if (typeof data.license === "string") return data.license;
    if (data.license && typeof data.license === "object" && typeof data.license.type === "string")
      return data.license.type;
    const versions = data.versions && typeof data.versions === "object" ? Object.keys(data.versions) : [];
    const latest = versions[versions.length - 1];
    const vLicense = latest && data.versions?.[latest]?.license;
    if (typeof vLicense === "string") return vLicense;
    if (vLicense && typeof vLicense === "object" && typeof (vLicense as { type?: string }).type === "string")
      return (vLicense as { type: string }).type;
    return null;
  } catch {
    return null;
  }
}

/** 의존성 중 GPL/AGPL/LGPL 등 코피레프트(라이선스 충돌 위험) 존재 여부 */
async function checkDependencyLicenseConflicts(
  depNames: string[]
): Promise<{ hasConflict: boolean; conflictingPackages: string[] }> {
  const toCheck = depNames.slice(0, MAX_DEPS_LICENSE_CHECK);
  const conflictingPackages: string[] = [];
  await Promise.all(
    toCheck.map(async (pkg) => {
      const license = await fetchNpmLicense(pkg);
      if (license && COPYLEFT_PATTERN.test(license.trim())) conflictingPackages.push(pkg);
    })
  );
  return { hasConflict: conflictingPackages.length > 0, conflictingPackages };
}

function formatDaysAgo(updatedAt: string): string {
  const days = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "0";
  if (days === 1) return "1";
  return `${days}`;
}

type SecurityChecks = {
  exposedEnvFiles: string[];
  gitignoreHasEnv: boolean;
  readmeSensitive: boolean;
  hasSecurityMd: boolean;
  hasLockFile: boolean;
  dangerousScripts: boolean;
  readmeHasHttp: boolean;
  consoleLogSecrets: boolean;
  hardcodedSecrets: boolean;
};

function buildDetails(
  repo: RepoResponse,
  pkg: PackageInfo,
  scorecardScore: number | null,
  snykIssueCount: number | null,
  socketScore: number | null,
  securityChecks: SecurityChecks,
  rootList: DirItem[],
  hasCi: boolean,
  licenseConflict: { hasConflict: boolean; conflictingPackages: string[] }
): ScoreDetail[] {
  const details: ScoreDetail[] = [];
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // 🔴 보안 (8항목)
  details.push({
    id: "exposed_env",
    category: "security",
    status: securityChecks.exposedEnvFiles.length === 0 ? "good" : "bad",
    value:
      securityChecks.exposedEnvFiles.length > 0
        ? securityChecks.exposedEnvFiles.join(", ")
        : "None found",
  });
  details.push({
    id: "gitignore_env",
    category: "security",
    status: securityChecks.gitignoreHasEnv ? "good" : "warn",
    value: securityChecks.gitignoreHasEnv ? "Yes" : "No or no .gitignore",
  });
  details.push({
    id: "sensitive_readme",
    category: "security",
    status: !securityChecks.readmeSensitive ? "good" : "bad",
    value: securityChecks.readmeSensitive ? "Suspicious pattern found" : "OK",
  });
  details.push({
    id: "console_log_secrets",
    category: "security",
    status: !securityChecks.consoleLogSecrets ? "good" : "bad",
    value: securityChecks.consoleLogSecrets ? "Suspicious pattern" : "OK",
  });
  details.push({
    id: "hardcoded_secrets",
    category: "security",
    status: !securityChecks.hardcodedSecrets ? "good" : "bad",
    value: securityChecks.hardcodedSecrets ? "Found in code" : "OK",
  });
  details.push({
    id: "security_md",
    category: "security",
    status: securityChecks.hasSecurityMd ? "good" : "warn",
    value: securityChecks.hasSecurityMd ? "Present" : "Missing",
  });
  details.push({
    id: "readme_http",
    category: "security",
    status: !securityChecks.readmeHasHttp ? "good" : "warn",
    value: securityChecks.readmeHasHttp ? "Uses http://" : "OK",
  });
  if (pkg.depCount >= 0) {
    details.push({
      id: "dangerous_scripts",
      category: "security",
      status: !securityChecks.dangerousScripts ? "good" : "bad",
      value: securityChecks.dangerousScripts ? "Risky pattern found" : "OK",
    });
  }

  if (scorecardScore != null) {
    details.push({
      id: "scorecard",
      category: "security",
      status: scorecardScore >= 7 ? "good" : scorecardScore >= 4 ? "warn" : "bad",
      value: `${scorecardScore.toFixed(1)}/10`,
    });
  }
  if (snykIssueCount != null) {
    details.push({
      id: "snyk_issues",
      category: "security",
      status: snykIssueCount === 0 ? "good" : snykIssueCount <= 3 ? "warn" : "bad",
      value: `${snykIssueCount} issue(s)`,
    });
  }

  // 🟡 코드 품질 (8항목)
  const effectiveDesc = repo.description || pkg.description;
  details.push({
    id: "description",
    category: "quality",
    status: effectiveDesc && effectiveDesc.length > 10 ? "good" : "warn",
    value: effectiveDesc ? `${effectiveDesc.length} chars` : "None",
  });
  details.push({
    id: "readme_present",
    category: "quality",
    status: hasReadme(rootList) ? "good" : "warn",
    value: hasReadme(rootList) ? "Yes" : "No",
  });
  details.push({
    id: "contributing",
    category: "quality",
    status: hasContributing(rootList) ? "good" : "warn",
    value: hasContributing(rootList) ? "Present" : "Missing",
  });
  details.push({
    id: "ci_workflow",
    category: "quality",
    status: hasCi ? "good" : "warn",
    value: hasCi ? "Yes" : "No",
  });
  if (pkg.depCount >= 0) {
    details.push({
      id: "test_script",
      category: "quality",
      status: pkg.hasTestScript ? "good" : "warn",
      value: pkg.hasTestScript ? "Yes" : "No",
    });
    details.push({
      id: "package_repository",
      category: "quality",
      status: pkg.hasRepositoryField ? "good" : "warn",
      value: pkg.hasRepositoryField ? "Set" : "Missing",
    });
  }
  details.push({
    id: "open_issues",
    category: "quality",
    status: repo.open_issues_count <= 20 ? "good" : repo.open_issues_count <= 50 ? "warn" : "bad",
    value: `${repo.open_issues_count}`,
  });
  details.push({
    id: "repo_size",
    category: "quality",
    status: repo.size > 0 && repo.size < 10000 ? "good" : repo.size >= 10000 ? "warn" : "good",
    value: repo.size > 0 ? `${repo.size} KB` : "—",
  });

  // 🟢 의존성 위험 (4항목 + socket)
  if (pkg.depCount >= 0) {
    details.push({
      id: "dep_count",
      category: "dependency",
      status: pkg.depCount <= 25 ? "good" : pkg.depCount <= 60 ? "warn" : "bad",
      value: `${pkg.depCount} package(s)`,
    });
    details.push({
      id: "lock_file",
      category: "dependency",
      status: securityChecks.hasLockFile ? "good" : "warn",
      value: securityChecks.hasLockFile ? "Present" : "Missing",
    });
  } else {
    details.push({
      id: "dep_count",
      category: "dependency",
      status: "good",
      value: "No package.json",
    });
  }
  details.push({
    id: "recent_activity",
    category: "dependency",
    status: daysSinceUpdate < 90 ? "good" : daysSinceUpdate < 180 ? "warn" : "bad",
    value: formatDaysAgo(repo.updated_at),
  });
  details.push({
    id: "license",
    category: "dependency",
    status: licenseConflict.hasConflict ? "bad" : "good",
    value: licenseConflict.hasConflict
      ? `GPL/AGPL 등: ${licenseConflict.conflictingPackages.join(", ")}`
      : (repo.license?.spdx_id ?? "No conflict detected"),
  });
  if (socketScore != null) {
    const pct = Math.round(socketScore * 100);
    details.push({
      id: "socket_score",
      category: "dependency",
      status: pct >= 70 ? "good" : pct >= 40 ? "warn" : "bad",
      value: `${pct}%`,
    });
  }

  return details;
}

/**
 * Scans a GitHub repo URL and returns security/quality scores using GitHub API.
 * Set GITHUB_TOKEN in .env.local for higher rate limit (5000/hr vs 60/hr).
 */
export async function scanRepo(url: string): Promise<ScanResult> {
  const parsed = parseRepoUrl(url);
  if (!parsed) {
    return {
      repoUrl: url,
      security: 0,
      quality: 0,
      dependencyRisk: 0,
      totalScore: 0,
      grade: "D",
    };
  }

  const { username: owner, repo } = parsed;
  const repoResult = await fetchRepoOrError(owner, repo);
  if ("error" in repoResult) {
    const err = new Error(repoResult.error) as Error & { status?: number };
    err.status = repoResult.status;
    throw err;
  }
  const repoData = repoResult.data;

  const [packageInfo, rootList, scorecardResult, snykCount, gitignoreEnv, readmeChecks, hasCi] =
    await Promise.all([
      getPackageInfo(owner, repo),
      getRepoRoot(owner, repo),
      fetchScorecard(owner, repo),
      process.env.SNYK_TOKEN && process.env.SNYK_ORG_ID
        ? getSnykIssueCount(process.env.SNYK_ORG_ID, url)
        : Promise.resolve(null),
      checkGitignoreEnv(owner, repo),
      checkReadme(owner, repo),
      hasCiWorkflow(owner, repo),
    ]);

  const socketScore =
    process.env.SOCKET_API_KEY && packageInfo.name && packageInfo.version
      ? await fetchSocketScore(packageInfo.name, packageInfo.version)
      : null;

  const licenseConflict =
    packageInfo.depNames.length > 0
      ? await checkDependencyLicenseConflicts(packageInfo.depNames)
      : { hasConflict: false, conflictingPackages: [] as string[] };

  const sourceContents = await fetchSourceContents(owner, repo, rootList);
  const consoleLogSecrets = hasConsoleLogSecrets(sourceContents);
  const hardcodedSecrets = hasHardcodedSecrets(sourceContents);

  const exposedEnv = checkExposedEnvFromList(rootList);
  const securityChecks: SecurityChecks = {
    exposedEnvFiles: exposedEnv,
    gitignoreHasEnv: gitignoreEnv,
    readmeSensitive: readmeChecks.sensitive,
    hasSecurityMd: hasSecurityMd(rootList),
    hasLockFile: hasLockFile(rootList),
    dangerousScripts: hasDangerousScripts(packageInfo.scripts),
    readmeHasHttp: readmeChecks.hasHttp,
    consoleLogSecrets,
    hardcodedSecrets,
  };

  // 🔴 보안: 8항목, 각 12.5점, 합 100
  const SEC_ITEM = 12.5;
  const securityBreakdown: ScoreBreakdownItem[] = [];
  const secExposed = exposedEnv.length === 0 ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "exposedEnv", points: secExposed, max: SEC_ITEM });
  const secGitignore = securityChecks.gitignoreHasEnv ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "gitignoreEnv", points: secGitignore, max: SEC_ITEM });
  const secReadme = !readmeChecks.sensitive ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "sensitiveReadme", points: secReadme, max: SEC_ITEM });
  const secConsole = !securityChecks.consoleLogSecrets ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "consoleLogSecrets", points: secConsole, max: SEC_ITEM });
  const secHardcoded = !securityChecks.hardcodedSecrets ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "hardcodedSecrets", points: secHardcoded, max: SEC_ITEM });
  const secMd = securityChecks.hasSecurityMd ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "securityMd", points: secMd, max: SEC_ITEM });
  const secHttp = !securityChecks.readmeHasHttp ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "readmeHttp", points: secHttp, max: SEC_ITEM });
  const secScripts = (packageInfo.depCount < 0 || !securityChecks.dangerousScripts) ? SEC_ITEM : 0;
  securityBreakdown.push({ item: "dangerousScripts", points: secScripts, max: SEC_ITEM });
  const security = clamp(Math.round(securityBreakdown.reduce((a, x) => a + x.points, 0)));

  // 🟡 코드 품질: 8항목, 합 100 (설명12, readme12, contributing12, ci12, test12, repo12, open_issues14, size14)
  const qualityBreakdown: ScoreBreakdownItem[] = [];
  const qDescMax = 12;
  const qDesc = (repoData.description && repoData.description.length > 10) || (packageInfo.description && packageInfo.description.length > 10) ? qDescMax : 0;
  qualityBreakdown.push({ item: "description", points: qDesc, max: qDescMax });
  const readmeMax = 12;
  qualityBreakdown.push({ item: "readme", points: hasReadme(rootList) ? readmeMax : 0, max: readmeMax });
  const contribMax = 12;
  qualityBreakdown.push({ item: "contributing", points: hasContributing(rootList) ? contribMax : 0, max: contribMax });
  const ciMax = 12;
  qualityBreakdown.push({ item: "ci", points: hasCi ? ciMax : 0, max: ciMax });
  const testMax = 12;
  qualityBreakdown.push({ item: "testScript", points: packageInfo.hasTestScript ? testMax : 0, max: testMax });
  const repoMax = 12;
  qualityBreakdown.push({ item: "packageRepo", points: packageInfo.hasRepositoryField ? repoMax : 0, max: repoMax });
  const openIssuesMax = 14;
  const qOpen = repoData.open_issues_count <= 20 ? openIssuesMax : repoData.open_issues_count <= 50 ? 7 : 0;
  qualityBreakdown.push({ item: "openIssues", points: qOpen, max: openIssuesMax });
  const sizeMax = 14;
  const qSize = repoData.size > 0 && repoData.size < 5000 ? sizeMax : repoData.size >= 5000 && repoData.size < 10000 ? 7 : 0;
  qualityBreakdown.push({ item: "size", points: qSize, max: sizeMax });
  const quality = clamp(qualityBreakdown.reduce((a, x) => a + x.points, 0));

  // 🟢 의존성 위험: 4항목 각 25점, 합 100. (개수, 락파일, 최근업데이트, 라이선스)
  const updated = new Date(repoData.updated_at).getTime();
  const daysSince = (Date.now() - updated) / (1000 * 60 * 60 * 24);
  const depCountPts = scoreDepCountPoints(packageInfo.depCount);
  const lockPts = packageInfo.depCount >= 0 && securityChecks.hasLockFile ? 25 : packageInfo.depCount < 0 ? 25 : 0;
  const activityPts = daysSince < 30 ? 25 : daysSince < 90 ? 15 : daysSince < 180 ? 10 : 0;
  const licensePts = licenseConflict.hasConflict ? 0 : 25;
  const dependencyBreakdown: ScoreBreakdownItem[] = [];
  dependencyBreakdown.push({ item: "depCount", points: depCountPts, max: 25 });
  dependencyBreakdown.push({ item: "lockFile", points: packageInfo.depCount >= 0 ? (securityChecks.hasLockFile ? 25 : 0) : 25, max: 25 });
  dependencyBreakdown.push({ item: "recentActivity", points: activityPts, max: 25 });
  dependencyBreakdown.push({ item: "license", points: licensePts, max: 25 });
  let dependencyRisk = clamp(depCountPts + lockPts + activityPts + licensePts);
  if (socketScore != null) {
    const socket100 = socketScoreTo100(socketScore);
    dependencyRisk = clamp(Math.round((dependencyRisk + socket100) / 2));
  }

  // 총점: 보안 40% + 코드품질 35% + 의존성 25%
  const totalScore = Math.round(security * 0.40 + quality * 0.35 + dependencyRisk * 0.25);
  const grade = getGrade(totalScore);

  const details = buildDetails(
    repoData,
    packageInfo,
    scorecardResult?.score ?? null,
    snykCount,
    socketScore,
    securityChecks,
    rootList,
    hasCi,
    licenseConflict
  );

  return {
    repoUrl: url,
    security,
    quality,
    dependencyRisk,
    totalScore,
    grade,
    details,
    qualityBreakdown,
    securityBreakdown,
    dependencyBreakdown,
  };
}

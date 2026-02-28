import { parseRepoUrl } from "./repo";
import type { ScanResult, ScoreDetail } from "./types";
import { fetchScorecard, scorecardTo100 } from "./scorecard";
import { getSnykIssueCount, snykIssuesToSecurityPenalty } from "./snyk";
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

// Security: 라이선스, 최근 활동, 이슈 트래커
function scoreSecurity(repo: RepoResponse): number {
  let s = 50;
  if (repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION") s += 25;
  const updated = new Date(repo.updated_at).getTime();
  const daysSinceUpdate = (Date.now() - updated) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) s += 15;
  else if (daysSinceUpdate < 90) s += 10;
  else if (daysSinceUpdate < 180) s += 5;
  if (repo.has_issues) s += 10;
  return clamp(s);
}

// Quality: 설명, 스타, 크기, 이슈
function scoreQuality(repo: RepoResponse): number {
  let q = 40;
  if (repo.description && repo.description.length > 10) q += 20;
  const stars = Math.min(repo.stargazers_count, 1000);
  q += Math.min(25, Math.floor(stars / 40));
  if (repo.size > 0 && repo.size < 5000) q += 10;
  if (repo.has_issues) q += 5;
  return clamp(q);
}

type PackageInfo = {
  depCount: number;
  name?: string;
  version?: string;
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
      scripts?: Record<string, string>;
      repository?: string | { url?: string; type?: string };
    };
    const deps = Object.keys(json.dependencies ?? {}).length;
    const devDeps = Object.keys(json.devDependencies ?? {}).length;
    const name = typeof json.name === "string" ? json.name : undefined;
    const version = typeof json.version === "string" ? json.version : "latest";
    const scripts = json.scripts && typeof json.scripts === "object" ? json.scripts : undefined;
    const hasTestScript =
      typeof scripts?.test === "string" && scripts.test.trim().length > 0;
    const repoField = json.repository;
    const hasRepositoryField =
      repoField != null &&
      (typeof repoField === "string" || (typeof repoField === "object" && "url" in repoField));
    return {
      depCount: deps + devDeps,
      name,
      version,
      scripts,
      hasTestScript,
      hasRepositoryField: !!hasRepositoryField,
    };
  } catch {
    return empty;
  }
}

// Dependency Risk: 의존성 개수 (적을수록 높은 점수)
function scoreDependencyRisk(depCount: number): number {
  if (depCount < 0) return 75;
  if (depCount === 0) return 95;
  if (depCount <= 10) return 90;
  if (depCount <= 25) return 80;
  if (depCount <= 50) return 70;
  if (depCount <= 100) return 60;
  return Math.max(40, 70 - Math.floor(depCount / 20));
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
};

function buildDetails(
  repo: RepoResponse,
  pkg: PackageInfo,
  scorecardScore: number | null,
  snykIssueCount: number | null,
  socketScore: number | null,
  securityChecks: SecurityChecks,
  rootList: DirItem[],
  hasCi: boolean
): ScoreDetail[] {
  const details: ScoreDetail[] = [];
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(repo.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  details.push({
    id: "license",
    category: "security",
    status: repo.license?.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? "good" : "bad",
    value: repo.license?.spdx_id ?? undefined,
  });
  details.push({
    id: "recent_activity",
    category: "security",
    status: daysSinceUpdate < 90 ? "good" : daysSinceUpdate < 180 ? "warn" : "bad",
    value: formatDaysAgo(repo.updated_at),
  });
  details.push({
    id: "issues_enabled",
    category: "security",
    status: repo.has_issues ? "good" : "warn",
    value: repo.has_issues ? "Yes" : "No",
  });

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
    id: "security_md",
    category: "security",
    status: securityChecks.hasSecurityMd ? "good" : "warn",
    value: securityChecks.hasSecurityMd ? "Present" : "Missing",
  });
  if (pkg.depCount >= 0) {
    details.push({
      id: "lock_file",
      category: "security",
      status: securityChecks.hasLockFile ? "good" : "warn",
      value: securityChecks.hasLockFile ? "Present" : "Missing",
    });
    details.push({
      id: "dangerous_scripts",
      category: "security",
      status: !securityChecks.dangerousScripts ? "good" : "bad",
      value: securityChecks.dangerousScripts ? "Risky pattern found" : "OK",
    });
  }
  details.push({
    id: "readme_http",
    category: "security",
    status: !securityChecks.readmeHasHttp ? "good" : "warn",
    value: securityChecks.readmeHasHttp ? "Uses http://" : "OK",
  });

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

  details.push({
    id: "description",
    category: "quality",
    status: repo.description && repo.description.length > 10 ? "good" : "warn",
    value: repo.description ? `${repo.description.length} chars` : "None",
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
    id: "open_issues",
    category: "quality",
    status: repo.open_issues_count <= 20 ? "good" : repo.open_issues_count <= 50 ? "warn" : "bad",
    value: `${repo.open_issues_count}`,
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
    id: "stars",
    category: "quality",
    status: repo.stargazers_count >= 10 ? "good" : repo.stargazers_count >= 1 ? "warn" : "good",
    value: `${repo.stargazers_count}`,
  });
  details.push({
    id: "repo_size",
    category: "quality",
    status: repo.size > 0 && repo.size < 10000 ? "good" : repo.size >= 10000 ? "warn" : "good",
    value: repo.size > 0 ? `${repo.size} KB` : "—",
  });

  if (pkg.depCount >= 0) {
    details.push({
      id: "dep_count",
      category: "dependency",
      status: pkg.depCount <= 25 ? "good" : pkg.depCount <= 60 ? "warn" : "bad",
      value: `${pkg.depCount} package(s)`,
    });
  } else {
    details.push({
      id: "dep_count",
      category: "dependency",
      status: "good",
      value: "No package.json",
    });
  }
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

  const exposedEnv = checkExposedEnvFromList(rootList);
  const securityChecks: SecurityChecks = {
    exposedEnvFiles: exposedEnv,
    gitignoreHasEnv: gitignoreEnv,
    readmeSensitive: readmeChecks.sensitive,
    hasSecurityMd: hasSecurityMd(rootList),
    hasLockFile: hasLockFile(rootList),
    dangerousScripts: hasDangerousScripts(packageInfo.scripts),
    readmeHasHttp: readmeChecks.hasHttp,
  };

  let securityBase = scoreSecurity(repoData);
  if (exposedEnv.length > 0) securityBase = Math.max(0, securityBase - 40);
  if (readmeChecks.sensitive) securityBase = Math.max(0, securityBase - 30);
  if (!gitignoreEnv && packageInfo.depCount >= 0) securityBase = Math.max(0, securityBase - 10);
  if (securityChecks.hasSecurityMd) securityBase = Math.min(100, securityBase + 5);
  if (securityChecks.hasLockFile && packageInfo.depCount >= 0) securityBase = Math.min(100, securityBase + 5);
  if (securityChecks.dangerousScripts) securityBase = Math.max(0, securityBase - 25);
  if (securityChecks.readmeHasHttp) securityBase = Math.max(0, securityBase - 5);

  let quality = scoreQuality(repoData);
  if (hasReadme(rootList)) quality = Math.min(100, quality + 3);
  if (hasContributing(rootList)) quality = Math.min(100, quality + 2);
  if (hasCi) quality = Math.min(100, quality + 3);
  if (packageInfo.depCount >= 0) {
    if (packageInfo.hasTestScript) quality = Math.min(100, quality + 3);
    if (packageInfo.hasRepositoryField) quality = Math.min(100, quality + 2);
  }
  quality = clamp(quality);
  const depRiskBase = clamp(scoreDependencyRisk(packageInfo.depCount));

  let security = clamp(securityBase);
  if (scorecardResult?.score != null) {
    const sc100 = scorecardTo100(scorecardResult.score);
    security = Math.round((security + sc100) / 2);
  }
  if (snykCount != null) {
    security = clamp(security - snykIssuesToSecurityPenalty(snykCount));
  }
  security = clamp(security);

  let dependencyRisk = depRiskBase;
  if (socketScore != null) {
    const socket100 = socketScoreTo100(socketScore);
    dependencyRisk = clamp(Math.round((depRiskBase + socket100) / 2));
  }

  const totalScore = Math.round((security + quality + dependencyRisk) / 3);
  const grade = getGrade(totalScore);

  const details = buildDetails(
    repoData,
    packageInfo,
    scorecardResult?.score ?? null,
    snykCount,
    socketScore,
    securityChecks,
    rootList,
    hasCi
  );

  return {
    repoUrl: url,
    security,
    quality,
    dependencyRisk,
    totalScore,
    grade,
    details,
  };
}

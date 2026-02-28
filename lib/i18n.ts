export type Locale = "en" | "ko" | "ja";

export const defaultLocale: Locale = "en";

const localeMap: Record<string, Locale> = {
  en: "en",
  ko: "ko",
  "ko-KR": "ko",
  ja: "ja",
  "ja-JP": "ja",
};

export function getLocaleFromLanguageTag(tag: string): Locale {
  const lower = tag.split("-")[0].toLowerCase();
  return localeMap[tag] ?? localeMap[lower] ?? defaultLocale;
}

export const messages: Record<
  Locale,
  {
    home: {
      heroTitle: string;
      heroSubtitle: string;
      scopeNote: string;
      placeholder: string;
      scanNow: string;
      demo: string;
      security: string;
      codeQuality: string;
      dependencyRisk: string;
      trySample: string;
    };
    errors: {
      urlRequired: string;
      urlMustStartWith: string;
    };
    result: {
      back: string;
      scanning: string;
      loading: string;
      breakdown: string;
      grade: string;
      badge: string;
      preview: string;
      addToReadme: string;
      badgeReadmeExplain: string;
      copy: string;
      copied: string;
      shareToX: string;
      scoreCriteriaTitle: string;
      scoreCriteriaSecurity: string;
      scoreCriteriaQuality: string;
      scoreCriteriaDeps: string;
      detailsTitle: string;
      scanErrorTitle: string;
      improveTip: string;
      detailGood: string;
      plainTitle: string;
      plainIntro: string;
      plainSecurityWhat: string;
      plainSecurityExample: string;
      plainQualityWhat: string;
      plainQualityExample: string;
      plainDependencyWhat: string;
      plainDependencyExample: string;
      plainTermsTitle: string;
      plainTermLabel: { env: string; secrets: string; readme: string; lockFile: string; ci: string; license: string };
      plainTerms: {
        env: string;
        secrets: string;
        readme: string;
        lockFile: string;
        ci: string;
        license: string;
      };
      details: {
        license: { label: string; tip: string; plain: string };
        recent_activity: { label: string; tip: string; plain: string };
        issues_enabled: { label: string; tip: string; plain: string };
        scorecard: { label: string; tip: string; plain: string };
        snyk_issues: { label: string; tip: string; plain: string };
        exposed_env: { label: string; tip: string; plain: string };
        gitignore_env: { label: string; tip: string; plain: string };
        sensitive_readme: { label: string; tip: string; plain: string };
        security_md: { label: string; tip: string; plain: string };
        lock_file: { label: string; tip: string; plain: string };
        dangerous_scripts: { label: string; tip: string; plain: string };
        readme_http: { label: string; tip: string; plain: string };
        console_log_secrets: { label: string; tip: string; plain: string };
        hardcoded_secrets: { label: string; tip: string; plain: string };
        description: { label: string; tip: string; plain: string };
        readme_present: { label: string; tip: string; plain: string };
        contributing: { label: string; tip: string; plain: string };
        open_issues: { label: string; tip: string; plain: string };
        ci_workflow: { label: string; tip: string; plain: string };
        test_script: { label: string; tip: string; plain: string };
        package_repository: { label: string; tip: string; plain: string };
        stars: { label: string; tip: string; plain: string };
        repo_size: { label: string; tip: string; plain: string };
        dep_count: { label: string; tip: string; plain: string };
        socket_score: { label: string; tip: string; plain: string };
      };
      detailPlainToggle: string;
      breakdownTitle: string;
      breakdownSumLabel: string;
      breakdownItems: Record<string, string>;
    };
    meta: {
      title: string;
      description: string;
    };
  }
> = {
  en: {
    home: {
      heroTitle: "Safe Vibes Only.\nCheck Your Vibe Code.",
      heroSubtitle:
        "Paste your GitHub repository URL and get a security report in seconds.",
      scopeNote: "Scoring is based on JavaScript/Node.js web projects.\nSome items may not apply to mobile apps or other project types.",
      placeholder: "https://github.com/username/repo",
      scanNow: "Scan Now",
      demo: "Demo",
      security: "Security",
      codeQuality: "Code Quality",
      dependencyRisk: "Dependency Risk",
      trySample: "Try with a sample repo",
    },
    errors: {
      urlRequired: "Please enter a GitHub repository URL.",
      urlMustStartWith: "URL must start with https://github.com/",
    },
    result: {
      back: "← Back",
      scanning: "Scanning repository...",
      loading: "Loading...",
      breakdown: "Breakdown",
      grade: "Grade",
      badge: "Badge",
      preview: "Preview",
      addToReadme: "Add this to your README:",
      badgeReadmeExplain: "Add this badge to your GitHub README to show your security score on your repo.",
      copy: "Copy",
      copied: "Copied!",
      shareToX: "Share to X",
      scoreCriteriaTitle: "How we score",
      scoreCriteriaSecurity: "Security (40%): Exposed .env, .gitignore has .env, README secrets, console.log secrets, hardcoded secrets, SECURITY.md, HTTPS links, npm script safety. 8 items, 100 points.",
      scoreCriteriaQuality: "Code quality (35%): Repo description, README, CONTRIBUTING, CI/Actions, test script, package.json repository, open issues count, repo size. 8 items, 100 points.",
      scoreCriteriaDeps: "Dependency risk (25%): Dependency count, lock file, recent updates, license. 4 items, 100 points. Socket.dev blended when configured.",
      detailsTitle: "What we checked",
      scanErrorTitle: "Scan failed",
      improveTip: "How to improve",
      detailGood: "Good",
      plainTitle: "In plain language",
      plainIntro: "If you’re not a developer (e.g. you’re evaluating or buying this code), here’s what the scores mean and what can go wrong.",
      plainSecurityWhat: "Security = Are secrets and access keys kept out of the code?",
      plainSecurityExample: "Example: If real passwords or API keys are written in the code or in a file that’s published, anyone who sees the repo could use them to break into your service or steal data.",
      plainQualityWhat: "Code quality = Is the project documented and maintainable?",
      plainQualityExample: "Example: No README or no tests means future changes are riskier and harder to verify. No CI means nobody automatically checks that the code still works.",
      plainDependencyWhat: "Dependency risk = Are the external libraries used by this code safe and up to date?",
      plainDependencyExample: "Example: Too many or unmaintained libraries can have known security holes. No lock file means different people might get different versions and different behavior.",
      plainTermsTitle: "Terms explained",
      plainTermLabel: { env: "Environment variables", secrets: "Secrets", readme: "README", lockFile: "Lock file", ci: "CI / Actions", license: "License" },
      plainTerms: {
        env: "Environment variables: Values like API keys or DB passwords. They should live in a separate file (e.g. .env), and that file must never be committed or published.",
        secrets: "Secrets: Passwords, API keys, tokens. If these appear in the code or in README, they are exposed. Anyone can use them.",
        readme: "README: The main description file for the project. It should explain what it does and how to run it—without containing real secrets.",
        lockFile: "Lock file: A file that pins exact library versions (e.g. package-lock.json). Without it, installs can differ and cause “works on my machine” or supply-chain issues.",
        ci: "CI / Actions: Automated checks that run when code is pushed (e.g. tests, lint). They help catch bugs before they reach production.",
        license: "License: Tells others how they may use the code (e.g. MIT, Apache). No license often means “all rights reserved” and unclear usage.",
      },
      details: {
        license: { label: "License", tip: "Add a LICENSE file so others know how they can use your code (e.g. MIT, Apache 2.0).", plain: "In plain language: A document that says how others may use this code. Without it, usage rights are unclear." },
        recent_activity: { label: "Recent updates", tip: "Update your repo regularly. Fix issues and update dependencies to stay secure.", plain: "In plain language: When the code was last changed. If it’s been a long time, the project might be abandoned or outdated." },
        issues_enabled: { label: "Issues enabled", tip: "Turn on Issues in repo Settings so people can report bugs and security problems.", plain: "In plain language: A way for people to report bugs or security problems. If it’s off, problems are harder to report." },
        scorecard: { label: "OpenSSF Scorecard", tip: "Run the Scorecard GitHub Action, add a SECURITY.md file, and pin dependencies in workflows.", plain: "In plain language: An automated security check. Higher score means the project follows more security best practices." },
        snyk_issues: { label: "Snyk issues", tip: "Fix or acknowledge issues in Snyk. Update vulnerable dependencies and apply patches.", plain: "In plain language: Known security issues in the libraries this code uses. Fewer is better." },
        exposed_env: { label: "Env files in repo", tip: "Never commit .env or .env.local—they often contain secrets. Add them to .gitignore and use .env.example with fake values only.", plain: "In plain language: Files that hold secret values (passwords, API keys) were found in the published code. Anyone who sees the repo can use them. If you already added .env to .gitignore but it still shows here, the file was committed before that—once a file is in the repo, .gitignore doesn’t remove it. Run: git rm --cached .env (and .env.local if needed), then commit and push. After that, rotate any secrets that were in those files." },
        gitignore_env: { label: ".gitignore has .env", tip: "Add .env and .env.local to .gitignore so you don't accidentally commit secrets.", plain: "In plain language: The project is set up so that secret files are not pushed to the repo. If this is missing, secrets can be uploaded by mistake." },
        sensitive_readme: { label: "README contains secrets?", tip: "Don’t put real API keys or passwords in README. Use placeholders (e.g. YOUR_API_KEY) and only describe where to get the real value.", plain: "In plain language: The main project description file contains what looks like real passwords or API keys. Anyone who sees the repo can use them." },
        security_md: { label: "SECURITY.md", tip: "Add a SECURITY.md file explaining how to report vulnerabilities. GitHub shows it in the Security tab.", plain: "In plain language: A file that explains how to report security problems. Without it, people don't know where to report them." },
        lock_file: { label: "Lock file", tip: "Commit package-lock.json (or yarn.lock / pnpm-lock.yaml) so everyone installs the same dependency versions and reduces supply-chain risk.", plain: "In plain language: A file that pins the exact versions of libraries. Without it, different people or servers can get different versions and different behavior." },
        dangerous_scripts: { label: "npm scripts", tip: "Avoid scripts that run eval, curl/wget to external URLs, or exec arbitrary code. They can be abused if someone runs npm install then run a script.", plain: "In plain language: The project has scripts that could run unsafe commands. These can be misused during install or build." },
        readme_http: { label: "Links use HTTPS", tip: "Use https:// in README links instead of http:// so traffic is encrypted and visitors aren’t sent to insecure pages.", plain: "In plain language: Some links in the description use http instead of https. Unencrypted links can be tampered with; https is safer." },
        console_log_secrets: { label: "console.log with secrets?", tip: "Remove any console.log that prints passwords, tokens, or API keys. Debug logs with secrets often get committed by mistake and leak in production or in the repo.", plain: "In plain language: The code contains console.log that looks like it might print passwords or API keys. These debug lines are often left in by mistake and expose secrets to anyone who runs the app or sees the code." },
        hardcoded_secrets: { label: "Hardcoded secrets in code?", tip: "Never put passwords or API keys directly in source code. Use environment variables (.env) or a secrets manager and load them at runtime.", plain: "In plain language: Passwords or API keys are written directly in the code (e.g. password = \"abc123\"). Anyone with access to the repo can see and use them. Move secrets to .env or a secure config and never commit them." },
        description: { label: "Repo description", tip: "Add a short description at the top of your repo so visitors understand what it does.", plain: "In plain language: A short line that says what this project does. Without it, visitors can’t quickly tell what the code is for." },
        readme_present: { label: "README file", tip: "Add a README.md so others know what the project does and how to run it.", plain: "In plain language: The main document that explains what the project does and how to run it. Without it, new users or buyers don’t know where to start." },
        contributing: { label: "CONTRIBUTING", tip: "Add CONTRIBUTING.md to explain how others can contribute (good for open source).", plain: "In plain language: A file that explains how others can contribute. Good for open-source or team projects." },
        open_issues: { label: "Open issues", tip: "Keeping open issues low shows the project is maintained. Close or triage old issues.", plain: "In plain language: Number of reported bugs or tasks that aren’t closed yet. Very high can mean the project is overwhelmed or not maintained." },
        ci_workflow: { label: "CI / Actions", tip: "Add .github/workflows to run tests or lint on push. Improves reliability.", plain: "In plain language: Automated checks that run when code is pushed. They help catch bugs before they reach production." },
        test_script: { label: "Test script", tip: "Add a \"test\" script in package.json (e.g. npm test) so others can run tests.", plain: "In plain language: A way to run tests with one command. Without it, it’s harder to verify that the code still works after changes." },
        package_repository: { label: "package.json repository", tip: "Set the \"repository\" field in package.json so the package links to the source.", plain: "In plain language: The package file points to the source code. That helps users and tools find the repo." },
        stars: { label: "Stars", tip: "Share your repo so others can find and star it. Good docs and a clear README help.", plain: "In plain language: How many people have marked the repo as interesting. More often means more visibility." },
        repo_size: { label: "Repo size", tip: "Keep the repo lean. Use .gitignore for build outputs and avoid committing large files.", plain: "In plain language: How big the codebase is. Very large can mean unnecessary files are included." },
        dep_count: { label: "Number of dependencies", tip: "Fewer dependencies = less to maintain and less risk. Remove unused packages.", plain: "In plain language: How many external libraries the project uses. More means more to maintain and more potential for issues." },
        socket_score: { label: "Package health (Socket)", tip: "Check Socket.dev for risky packages. Prefer well-maintained, popular libraries.", plain: "In plain language: A score for how healthy the main libraries are. Higher is better." },
      },
      detailPlainToggle: "In plain language",
      breakdownTitle: "Score breakdown",
      breakdownSumLabel: "Sum: {sum} → final {score}",
      breakdownItems: {
        quality_description: "Repo description",
        quality_readme: "README",
        quality_contributing: "CONTRIBUTING",
        quality_ci: "CI / Actions",
        quality_testScript: "Test script",
        quality_packageRepo: "package.json repository",
        quality_openIssues: "Open issues",
        quality_size: "Repo size",
        security_exposedEnv: "Exposed .env",
        security_gitignoreEnv: ".gitignore has .env",
        security_sensitiveReadme: "Secrets in README",
        security_consoleLogSecrets: "console.log with secrets",
        security_hardcodedSecrets: "Hardcoded secrets",
        security_securityMd: "SECURITY.md",
        security_readmeHttp: "Links use HTTPS",
        security_dangerousScripts: "npm script safety",
        dependency_depCount: "Dependency count",
        dependency_lockFile: "Lock file",
        dependency_recentActivity: "Recent updates",
        dependency_license: "License",
      },
    },
    meta: {
      title: "SafeVibesOnly - Safe Vibes Only. Check Your Vibe Code.",
      description:
        "Paste your GitHub repo URL and get a security score in seconds.",
    },
  },
  ko: {
    home: {
      heroTitle: "Safe Vibes Only.\n바이브 코드를 점검하세요.",
      heroSubtitle:
        "GitHub 저장소 URL을 붙여넣으면 몇 초 만에 보안 리포트를 받을 수 있습니다.",
      scopeNote: "점수는 JavaScript/Node.js 웹 프로젝트 기준입니다.\n모바일 앱 등 다른 종류의 프로젝트에는 해당하지 않는 항목이 있을 수 있습니다.",
      placeholder: "https://github.com/사용자명/저장소",
      scanNow: "스캔하기",
      demo: "데모",
      security: "보안",
      codeQuality: "코드 품질",
      dependencyRisk: "의존성 위험",
      trySample: "샘플 저장소로 시도하기",
    },
    errors: {
      urlRequired: "GitHub 저장소 URL을 입력해 주세요.",
      urlMustStartWith: "URL은 https://github.com/ 로 시작해야 합니다.",
    },
    result: {
      back: "← 뒤로",
      scanning: "저장소 스캔 중...",
      loading: "로딩 중...",
      breakdown: "세부 점수",
      grade: "등급",
      badge: "배지",
      preview: "미리보기",
      addToReadme: "README에 추가할 코드:",
      badgeReadmeExplain: "GitHub README에 이 뱃지를 추가하면 저장소에서 보안 점수를 보여줄 수 있습니다.",
      copy: "복사",
      copied: "복사됨!",
      shareToX: "X(트위터)로 공유",
      scoreCriteriaTitle: "점수 기준",
      scoreCriteriaSecurity: "보안(40%): 환경변수 파일 노출, .gitignore에 .env, README 비밀, console.log 비밀, 코드 하드코딩 비밀, SECURITY.md, 링크 HTTPS, npm 스크립트 안전성. 8항목 100점.",
      scoreCriteriaQuality: "코드 품질(35%): 저장소 설명, README, CONTRIBUTING, CI/Actions, 테스트 스크립트, package.json repository, 열린 이슈 수, 저장소 크기. 8항목 100점.",
      scoreCriteriaDeps: "의존성 위험(25%): 의존성 개수, 락 파일, 최근 업데이트, 라이선스. 4항목 100점. Socket.dev 설정 시 반영.",
      detailsTitle: "검사한 항목",
      scanErrorTitle: "스캔 실패",
      improveTip: "이렇게 개선해 보세요",
      detailGood: "양호",
      plainTitle: "쉽게 이해하기",
      plainIntro: "개발자가 아니거나, 이 코드를 사거나 검토할 때 참고하세요. 점수가 무엇을 의미하는지, 어떤 문제가 생길 수 있는지 예시로 정리했습니다.",
      plainSecurityWhat: "보안 = 비밀번호·API 키 같은 비밀값이 코드에 노출되지 않았는지",
      plainSecurityExample: "예: 실제 비밀번호나 API 키가 코드나 공개된 파일에 그대로 들어 있으면, 그 저장소를 본 누구나 그걸로 우리 서비스에 침입하거나 데이터를 훔칠 수 있어요.",
      plainQualityWhat: "코드 품질 = 프로젝트가 잘 설명돼 있고, 나중에 수정·관리하기 쉬운지",
      plainQualityExample: "예: README가 없거나 테스트가 없으면 나중에 수정할 때 위험하고 검증도 어렵습니다. CI가 없으면 코드가 제대로 동작하는지 자동으로 확인하는 절차가 없어요.",
      plainDependencyWhat: "의존성 위험 = 이 코드가 쓰는 외부 라이브러리가 안전하고 최신인지",
      plainDependencyExample: "예: 라이브러리가 너무 많거나 오래돼면 알려진 보안 구멍이 있을 수 있어요. 락 파일이 없으면 환경마다 다른 버전이 설치돼서 ‘우리 쪽에선 되는데’ 같은 문제가 생길 수 있어요.",
      plainTermsTitle: "용어 설명",
      plainTermLabel: { env: "환경변수", secrets: "비밀(시크릿)", readme: "README", lockFile: "락 파일", ci: "CI / Actions", license: "라이선스" },
      plainTerms: {
        env: "환경변수: API 키, DB 비밀번호처럼 앱이 쓰는 비밀에 가까운 값이에요. 반드시 별도 파일(.env 등)에만 두고, 그 파일은 저장소에 올리지 않아야 해요.",
        secrets: "비밀(시크릿): 비밀번호, API 키, 토큰 등. 이게 코드나 README에 들어 있으면 노출된 거예요. 누구나 그걸 쓸 수 있어요.",
        readme: "README: 프로젝트를 설명하는 대표 문서예요. 뭘 하는지, 어떻게 실행하는지 적되, 실제 비밀값은 넣지 않는 게 좋아요.",
        lockFile: "락 파일: 쓰는 라이브러리 버전을 고정해 두는 파일이에요. 없으면 환경마다 다른 버전이 설치될 수 있어서, ‘우리 쪽에선 되는데’ 같은 문제가 생길 수 있어요.",
        ci: "CI / Actions: 코드가 올라갈 때 자동으로 테스트·검사하는 거예요. 버그를 미리 잡는 데 도움이 돼요.",
        license: "라이선스: 이 코드를 다른 사람이 어떻게 쓸 수 있는지 적어 둔 거예요. 없으면 ‘무단 사용 금지’로 해석될 수 있어요.",
      },
      details: {
        license: { label: "라이선스 충돌 위험", tip: "저장소에 LICENSE를 두고, 사용하는 라이브러리 중 GPL 등 상업 사용 시 소스 공개 의무가 있는지 확인하세요.", plain: "쉽게 말하면: 가져다 쓴 라이브러리 중에 ‘상업적으로 쓰면 코드 전부 공개해야 함’(GPL 등) 같은 조건이 붙은 게 있으면, 나중에 유료 서비스로 팔 때 법적 문제가 생길 수 있어요. 저장소에 라이선스가 있으면 사용 조건을 파악하기 쉬워요." },
        recent_activity: { label: "최근 업데이트 여부", tip: "저장소를 주기적으로 업데이트하세요. 의존성 라이브러리도 오래되면 보안 패치가 안 돼 있을 수 있어요.", plain: "쉽게 말하면: 오래된 라이브러리는 보안 패치가 안 돼 있을 수 있어요. 이 저장소가 최근에 업데이트됐는지 보면 관리가 활발한지 확인할 수 있어요." },
        issues_enabled: { label: "이슈 사용 여부", tip: "저장소 설정에서 Issues를 켜면 버그나 보안 문제를 보고받을 수 있습니다.", plain: "쉽게 말하면: 버그나 보안 문제를 제보받는 창구예요. 꺼져 있으면 문제를 알리기 어려워요." },
        scorecard: { label: "OpenSSF Scorecard", tip: "Scorecard GitHub Action을 실행하고, SECURITY.md를 추가하고, workflow에서 의존성을 고정하세요.", plain: "쉽게 말하면: 자동 보안 점수예요. 점수가 높을수록 보안 관례를 잘 따른다고 보면 돼요." },
        snyk_issues: { label: "Snyk 이슈", tip: "Snyk에서 이슈를 해결하거나 확인 처리하세요. 취약한 의존성을 업데이트하세요.", plain: "쉽게 말하면: 이 코드가 쓰는 라이브러리에서 알려진 보안 문제 개수예요. 적을수록 좋아요." },
        exposed_env: { label: "환경변수 파일 노출", tip: ".env, .env.local은 절대 커밋하지 마세요. .gitignore에 넣고, .env.example에는 예시 값만 넣으세요.", plain: "쉽게 말하면: 비밀번호·API 키가 들어 있는 파일이 공개된 코드에 포함돼 있어요. 저장소를 본 누구나 그걸 쓸 수 있어요. .gitignore에는 .env가 있는데도 여기 ‘노출됐다’고 나온다면, 예전에 한 번 커밋한 뒤에 .gitignore에 넣은 거예요. 한번 저장소에 올라간 파일은 .gitignore만으로는 안 사라져요. 터미널에서 git rm --cached .env (필요하면 .env.local도) 입력하고, 커밋·푸시한 뒤, 그 파일에 있던 비밀값은 새로 발급받으세요." },
        gitignore_env: { label: ".gitignore에 .env 포함", tip: ".gitignore에 .env, .env.local을 추가해 비밀값이 실수로 커밋되지 않게 하세요.", plain: "쉽게 말하면: 비밀 파일이 저장소에 올라가지 않도록 설정되어 있는지예요. 없으면 실수로 비밀을 올릴 수 있어요." },
        sensitive_readme: { label: "README에 API 키·비밀 포함 여부", tip: "README에는 실제 API 키나 비밀번호를 넣지 마세요. YOUR_API_KEY 같은 예시만 쓰고, 실제 값은 어디서 받는지만 안내하세요.", plain: "쉽게 말하면: 프로젝트 설명 문서에 실제 비밀번호나 API 키가 적혀 있어요. 보는 사람이 그대로 쓸 수 있어요." },
        security_md: { label: "SECURITY.md", tip: "SECURITY.md 파일을 두면 취약점 보고 방법을 안내할 수 있어요. GitHub 보안 탭에 노출됩니다.", plain: "쉽게 말하면: 보안 문제를 어디에 어떻게 보고하면 되는지 적어 둔 파일이에요. 없으면 보고할 곳을 모르게 돼요." },
        lock_file: { label: "락 파일 존재 여부", tip: "package-lock.json(또는 yarn.lock, pnpm-lock.yaml)을 커밋하면 모두 같은 의존성 버전을 쓰게 되어 공급망 위험이 줄어듭니다.", plain: "쉽게 말하면: package-lock.json이 있으면 모든 팀원이 같은 버전의 라이브러리를 쓸 수 있어서 안전해요. 없으면 환경마다 다른 버전이 설치될 수 있어요." },
        dangerous_scripts: { label: "npm 스크립트", tip: "eval, 외부 URL로 curl/wget, 임의 코드 실행 같은 스크립트는 피하세요. npm install 후 스크립트 실행 시 악용될 수 있어요.", plain: "쉽게 말하면: 설치·빌드할 때 위험할 수 있는 명령이 들어 있는 스크립트가 있어요. 악용될 수 있어요." },
        readme_http: { label: "링크 HTTPS 사용", tip: "README 링크는 http:// 대신 https://를 쓰면 암호화되어 안전합니다.", plain: "쉽게 말하면: 설명 문서에 http:// 링크가 있어요. 암호화되지 않은 링크는 중간에 조작될 수 있어요. https가 안전해요." },
        console_log_secrets: { label: "console.log에 비밀 출력?", tip: "비밀번호·토큰·API 키를 찍는 console.log는 제거하세요. 디버깅하다 남긴 로그가 그대로 커밋되면 유출됩니다.", plain: "쉽게 말하면: 코드에 비밀번호나 API 키를 콘솔에 찍는 부분이 있어요. 디버깅할 때 넣었다가 그대로 올리는 경우가 많아요. 그러면 저장소를 보는 사람이 그대로 쓸 수 있어요." },
        hardcoded_secrets: { label: "코드에 비밀 하드코딩?", tip: "비밀번호나 API 키를 소스에 직접 쓰지 마세요. .env 같은 환경변수나 시크릿 관리에 두고 실행 시에만 불러오세요.", plain: "쉽게 말하면: 비밀번호나 API 키가 코드 안에 그대로 적혀 있어요. 저장소를 본 누구나 볼 수 있어요. .env 같은 곳에 두고 코드에는 넣지 마세요." },
        description: { label: "저장소 설명", tip: "저장소 상단에 짧은 설명을 넣어 방문자가 무엇을 하는지 알 수 있게 하세요.", plain: "쉽게 말하면: 이 프로젝트가 뭘 하는지 한 줄로 적어 둔 거예요. 없으면 방문자가 빠르게 파악하기 어려워요." },
        readme_present: { label: "README 파일", tip: "README.md를 두면 프로젝트 설명과 실행 방법을 안내할 수 있어요.", plain: "쉽게 말하면: 프로젝트가 뭘 하고, 어떻게 실행하는지 설명하는 대표 문서예요. 없으면 새로 온 사람이나 구매 검토자가 어디서부터 봐야 할지 모르게 돼요." },
        contributing: { label: "CONTRIBUTING", tip: "CONTRIBUTING.md를 두면 기여 방법을 안내할 수 있어요 (오픈소스에 유리).", plain: "쉽게 말하면: 다른 사람이 어떻게 기여할 수 있는지 적어 둔 파일이에요. 오픈소스나 팀 프로젝트에 도움이 돼요." },
        open_issues: { label: "열린 이슈 수", tip: "열린 이슈가 적당히 적으면 유지보수가 잘 된다는 신호예요. 오래된 이슈는 정리하세요.", plain: "쉽게 말하면: 아직 정리되지 않은 버그·요청 개수예요. 너무 많으면 관리가 안 되거나 방치된 느낌이에요." },
        ci_workflow: { label: "CI / Actions", tip: ".github/workflows를 두면 푸시할 때 테스트·린트를 자동으로 돌릴 수 있어요.", plain: "쉽게 말하면: 코드가 올라갈 때마다 자동으로 테스트·검사를 돌리는 거예요. 버그를 미리 잡는 데 도움이 돼요." },
        test_script: { label: "테스트 스크립트", tip: "package.json에 \"test\" 스크립트를 넣으면 npm test로 테스트를 실행할 수 있어요.", plain: "쉽게 말하면: 한 번에 테스트를 돌리는 방법이 있어요. 없으면 수정 후에 제대로 동작하는지 확인하기 어려워요." },
        package_repository: { label: "package.json repository", tip: "package.json에 \"repository\" 필드를 넣으면 패키지와 저장소가 연결돼요.", plain: "쉽게 말하면: 패키지 설정에 이 코드 저장소 주소가 들어 있어요. 사용자나 도구가 출처를 찾기 쉬워요." },
        stars: { label: "스타 수", tip: "README와 문서를 잘 쓰고 저장소를 공유하면 스타를 받기 쉬워요.", plain: "쉽게 말하면: 이 저장소에 관심 표시를 한 사람 수예요. 많을수록 눈에 잘 띄고, 신뢰감이 갈 수 있어요." },
        repo_size: { label: "저장소 크기", tip: "저장소를 가볍게 유지하세요. .gitignore로 빌드 결과를 제외하고 큰 파일은 올리지 마세요.", plain: "쉽게 말하면: 코드 저장소 크기예요. 너무 크면 불필요한 파일이 포함됐거나 구조가 복잡할 수 있어요." },
        dep_count: { label: "의존성 개수", tip: "의존성이 적을수록 유지보수와 위험이 줄어듭니다. 쓰지 않는 패키지는 제거하세요.", plain: "쉽게 말하면: 이 코드가 쓰는 외부 라이브러리 개수예요. 많을수록 유지보수·보안 이슈가 생길 여지가 커요." },
        socket_score: { label: "패키지 상태 (Socket)", tip: "Socket.dev에서 위험한 패키지를 확인하세요. 잘 유지보수되는 라이브러리를 쓰세요.", plain: "쉽게 말하면: 쓰는 주요 라이브러리가 얼마나 건강한지(유지보수·보안)에 대한 점수예요. 높을수록 좋아요." },
      },
      detailPlainToggle: "쉽게 이해하기",
      breakdownTitle: "점수 산출 내역",
      breakdownSumLabel: "합계: {sum} → 최종 {score}",
      breakdownItems: {
        quality_description: "저장소 설명",
        quality_readme: "README 파일",
        quality_contributing: "CONTRIBUTING 파일",
        quality_ci: "CI / Actions",
        quality_testScript: "테스트 스크립트",
        quality_packageRepo: "package.json repository",
        quality_openIssues: "열린 이슈 수",
        quality_size: "저장소 크기",
        security_exposedEnv: "환경변수 파일 노출",
        security_gitignoreEnv: ".gitignore에 .env 포함",
        security_sensitiveReadme: "README에 API 키·비밀",
        security_consoleLogSecrets: "console.log 비밀 출력",
        security_hardcodedSecrets: "코드에 비밀 하드코딩",
        security_securityMd: "SECURITY.md",
        security_readmeHttp: "링크 HTTPS 사용",
        security_dangerousScripts: "npm 스크립트 안전성",
        dependency_depCount: "의존성 개수",
        dependency_lockFile: "락 파일",
        dependency_recentActivity: "최근 업데이트",
        dependency_license: "라이선스",
      },
    },
    meta: {
      title: "SafeVibesOnly - Vibe 코딩 보안 점수",
      description:
        "GitHub 저장소 URL을 붙여넣으면 몇 초 만에 보안 점수를 확인할 수 있습니다.",
    },
  },
  ja: {
    home: {
      heroTitle: "Safe Vibes Only.\nバイブコードをチェック。",
      heroSubtitle:
        "GitHubリポジトリのURLを貼り付けると、数秒でセキュリティレポートを表示します。",
      scopeNote: "スコアはJavaScript/Node.jsのWebプロジェクトを基準としています。\nモバイルアプリなど他種類のプロジェクトには該当しない項目があります。",
      placeholder: "https://github.com/username/repo",
      scanNow: "スキャン",
      demo: "デモ",
      security: "セキュリティ",
      codeQuality: "コード品質",
      dependencyRisk: "依存関係リスク",
      trySample: "サンプルリポジトリで試す",
    },
    errors: {
      urlRequired: "GitHubリポジトリのURLを入力してください。",
      urlMustStartWith: "URLは https://github.com/ で始めてください。",
    },
    result: {
      back: "← 戻る",
      scanning: "リポジトリをスキャン中...",
      loading: "読み込み中...",
      breakdown: "内訳",
      grade: "グレード",
      badge: "バッジ",
      preview: "プレビュー",
      addToReadme: "READMEに追加するコード:",
      badgeReadmeExplain: "GitHubのREADMEにこのバッジを追加すると、リポジトリでセキュリティスコアを表示できます。",
      copy: "コピー",
      copied: "コピーしました！",
      shareToX: "Xでシェア",
      scoreCriteriaTitle: "スコア基準",
      scoreCriteriaSecurity: "セキュリティ(40%): 環境変数ファイル露出、.gitignoreに.env、READMEに秘密、console.log秘密、コード直書き秘密、SECURITY.md、HTTPSリンク、npmスクリプト安全性。8項目100点.",
      scoreCriteriaQuality: "品質(35%): 説明、README、CONTRIBUTING、CI/Actions、テストスクリプト、package.json repository、オープンイシュー数、リポジトリサイズ。8項目100点.",
      scoreCriteriaDeps: "依存関係(25%): 依存個数、ロックファイル、最近の更新、ライセンス。4項目100点。Socket.dev設定時反映.",
      detailsTitle: "チェックした項目",
      scanErrorTitle: "スキャン失敗",
      improveTip: "改善のヒント",
      detailGood: "良好",
      plainTitle: "わかりやすく言うと",
      plainIntro: "開発者でない方や、このコードを購入・検討する際の参考です。スコアの意味と、どんな問題が起きうるかを例でまとめています。",
      plainSecurityWhat: "セキュリティ＝パスワードやAPIキーなどの秘密がコードに含まれていないか",
      plainSecurityExample: "例：本物のパスワードやAPIキーがコードや公開ファイルに書いてあると、リポジトリを見た誰でもそれでサービスに侵入したりデータを盗んだりできます。",
      plainQualityWhat: "コード品質＝プロジェクトの説明や、後の修正・運用のしやすさ",
      plainQualityExample: "例：READMEやテストがないと、後の変更が危険で検証も難しくなります。CIがないと、コードが正しく動くかを自動で確認する仕組みがありません。",
      plainDependencyWhat: "依存関係リスク＝このコードが使う外部ライブラリが安全で新しいか",
      plainDependencyExample: "例：ライブラリが多すぎたり古かったりすると、既知の脆弱性がある可能性があります。ロックファイルがないと、環境ごとに違うバージョンが入り「うちでは動くのに」という問題になり得ます。",
      plainTermsTitle: "用語の説明",
      plainTermLabel: { env: "環境変数", secrets: "シークレット", readme: "README", lockFile: "ロックファイル", ci: "CI / Actions", license: "ライセンス" },
      plainTerms: {
        env: "環境変数：APIキーやDBパスワードなど、アプリが使う秘密に近い値。必ず別ファイル（.envなど）にだけ置き、そのファイルはリポジトリに上げません。",
        secrets: "シークレット：パスワード・APIキー・トークンなど。これがコードやREADMEにあると「漏れている」状態で、誰でも使えます。",
        readme: "README：プロジェクトの説明用の代表的なファイル。何をするか・どう動かすかを書き、本物の秘密は書かないようにします。",
        lockFile: "ロックファイル：使うライブラリのバージョンを固定するファイル。ないと環境ごとに違うバージョンが入り、不具合の原因になり得ます。",
        ci: "CI / Actions：コードがプッシュされたときに自動でテスト・チェックする仕組み。バグを早く見つけるのに役立ちます。",
        license: "ライセンス：このコードを他人がどう使ってよいかを書いたもの。ないと「無断使用禁止」と解釈されることがあります。",
      },
      details: {
        license: { label: "ライセンス", tip: "LICENSEファイルを追加し、利用条件を明示してください（例: MIT, Apache 2.0）。", plain: "わかりやすく言うと：このコードを他人がどう使ってよいか書いたものです。ないと「無断使用禁止」と解釈されることがあります。" },
        recent_activity: { label: "更新頻度", tip: "リポジトリを定期的に更新し、依存関係をセキュアに保ちましょう。", plain: "わかりやすく言うと：最後にコードが更新された時期です。古いとプロジェクトが放置されている可能性があります。" },
        issues_enabled: { label: "Issues有効", tip: "設定でIssuesを有効にすると、バグや脆弱性の報告を受けやすくなります。", plain: "わかりやすく言うと：バグやセキュリティ問題を報告する窓口です。オフだと報告しづらくなります。" },
        scorecard: { label: "OpenSSF Scorecard", tip: "Scorecard GitHub Actionの実行、SECURITY.mdの追加、ワークフローでの依存関係ピン留めを。", plain: "わかりやすく言うと：自動でつくセキュリティスコアです。高いほどセキュリティのベストプラクティスに沿っています。" },
        snyk_issues: { label: "Snykの問題", tip: "Snykで指摘された問題を修正または確認してください。", plain: "わかりやすく言うと：このコードが使うライブラリの既知の脆弱性の数です。少ないほどよいです。" },
        exposed_env: { label: "envファイルのコミット", tip: ".envや.env.localは絶対にコミットしないでください。.gitignoreに追加し、.env.exampleにはダミーのみ記載してください。", plain: "わかりやすく言うと：パスワードやAPIキーが入ったファイルが公開コードに含まれています。リポジトリを見た誰でも使えます。.gitignoreに.envを入れたのにここで「露出」と出る場合は、昔に一度コミットしたあとで.gitignoreに追加した状態です。一度リポジトリに入ったファイルは.gitignoreだけでは消えません。ターミナルで git rm --cached .env（.env.localもあれば同様に）を実行してコミット・プッシュし、そのファイルにあった秘密は再発行してください。" },
        gitignore_env: { label: ".gitignoreに.env", tip: ".gitignoreに.envと.env.localを追加し、秘密がコミットされないようにしてください。", plain: "わかりやすく言うと：秘密のファイルがリポジトリに上がらない設定になっているかです。ないと誤ってアップロードする可能性があります。" },
        sensitive_readme: { label: "READMEにAPIキー・秘密の記載", tip: "READMEに本物のAPIキーやパスワードを書かないでください。YOUR_API_KEYなどの例だけにし、取得方法だけ案内してください。", plain: "わかりやすく言うと：プロジェクト説明文に本物のパスワードやAPIキーが書いてあります。見た人がそのまま使えます。" },
        security_md: { label: "SECURITY.md", tip: "SECURITY.mdを追加すると脆弱性の報告方法を案内できます。GitHubのセキュリティタブに表示されます。", plain: "わかりやすく言うと：セキュリティ問題をどこにどう報告すればよいか書いたファイルです。ないと報告先が分かりません。" },
        lock_file: { label: "ロックファイル", tip: "package-lock.json（またはyarn.lock / pnpm-lock.yaml）をコミットすると、全員が同じ依存バージョンでインストールでき、サプライチェーンリスクが減ります。", plain: "わかりやすく言うと：使うライブラリのバージョンを固定したファイルです。ないと環境ごとに違うバージョンが入り不具合の原因になり得ます。" },
        dangerous_scripts: { label: "npmスクリプト", tip: "evalや外部URLへのcurl/wget、任意コード実行は避けてください。npm install後にスクリプト実行で悪用される可能性があります。", plain: "わかりやすく言うと：インストール・ビルド時に危険なコマンドを実行するスクリプトがあります。悪用される可能性があります。" },
        readme_http: { label: "リンクはHTTPS", tip: "READMEのリンクはhttp://ではなくhttps://にすると通信が暗号化され安全です。", plain: "わかりやすく言うと：説明文のリンクにhttp://が含まれています。暗号化されていないリンクは改ざんの恐れがあります。httpsが安全です。" },
        console_log_secrets: { label: "console.logで秘密を出力？", tip: "パスワード・トークン・APIキーを出力するconsole.logは削除してください。デバッグ用のログがそのままコミットされると漏洩します。", plain: "わかりやすく言うと：コードにパスワードやAPIキーをコンソールに出力する部分があります。デバッグで入れたまま上げてしまうことが多く、リポジトリを見た人にそのまま使われます。" },
        hardcoded_secrets: { label: "コードに秘密を直書き？", tip: "パスワードやAPIキーをソースに直接書かないでください。.envなどの環境変数やシークレット管理に置き、実行時に読み込んでください。", plain: "わかりやすく言うと：パスワードやAPIキーがコードにそのまま書かれています。リポジトリを見た誰でも見られます。.envなどに置き、コードには入れないでください。" },
        description: { label: "説明文", tip: "リポジトリの説明を追加すると、訪問者が何のプロジェクトか分かりやすくなります。", plain: "わかりやすく言うと：このプロジェクトが何をするか一行で書いたものです。ないと訪問者がすぐに把握しづらくなります。" },
        readme_present: { label: "README", tip: "README.mdを追加すると、プロジェクトの説明や実行方法を案内できます。", plain: "わかりやすく言うと：プロジェクトの内容と実行方法を説明する代表的な文書です。ないと新規参画者や購入検討者がどこから見ればよいか分かりません。" },
        contributing: { label: "CONTRIBUTING", tip: "CONTRIBUTING.mdで貢献方法を案内すると（オープンソースに）有利です。", plain: "わかりやすく言うと：他人がどう貢献できるか書いたファイルです。オープンソースやチーム開発に有用です。" },
        open_issues: { label: "オープンイシュー数", tip: "オープンイシューが適度ならメンテされている証拠。古いイシューは整理を。", plain: "わかりやすく言うと：未対応のバグ・要望の数です。多すぎると管理されていない印象になります。" },
        ci_workflow: { label: "CI / Actions", tip: ".github/workflowsを追加すると、プッシュ時にテストやリントを自動実行できます。", plain: "わかりやすく言うと：コードがプッシュされるたびに自動でテスト・チェックする仕組みです。バグを早く見つけるのに役立ちます。" },
        test_script: { label: "テストスクリプト", tip: "package.jsonに\"test\"スクリプトを追加すると、npm testでテスト実行できます。", plain: "わかりやすく言うと：ワンコマンドでテストを実行する方法があります。ないと変更後に動作確認がしづらくなります。" },
        package_repository: { label: "package.json repository", tip: "package.jsonの\"repository\"フィールドを設定するとパッケージとリポジトリが紐づきます。", plain: "わかりやすく言うと：パッケージ設定にこのコードのリポジトリURLが入っています。利用者やツールが出所を把握しやすくなります。" },
        stars: { label: "スター数", tip: "READMEやドキュメントを整えて、リポジトリを共有しましょう。", plain: "わかりやすく言うと：このリポジトリに興味を示した人数です。多いほど注目度や信頼感につながることがあります。" },
        repo_size: { label: "リポジトリサイズ", tip: ".gitignoreでビルド成果物を除外し、大きなファイルをコミットしないように。", plain: "わかりやすく言うと：コードベースの大きさです。非常に大きいと不要なファイルが含まれている可能性があります。" },
        dep_count: { label: "依存関係の数", tip: "依存関係は少ないほど保守しやすくリスクも減ります。未使用パッケージは削除を。", plain: "わかりやすく言うと：このコードが使う外部ライブラリの数です。多いほど保守やセキュリティのリスクが増えます。" },
        socket_score: { label: "パッケージ健全性 (Socket)", tip: "Socket.devでリスクの高いパッケージを確認し、よくメンテされているライブラリを選びましょう。", plain: "わかりやすく言うと：使っている主要ライブラリがどれだけ健全か（メンテ・セキュリティ）のスコアです。高いほどよいです。" },
      },
      detailPlainToggle: "わかりやすく言うと",
      breakdownTitle: "スコア内訳",
      breakdownSumLabel: "合計: {sum} → 最終 {score}",
      breakdownItems: {
        quality_description: "リポジトリ説明",
        quality_readme: "READMEファイル",
        quality_contributing: "CONTRIBUTINGファイル",
        quality_ci: "CI / Actions",
        quality_testScript: "テストスクリプト",
        quality_packageRepo: "package.json repository",
        quality_openIssues: "オープンイシュー数",
        quality_size: "リポジトリサイズ",
        security_exposedEnv: "環境変数ファイル露出",
        security_gitignoreEnv: ".gitignoreに.env",
        security_sensitiveReadme: "READMEにAPIキー・秘密",
        security_consoleLogSecrets: "console.logで秘密出力",
        security_hardcodedSecrets: "コードに秘密直書き",
        security_securityMd: "SECURITY.md",
        security_readmeHttp: "リンクHTTPS使用",
        security_dangerousScripts: "npmスクリプト安全性",
        dependency_depCount: "依存個数",
        dependency_lockFile: "ロックファイル",
        dependency_recentActivity: "最近の更新",
        dependency_license: "ライセンス",
      },
    },
    meta: {
      title: "SafeVibesOnly - Vibeコーディングのセキュリティスコア",
      description:
        "GitHubリポジトリのURLを貼り付けると、数秒でセキュリティスコアを表示します。",
    },
  },
};

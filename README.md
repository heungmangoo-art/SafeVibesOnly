# SafeVibesOnly

GitHub AI 생성 코드(Vibe code)의 보안 및 품질을 검사하고 점수/배지를 발급하는 웹 서비스입니다.

## 기능

- **메인 페이지**: GitHub 저장소 URL 입력 후 보안 스캔 요청
- **결과 페이지**: 종합 점수, 등급(S/A/B/C/D), Security / Code Quality / Dependency Risk 세부 점수
- **배지**: README용 마크다운 배지 생성 및 복사
- **Badge API**: SVG 배지 이미지 제공 (`/api/badge/[username]/[repo]`)

## CI / 테스트·린트 워크플로우

`.github/workflows/ci.yml`이 있어서, **main에 push하거나 PR을 올릴 때마다** GitHub가 자동으로 다음을 실행합니다.

- **Lint**: `npm run lint` — 코드 스타일·잠재적 버그 검사 (Next.js 기준)
- **Build**: `npm run build` — 프로젝트가 정상적으로 빌드되는지 확인

실패하면 GitHub Actions 탭에 빨간불이 뜨고, 그때 수정하면 됩니다. “내가 안 돌려봤는데 배포만 되면 어?” 같은 상황을 막는 자동 점검입니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database / Auth**: Supabase
- **Deployment**: Vercel

## 설치

```bash
npm install
```

Supabase 클라이언트는 이미 의존성에 포함되어 있습니다. (`@supabase/supabase-js`)

## 환경 변수

`.env.local.example`을 참고해 `.env.local`을 생성하고 값을 채워 넣으세요.

```bash
cp .env.local.example .env.local
```

필수 변수:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon (public) key

선택(점수 품질 향상):

- `GITHUB_TOKEN`: GitHub API 호출 수 증가 (미설정 시 60회/시간)
- **OpenSSF Scorecard**: 별도 키 없음. 공개 API로 자동 반영(보안 점수 블렌드).
- `SNYK_TOKEN`, `SNYK_ORG_ID`: Snyk에 이미 임포트된 저장소만 이슈 수 반영(보안 감점).
- `SOCKET_API_KEY`: [Socket.dev](https://socket.dev) 패키지 점수(의존성 위험 블렌드).

### Snyk API 키 붙이는 방법

1. [Snyk](https://snyk.io) 가입 후 로그인.
2. **API 토큰 발급**
   - 우측 상단 프로필 클릭 → **Account settings** (또는 [https://app.snyk.io/account](https://app.snyk.io/account)).
   - **API Token** 섹션에서 **Show** → **Generate** 또는 **Create**.
   - 생성된 토큰을 복사 (한 번만 보이므로 안전한 곳에 저장).
3. **Org ID 확인**
   - [Snyk 대시보드](https://app.snyk.io) → 왼쪽에서 **Organization** 선택.
   - **Settings** (톱니바퀴) → **General**.
   - **Organization ID** 값을 복사.
4. **`.env.local`에 추가**
   ```bash
   SNYK_TOKEN=여기에_복사한_토큰
   SNYK_ORG_ID=여기에_복사한_Org_ID
   ```
5. **주의**: Snyk에 **GitHub 연동 후 프로젝트(저장소)를 임포트**해 둔 repo만 이슈 수가 반영됩니다. 아무 URL이나 넣어도, Snyk에 없는 repo는 이슈 조회가 안 됩니다.

### Socket API 키 붙이는 방법

1. [Socket.dev](https://socket.dev) 가입 후 로그인.
2. **API 키 발급**
   - [Socket Dashboard](https://socket.dev/dashboard) 또는 설정/계정 메뉴에서 **API Keys** (또는 **Integrations** → API)로 이동.
   - **Create API Key** / **Generate** 클릭.
   - 키 이름 입력 후 생성된 키를 복사 (한 번만 표시되는 경우가 많음).
3. **`.env.local`에 추가**
   ```bash
   SOCKET_API_KEY=여기에_복사한_API_키
   ```
4. **동작**: 스캔하는 repo에 `package.json`이 있고 `name`이 있으면, 해당 npm 패키지 점수를 Socket에서 가져와 **의존성 위험** 점수에 반영합니다. 키가 없으면 Socket 호출은 건너뜁니다.

로컬에서 적용 후에는 `npm run dev`를 다시 실행해야 합니다. Vercel 배포 시에는 프로젝트 **Settings → Environment Variables**에 위 변수들을 그대로 추가하면 됩니다.

## Supabase 테이블 생성

Supabase 대시보드의 SQL Editor에서 아래를 실행하세요.

```sql
create table scan_results (
  id uuid default gen_random_uuid() primary key,
  repo_url text not null,
  score int not null,
  grade text not null,
  created_at timestamp default now()
);
```

## 로컬 실행

1. `.env.local`에 Supabase URL과 anon key 설정
2. Supabase에 `scan_results` 테이블 생성 (위 SQL)
3. 개발 서버 실행:

```bash
npm run dev
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Vercel 배포

1. [Vercel](https://vercel.com)에 로그인 후, 이 저장소를 GitHub에 푸시하고 Import
2. Project Settings → Environment Variables에서 다음 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (선택) `NEXT_PUBLIC_APP_URL`: 배포된 사이트 URL (예: `https://safevibesonly.vercel.app`) — 설정 시 배지 마크다운에 이 주소가 사용됨
3. Deploy 후 배포 URL 확인 (예: `https://safevibesonly.vercel.app`)
4. **배지 URL**: `https://SafeVibesOnly.dev`는 실제 도메인이 아닌 예시입니다. 결과 페이지에서 "복사"한 배지 마크다운은 **현재 접속한 주소**(예: `https://safevibesonly.vercel.app`)를 자동으로 넣습니다. 서버에서 주소가 필요하면 환경변수 `NEXT_PUBLIC_APP_URL`에 배포 URL을 설정하세요.

## 스크립트

- `npm run dev`: 개발 서버
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: ESLint 실행

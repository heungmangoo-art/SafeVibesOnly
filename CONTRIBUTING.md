# 기여하기

SafeVibesOnly에 기여해 주셔서 감사합니다.

## 버그/이슈 보고

- [GitHub Issues](https://github.com/heungmangoo-art/safevibesonly/issues)에서 새 이슈를 열어 주세요.
- 재현 방법, 환경(OS, Node 버전), 예상 동작과 실제 동작을 적어 주시면 도움이 됩니다.

## 코드/기능 제안

- 이슈로 먼저 논의해 주시면 좋습니다. 큰 변경은 이슈에서 방향을 맞춘 뒤 진행하는 것을 권장합니다.

## 로컬에서 실행

```bash
npm install
cp .env.local.example .env.local
# .env.local 에 필요한 값 입력
npm run dev
```

## 코드 스타일

- TypeScript 사용, 기존 코드 스타일을 따르면 됩니다.
- PR 전에 `npm run lint`와 `npm run build`가 통과하는지 확인해 주세요.

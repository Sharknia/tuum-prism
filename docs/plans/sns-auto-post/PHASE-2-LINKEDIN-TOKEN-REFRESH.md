# Phase 2: LinkedIn 토큰 자동 갱신

**Status**: ✅ Complete
**Started**: 2026-01-14
**Last Updated**: 2026-01-14
**Completed**: 2026-01-14
**Actual Time**: ~1시간
**Dependencies**: Phase 1 완료 ✅

---

## 📋 Overview

### Feature Description

LinkedIn Access Token을 GitHub Actions를 통해 자동으로 갱신하고, Refresh Token 만료 30일 전 GitHub Issue로 알림을 발송하는 시스템을 구현합니다.

### Success Criteria

- [x] 매주 월요일 자동 실행 (Cron 스케줄)
- [x] Access Token 만료 7일 전 자동 갱신
- [x] Refresh Token 만료 30일 전 GitHub Issue 자동 생성
- [x] 수동 트리거로 즉시 갱신 가능 (workflow_dispatch)
- [x] 에러 발생 시 GitHub Issue로 알림
- [x] 중복 알림 방지 (기존 이슈 확인)

### User Impact

- LinkedIn 토큰 관리 완전 자동화
- 연 1회 재인증만으로 1년간 무중단 운영
- 토큰 만료로 인한 SNS 포스팅 실패 방지

---

## 🏗️ Architecture Decisions

| Decision                      | Rationale                                | Trade-offs          |
| ----------------------------- | ---------------------------------------- | ------------------- |
| **GitHub Actions 사용**       | Vercel 컴퓨팅 비용 절약, 6시간 실행 가능 | GitHub 의존성 증가  |
| **매주 월요일 실행**          | 7일 버퍼로 충분한 갱신 여유 확보         | 즉각적 갱신 아님    |
| **Edge Config 직접 API 호출** | Phase 1 구현 재활용, SDK 불필요          | curl 명령어 복잡성  |
| **GitHub Issue 알림**         | 추가 인프라 불필요, 코드 저장소와 통합   | 이메일/Slack 미지원 |

---

## 📦 Dependencies

### Required Before Starting

- [x] Phase 1: LinkedIn OAuth 엔드포인트 완료
- [x] Edge Config 클라이언트 구현 (`apps/blog/src/infrastructure/edge-config/`)
- [ ] GitHub Secrets 설정 (운영 환경에서 필요):
  - `EDGE_CONFIG_ID`: Vercel Edge Config 식별자
  - `EDGE_CONFIG_TOKEN`: Edge Config 읽기 토큰
  - `VERCEL_TOKEN`: Edge Config 쓰기 토큰
  - `LINKEDIN_CLIENT_ID`: LinkedIn OAuth App Client ID
  - `LINKEDIN_CLIENT_SECRET`: LinkedIn OAuth App Client Secret

### External Dependencies

- LinkedIn OAuth 2.0 API: `https://www.linkedin.com/oauth/v2/accessToken`
- Vercel Edge Config API: `https://api.vercel.com/v1/edge-config/{id}/items`
- GitHub Actions: `actions/checkout@v4`, `actions/github-script@v7`

---

## ✅ 구현 완료 항목

### Sub-Phase 2.1: 토큰 만료일 계산 유틸리티 ✅

- [x] 만료일 계산 유닛 테스트 작성 (23개 테스트)
- [x] 토큰 만료일 계산 유틸리티 구현
- [x] Edge Config index.ts에 exports 추가
- [x] 모든 테스트 통과

**생성된 파일:**

- `apps/blog/src/infrastructure/edge-config/token-expiry.ts`
- `apps/blog/src/infrastructure/edge-config/token-expiry.test.ts`

### Sub-Phase 2.2: GitHub Actions 워크플로우 생성 ✅

- [x] 워크플로우 파일 생성 (266줄)
- [x] Edge Config 토큰 조회 Step 구현
- [x] 만료일 계산 Step 구현
- [x] Access Token 갱신 Step 구현
- [x] Edge Config 업데이트 Step 구현
- [x] 재인증 알림 Issue 생성 Step 구현

**생성된 파일:**

- `.github/workflows/refresh-linkedin-token.yml`

### Sub-Phase 2.3: 에러 핸들링 및 알림 ✅

- [x] 토큰 갱신 실패 시 Issue 생성
- [x] Edge Config 조회 실패 처리
- [x] 워크플로우 Summary 출력

### Sub-Phase 2.4: 검증 ✅

- [x] YAML 문법 검증 통과
- [x] 91개 전체 테스트 통과
- [x] AGENT.md 문서 업데이트

---

## 📊 테스트 결과

```
Test Files  11 passed (11)
     Tests  91 passed (91)
  Duration  4.01s
```

### token-expiry.test.ts 테스트 케이스 (23개)

- Token Expiry Constants (4개)
- calculateAccessTokenDaysRemaining (5개)
- calculateRefreshTokenDaysRemaining (4개)
- needsAccessTokenRefresh (5개)
- needsReauthAlert (5개)

---

## 📝 Notes & Learnings

### Implementation Notes

- LinkedIn의 Refresh Token은 갱신해도 TTL이 연장되지 않음 (365일 고정)
- Edge Config API는 PATCH + upsert 방식으로 개별 키 업데이트 가능
- GitHub Actions의 `::add-mask::`로 토큰 로그 노출 방지
- `actions/github-script@v7`로 GitHub Issue 생성 시 labels 배열 직접 전달 가능

---

## 📚 References

### Documentation

- [LinkedIn Programmatic Refresh Tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)
- [Vercel Edge Config API](https://vercel.com/docs/rest-api/reference/endpoints/edge-config/update-edge-config-items-in-batch)
- [GitHub Actions Scheduled Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [actions/github-script](https://github.com/actions/github-script)

---

## ➡️ Next Phase

→ [Phase 3: SNS 포스팅 핵심 로직](./PHASE-3-CORE-POSTING.md)

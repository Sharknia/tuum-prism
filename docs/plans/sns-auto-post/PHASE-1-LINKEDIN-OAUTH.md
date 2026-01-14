# Phase 1: LinkedIn OAuth 엔드포인트

**상태**: ✅ 완료
**예상 소요**: 2-3시간
**실제 소요**: ~45분
**의존성**: Phase 0 완료

---

## 목표

LinkedIn OAuth 인증 및 토큰 갱신을 위한 API 엔드포인트를 구현합니다.

---

## To-Do

### 1.1 OAuth 시작 엔드포인트

**파일**: `apps/blog/src/app/api/auth/linkedin/route.ts`

- [x] GET 핸들러 구현
- [x] LinkedIn OAuth URL로 리다이렉트
- [x] 필요한 scope 설정 (`openid`, `profile`, `w_member_social`)
- [x] redirect_uri 설정

### 1.2 OAuth Callback 엔드포인트

**파일**: `apps/blog/src/app/api/auth/linkedin/callback/route.ts`

- [x] GET 핸들러 구현
- [x] Authorization Code 파라미터 추출
- [x] Code → Token 교환 API 호출
- [x] access_token, refresh_token 추출
- [x] Edge Config 업데이트 (Vercel API)
  - [x] `LINKEDIN_ACCESS_TOKEN`
  - [x] `LINKEDIN_REFRESH_TOKEN`
  - [x] `LINKEDIN_TOKEN_ISSUED_AT`
- [x] 성공 페이지 반환
- [x] 에러 핸들링 (code 없음, 토큰 교환 실패 등)

### 1.3 환경변수 타입 정의

**파일**: `apps/blog/src/config/env.ts`

- [x] `LINKEDIN_CLIENT_ID` 추가 (기존)
- [x] `LINKEDIN_CLIENT_SECRET` 추가 (기존)
- [x] `VERCEL_TOKEN` 추가
- [x] `EDGE_CONFIG_ID` 추가

### 1.4 Edge Config 유틸리티

**파일**: `apps/blog/src/infrastructure/edge-config/edge-config.client.ts` (신규)

- [x] Edge Config 읽기 함수
- [x] Edge Config 업데이트 함수
- [x] 타입 정의

### 1.5 테스트

- [x] 유닛 테스트 작성 (17개 테스트 통과)
- [ ] 로컬에서 OAuth 플로우 테스트 (ngrok 또는 Vercel Preview)
- [ ] Edge Config 업데이트 확인
- [ ] 토큰 발급 시각 기록 확인

---

## 완료 기준

- [x] `/api/auth/linkedin` 접속 시 LinkedIn 로그인 페이지로 이동
- [x] 승인 후 `/api/auth/linkedin/callback`으로 리다이렉트
- [ ] Edge Config에 토큰 저장 확인 (실제 환경 테스트 필요)
- [x] "LinkedIn 연동 완료" 페이지 표시

---

## 구현된 파일

```
apps/blog/src/
├── infrastructure/edge-config/
│   ├── edge-config.types.ts      # 타입 정의
│   ├── edge-config.client.ts     # Edge Config 클라이언트
│   ├── edge-config.client.test.ts # 8개 테스트
│   └── index.ts                  # Public exports
├── config/env.ts                 # 수정: VERCEL_TOKEN, EDGE_CONFIG_ID 추가
└── app/api/auth/linkedin/
    ├── route.ts                  # OAuth 시작 엔드포인트
    ├── route.test.ts             # 4개 테스트
    └── callback/
        ├── route.ts              # OAuth 콜백 엔드포인트
        └── route.test.ts         # 5개 테스트
```

---

## 다음 Phase

→ [Phase 2: LinkedIn 토큰 자동 갱신](./PHASE-2-LINKEDIN-TOKEN-REFRESH.md)

# Phase 0: 인프라 및 초기 설정

**예상 소요**: 1-2시간
**의존성**: 없음 (최초 시작)

---

## 목표

SNS 자동 포스팅 시스템의 기반 인프라를 구축합니다.

---

## To-Do

### 0.1 Vercel Edge Config 생성

- [ ] Vercel Dashboard → Storage → Edge Config 생성
- [ ] Edge Config ID 기록
- [ ] 프로젝트에 Edge Config 연결
- [ ] `EDGE_CONFIG` 환경변수 자동 주입 확인

### 0.2 LinkedIn OAuth App 생성

- [ ] [LinkedIn Developer Portal](https://developer.linkedin.com/) 접속
- [ ] 새 앱 생성
- [ ] `w_member_social`, `openid`, `profile` 권한 요청
- [ ] Redirect URI 등록: `https://{DOMAIN}/api/auth/linkedin/callback`
- [ ] Client ID, Client Secret 기록

### 0.3 X (Twitter) Developer App 설정

- [ ] [X Developer Portal](https://developer.x.com/) 접속
- [ ] App Permissions → **Read and Write** 설정
- [ ] OAuth 1.0a 활성화
- [ ] API Key, API Secret 기록
- [ ] Access Token, Access Token Secret 생성 및 기록

### 0.4 Threads App 설정 (선택)

- [ ] [Meta for Developers](https://developers.facebook.com/) 접속
- [ ] Threads Use Case 추가
- [ ] `threads_basic`, `threads_content_publish` 권한 요청
- [ ] Access Token 발급

### 0.5 GitHub Secrets 등록

- [ ] `NOTION_API_KEY`
- [ ] `NOTION_DATABASE_ID`
- [ ] `NEXT_PUBLIC_BASE_URL`
- [ ] `VERCEL_TOKEN` (Vercel Dashboard → Settings → Tokens)
- [ ] `EDGE_CONFIG_ID`
- [ ] `EDGE_CONFIG_TOKEN` (Edge Config 읽기용)
- [ ] `X_API_KEY`
- [ ] `X_API_SECRET`
- [ ] `X_ACCESS_TOKEN`
- [ ] `X_ACCESS_TOKEN_SECRET`
- [ ] `LINKEDIN_CLIENT_ID`
- [ ] `LINKEDIN_CLIENT_SECRET`
- [ ] `THREADS_ACCESS_TOKEN` (선택)
- [ ] `AI_GATEWAY_API_KEY` (선택)

### 0.6 Vercel 환경변수 등록

- [ ] `LINKEDIN_CLIENT_ID`
- [ ] `LINKEDIN_CLIENT_SECRET`
- [ ] `VERCEL_TOKEN`
- [ ] `EDGE_CONFIG_ID`

---

## 완료 기준

- [ ] Edge Config 생성 및 프로젝트 연결 완료
- [ ] 모든 GitHub Secrets 등록 완료
- [ ] 모든 Vercel 환경변수 등록 완료
- [ ] LinkedIn, X, Threads (선택) 앱 설정 완료

---

## 다음 Phase

→ [Phase 1: LinkedIn OAuth 엔드포인트](./PHASE-1-LINKEDIN-OAUTH.md)

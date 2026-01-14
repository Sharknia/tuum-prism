# Phase 4: 플랫폼별 포스팅

**예상 소요**: 4-5시간
**의존성**: Phase 3 완료

---

## 목표

X, LinkedIn, Threads 각 플랫폼에 콘텐츠를 포스팅하는 로직을 구현합니다.

---

## To-Do

### 4.1 X (Twitter) 포스팅

#### 4.1.1 OAuth 1.0a 서명 구현

- [ ] Twitter OAuth 1.0a 서명 로직
- [ ] 또는 `twitter-api-v2` 라이브러리 사용

#### 4.1.2 트윗 포스팅

- [ ] `POST /2/tweets` API 호출
- [ ] short 버전 + 해시태그 사용
- [ ] 280자 제한 확인
- [ ] 성공 시 트윗 URL 추출
- [ ] 실패 시 에러 로깅

#### 4.1.3 조건부 실행

- [ ] `X_API_KEY` 없으면 스킵
- [ ] 스킵 사유 로깅

---

### 4.2 LinkedIn 포스팅

#### 4.2.1 Edge Config에서 토큰 조회

- [ ] `LINKEDIN_ACCESS_TOKEN` 조회
- [ ] 토큰 없으면 스킵

#### 4.2.2 사용자 ID 조회

- [ ] `GET /v2/userinfo` API 호출
- [ ] `sub` (사용자 ID) 추출

#### 4.2.3 포스트 생성

- [ ] `POST /rest/posts` API 호출
- [ ] `LinkedIn-Version` 헤더 설정
- [ ] long 버전 + 해시태그 사용
- [ ] 성공 시 포스트 URL 추출

#### 4.2.4 조건부 실행

- [ ] Edge Config에 토큰 없으면 스킵
- [ ] 스킵 사유 로깅

---

### 4.3 Threads 포스팅

#### 4.3.1 미디어 컨테이너 생성

- [ ] `POST /{user-id}/threads` API 호출
- [ ] text 파라미터에 long 버전 + 해시태그
- [ ] 컨테이너 ID 추출

#### 4.3.2 포스트 발행

- [ ] `POST /{user-id}/threads_publish` API 호출
- [ ] 컨테이너 ID 전달
- [ ] 성공 시 포스트 ID 추출

#### 4.3.3 조건부 실행

- [ ] `THREADS_ACCESS_TOKEN` 없으면 스킵
- [ ] 스킵 사유 로깅

---

### 4.4 결과 수집

- [ ] 각 플랫폼 결과 수집
  - [ ] 성공: URL 또는 ID
  - [ ] 실패: 에러 메시지
  - [ ] 스킵: 사유
- [ ] 다음 Step(Notion Write-back)으로 전달

---

## 완료 기준

- [ ] X 포스팅 성공 (또는 조건부 스킵)
- [ ] LinkedIn 포스팅 성공 (또는 조건부 스킵)
- [ ] Threads 포스팅 성공 (또는 조건부 스킵)
- [ ] 모든 결과 수집 완료

---

## 참고: API 스펙

### X API v2

```bash
curl -X POST "https://api.twitter.com/2/tweets" \
  -H "Authorization: OAuth ..." \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello World!"}'
```

### LinkedIn Posts API

```bash
curl -X POST "https://api.linkedin.com/rest/posts" \
  -H "Authorization: Bearer {ACCESS_TOKEN}" \
  -H "LinkedIn-Version: 202511" \
  -H "X-Restli-Protocol-Version: 2.0.0" \
  -H "Content-Type: application/json" \
  -d '{
    "author": "urn:li:person:{PERSON_ID}",
    "commentary": "Hello LinkedIn!",
    "visibility": "PUBLIC",
    "lifecycleState": "PUBLISHED"
  }'
```

### Threads API

```bash
# Step 1: Create container
curl -X POST "https://graph.threads.net/v1.0/{user-id}/threads" \
  -d "text=Hello Threads!" \
  -d "access_token={ACCESS_TOKEN}"

# Step 2: Publish
curl -X POST "https://graph.threads.net/v1.0/{user-id}/threads_publish" \
  -d "creation_id={CONTAINER_ID}" \
  -d "access_token={ACCESS_TOKEN}"
```

---

## 다음 Phase

→ [Phase 5: Notion Write-back](./PHASE-5-NOTION-WRITEBACK.md)

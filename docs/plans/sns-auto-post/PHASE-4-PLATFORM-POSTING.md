# Phase 4: 플랫폼별 포스팅

**Status**: ✅ Complete
**Started**: 2026-01-14
**Completed**: 2026-01-14
**Actual Time**: ~30분
**Dependencies**: Phase 3 완료 ✅

---

## 목표

X, LinkedIn, Threads 각 플랫폼에 콘텐츠를 포스팅하는 로직을 구현합니다.

---

## ✅ 완료된 To-Do

### 4.1 X (Twitter) 포스팅

#### 4.1.1 OAuth 1.0a 서명 구현

- [x] `twitter-api-v2` 라이브러리 사용

#### 4.1.2 트윗 포스팅

- [x] `POST /2/tweets` API 호출
- [x] short 버전 + 해시태그 사용
- [x] 280자 제한 확인
- [x] 성공 시 트윗 URL 추출
- [x] 실패 시 에러 로깅

#### 4.1.3 조건부 실행

- [x] `X_API_KEY` 없으면 스킵
- [x] 스킵 사유 로깅

---

### 4.2 LinkedIn 포스팅

#### 4.2.1 Edge Config에서 토큰 조회

- [x] `LINKEDIN_ACCESS_TOKEN` 조회
- [x] 토큰 없으면 스킵

#### 4.2.2 사용자 ID 조회

- [x] `GET /v2/userinfo` API 호출
- [x] `sub` (사용자 ID) 추출

#### 4.2.3 포스트 생성

- [x] `POST /rest/posts` API 호출
- [x] `LinkedIn-Version` 헤더 설정 (202401)
- [x] long 버전 + 해시태그 사용
- [x] 성공 시 포스트 URL 추출

#### 4.2.4 조건부 실행

- [x] Edge Config에 토큰 없으면 스킵
- [x] 스킵 사유 로깅

---

### 4.3 Threads 포스팅

#### 4.3.1 미디어 컨테이너 생성

- [x] `POST /{user-id}/threads` API 호출
- [x] text 파라미터에 long 버전 + 해시태그
- [x] 컨테이너 ID 추출

#### 4.3.2 포스트 발행

- [x] `POST /{user-id}/threads_publish` API 호출
- [x] 컨테이너 ID 전달
- [x] 성공 시 포스트 ID 추출

#### 4.3.3 조건부 실행

- [x] `THREADS_ACCESS_TOKEN` 없으면 스킵
- [x] 스킵 사유 로깅

---

### 4.4 결과 수집

- [x] 각 플랫폼 결과 수집
  - [x] 성공: URL 또는 ID
  - [x] 실패: 에러 메시지
  - [x] 스킵: 사유
- [x] Summary 테이블 생성
- [x] Phase 5용 outputs 전달 (page_id, 플랫폼별 status/url)

---

## 완료 기준

- [x] X 포스팅 성공 (또는 조건부 스킵)
- [x] LinkedIn 포스팅 성공 (또는 조건부 스킵)
- [x] Threads 포스팅 성공 (또는 조건부 스킵)
- [x] 모든 결과 수집 완료
- [x] Dry Run 모드 지원
- [x] YAML Lint 통과
- [x] 테스트 140개 통과 (49 + 91)

---

## 📊 검증 결과

```
✔ YAML Lint successful.

@tuum/refract-notion:test:  Test Files  5 passed (5)
@tuum/refract-notion:test:       Tests  49 passed (49)

@tuum/blog:test:  Test Files  11 passed (11)
@tuum/blog:test:       Tests  91 passed (91)

Tasks:    3 successful, 3 total
```

---

## 📝 생성/수정된 파일

- `.github/workflows/sns-auto-post.yml` (992줄)
  - `post-to-x` Job 추가
  - `post-to-linkedin` Job 추가
  - `post-to-threads` Job 추가
  - `collect-results` Job 추가

---

## 워크플로우 구조

```
prepare-content (Phase 3)
         ↓
   ┌─────┴─────┬─────────────┐
   ↓           ↓             ↓
post-to-x  post-to-linkedin  post-to-threads  (병렬 실행)
   └─────┬─────┴─────────────┘
         ↓
   collect-results
         ↓
   (Phase 5: write-back-notion)
```

---

## 다음 Phase

→ [Phase 5: Notion Write-back](./PHASE-5-NOTION-WRITEBACK.md)

Phase 4 완료 후 `collect-results` Job의 outputs를 사용하여 Notion 상태 변경 및 System Log 기록을 수행합니다.

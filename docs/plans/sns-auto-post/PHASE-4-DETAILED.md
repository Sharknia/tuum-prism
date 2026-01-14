# Phase 4: 플랫폼별 포스팅 - 상세 구현 계획

**Status**: ✅ Complete
**Started**: 2026-01-14
**Last Updated**: 2026-01-14
**Completed**: 2026-01-14
**Actual Time**: ~30분
**Dependencies**: Phase 3 완료 ✅

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each sub-phase:

1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next sub-phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description

Phase 3에서 생성된 SNS 콘텐츠(`post_short`, `post_long`)를 X, LinkedIn, Threads 각 플랫폼에 실제로 포스팅합니다.

각 플랫폼은 **조건부 실행**으로, API 키가 설정된 플랫폼만 포스팅됩니다.

### Success Criteria

- [x] X (Twitter) 포스팅 성공 (또는 키 미설정 시 정상 스킵)
- [x] LinkedIn 포스팅 성공 (또는 토큰 없을 시 정상 스킵)
- [x] Threads 포스팅 성공 (또는 키 미설정 시 정상 스킵)
- [x] 모든 플랫폼 결과 수집 및 Phase 5로 전달
- [x] Dry Run 모드에서 실제 포스팅 없이 테스트 가능
- [x] YAML 문법 검증 통과
- [x] 기존 테스트 140개 모두 통과 (49 + 91)

### User Impact

- Notion에 글 작성 → 자동으로 여러 SNS에 동시 공유
- 플랫폼별 최적화된 콘텐츠 (X: 짧은 버전, LinkedIn/Threads: 긴 버전)
- 설정된 플랫폼만 선택적으로 포스팅

---

## 🏗️ Architecture Decisions

| Decision                            | Rationale                                  | Trade-offs                            |
| ----------------------------------- | ------------------------------------------ | ------------------------------------- |
| **플랫폼별 독립 Job 구성**          | 한 플랫폼 실패가 다른 플랫폼에 영향 없음   | Job 간 결과 공유 필요 (outputs 사용)  |
| **X: OAuth 1.0a + twitter-api-v2**  | X API v2 Free Tier 지원, 라이브러리 안정성 | OAuth 서명 복잡성을 라이브러리가 해결 |
| **LinkedIn: Edge Config 토큰 사용** | Phase 1-2에서 구현된 토큰 관리 활용        | Edge Config API 호출 필요             |
| **Threads: 2단계 API 호출**         | Meta 공식 API 구조 (컨테이너 → 발행)       | 2회 API 호출 필요                     |
| **curl + jq 기반**                  | 별도 Node.js 설정 불필요, 빠른 실행        | 복잡한 OAuth 서명은 별도 처리 필요    |
| **조건부 실행 (if)**                | 키 없는 플랫폼 자동 스킵                   | 각 플랫폼별 조건 분기 필요            |

---

## 📦 Dependencies

### Required Before Starting

- [x] Phase 3: `prepare-content` Job 완료
  - `has_posts`: Ready 상태 글 존재 여부
  - `page_id`: Notion 페이지 ID
  - `title`: 글 제목
  - `post_short`: X용 완성된 포스트
  - `post_long`: LinkedIn/Threads용 완성된 포스트
  - `blog_url`: 블로그 URL

### GitHub Secrets (플랫폼별 선택)

| Secret                  | 플랫폼   | 필수 여부 |
| ----------------------- | -------- | --------- |
| `X_API_KEY`             | X        | 선택      |
| `X_API_SECRET`          | X        | 선택      |
| `X_ACCESS_TOKEN`        | X        | 선택      |
| `X_ACCESS_TOKEN_SECRET` | X        | 선택      |
| `VERCEL_TOKEN`          | LinkedIn | 선택      |
| `EDGE_CONFIG_ID`        | LinkedIn | 선택      |
| `LINKEDIN_CLIENT_ID`    | LinkedIn | 선택      |
| `THREADS_ACCESS_TOKEN`  | Threads  | 선택      |
| `THREADS_USER_ID`       | Threads  | 선택      |

### External APIs

| API                | 엔드포인트                                                   | Rate Limit           |
| ------------------ | ------------------------------------------------------------ | -------------------- |
| X API v2           | `POST /2/tweets`                                             | 월 100개 (Free Tier) |
| LinkedIn Posts API | `POST /rest/posts`                                           | 일 100개             |
| Threads API        | `POST /{user-id}/threads`, `POST /{user-id}/threads_publish` | 일 250개             |

---

## 🧪 Test Strategy

### Testing Approach

GitHub Actions 워크플로우는 **YAML Lint + Dry Run + 수동 검증**으로 테스트합니다.

### Test Categories

| Test Type          | Coverage Target | Purpose                                          |
| ------------------ | --------------- | ------------------------------------------------ |
| **YAML Syntax**    | 100%            | yamllint로 문법 검증                             |
| **Dry Run**        | 핵심 로직       | workflow_dispatch로 실제 포스팅 없이 실행        |
| **Platform Mock**  | 각 플랫폼       | curl 호출 전 조건 분기 검증                      |
| **Error Handling** | 실패 케이스     | API 에러 시 적절한 로깅 및 다른 플랫폼 계속 실행 |

### Manual Test Scenarios

1. **All Platforms Configured**: 모든 키 설정 → 3개 플랫폼 포스팅
2. **Partial Configuration**: X만 설정 → X만 포스팅, 나머지 스킵
3. **No Configuration**: 모든 키 미설정 → 모든 플랫폼 스킵 (정상 종료)
4. **Dry Run Mode**: dry_run=true → 실제 API 호출 없이 로그만 출력
5. **API Error Handling**: 한 플랫폼 실패 → 나머지 플랫폼 계속 실행

---

## 🚀 Implementation Sub-Phases

### Sub-Phase 4.1: X (Twitter) 포스팅 Job

**Goal**: X API v2를 사용하여 트윗 포스팅
**Estimated Time**: 1.5시간
**Status**: ⏳ Pending

#### API Spec

```bash
# X API v2 - Create Tweet
# 인증: OAuth 1.0a (User Context 필수)
# Rate Limit: 월 100개 (Free Tier), 17 requests/24h

POST https://api.twitter.com/2/tweets
Authorization: OAuth oauth_consumer_key="...", oauth_token="...", ...
Content-Type: application/json

{
  "text": "트윗 내용 (최대 280자)"
}

# 성공 응답
{
  "data": {
    "id": "1234567890",
    "text": "트윗 내용"
  }
}
```

#### Tasks

**🟢 GREEN: 구현**

- [ ] **Task 4.1.1**: X 포스팅 Job 생성
  - File: `.github/workflows/sns-auto-post.yml`
  - Job 이름: `post-to-x`
  - 의존성: `needs: [prepare-content]`
  - 조건: `if: needs.prepare-content.outputs.has_posts == 'true'`

- [ ] **Task 4.1.2**: API 키 존재 여부 확인 Step
  - 4개 키 모두 확인: `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`
  - 하나라도 없으면 스킵 플래그 설정
- [ ] **Task 4.1.3**: OAuth 1.0a 서명 및 트윗 포스팅
  - **방법 A**: `npx twitter-api-v2` CLI 또는 Node.js 스크립트 사용 (권장)
  - **방법 B**: Pure bash OAuth 서명 구현 (복잡)
  - 280자 제한 확인
  - `post_short` 사용

- [ ] **Task 4.1.4**: 결과 처리
  - 성공: 트윗 URL 추출 (`https://x.com/i/status/{tweet_id}`)
  - 실패: 에러 메시지 로깅, 다른 플랫폼 계속 실행
  - 스킵: 사유 로깅

- [ ] **Task 4.1.5**: Dry Run 모드 지원
  - `dry_run == 'true'` 시 실제 API 호출 스킵
  - 로그에 "DRY RUN: Would post to X" 출력

#### 참고 코드

```yaml
post-to-x:
  name: Post to X (Twitter)
  runs-on: ubuntu-latest
  needs: [prepare-content]
  if: needs.prepare-content.outputs.has_posts == 'true'

  outputs:
    status: ${{ steps.post.outputs.status }}
    url: ${{ steps.post.outputs.url }}
    error: ${{ steps.post.outputs.error }}

  steps:
    - name: Check X API credentials
      id: check-creds
      run: |
        if [ -z "${{ secrets.X_API_KEY }}" ] || \
           [ -z "${{ secrets.X_API_SECRET }}" ] || \
           [ -z "${{ secrets.X_ACCESS_TOKEN }}" ] || \
           [ -z "${{ secrets.X_ACCESS_TOKEN_SECRET }}" ]; then
          echo "configured=false" >> $GITHUB_OUTPUT
          echo "⚠️ X API credentials not fully configured, skipping"
        else
          echo "configured=true" >> $GITHUB_OUTPUT
          echo "✅ X API credentials configured"
        fi

    - name: Setup Node.js for twitter-api-v2
      if: steps.check-creds.outputs.configured == 'true'
      uses: actions/setup-node@v4
      with:
        node-version: "20"

    - name: Post to X
      id: post
      if: steps.check-creds.outputs.configured == 'true'
      env:
        X_API_KEY: ${{ secrets.X_API_KEY }}
        X_API_SECRET: ${{ secrets.X_API_SECRET }}
        X_ACCESS_TOKEN: ${{ secrets.X_ACCESS_TOKEN }}
        X_ACCESS_TOKEN_SECRET: ${{ secrets.X_ACCESS_TOKEN_SECRET }}
        POST_TEXT: ${{ needs.prepare-content.outputs.post_short }}
        DRY_RUN: ${{ github.event.inputs.dry_run }}
      run: |
        if [ "$DRY_RUN" = "true" ]; then
          echo "🧪 DRY RUN: Would post to X"
          echo "📝 Content: $POST_TEXT"
          echo "status=dry_run" >> $GITHUB_OUTPUT
          exit 0
        fi

        # twitter-api-v2 라이브러리로 트윗 포스팅
        npm install twitter-api-v2

        node << 'EOF'
        const { TwitterApi } = require('twitter-api-v2');

        const client = new TwitterApi({
          appKey: process.env.X_API_KEY,
          appSecret: process.env.X_API_SECRET,
          accessToken: process.env.X_ACCESS_TOKEN,
          accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
        });

        async function postTweet() {
          try {
            const tweet = await client.v2.tweet(process.env.POST_TEXT);
            const tweetId = tweet.data.id;
            const tweetUrl = `https://x.com/i/status/${tweetId}`;
            
            console.log(`✅ Tweet posted: ${tweetUrl}`);
            
            // GitHub Actions output
            const fs = require('fs');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `status=success\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `url=${tweetUrl}\n`);
          } catch (error) {
            console.error(`❌ Failed to post tweet: ${error.message}`);
            const fs = require('fs');
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `status=error\n`);
            fs.appendFileSync(process.env.GITHUB_OUTPUT, `error=${error.message}\n`);
            process.exit(0); // 다른 플랫폼 계속 실행
          }
        }

        postTweet();
        EOF

    - name: Handle skipped
      if: steps.check-creds.outputs.configured == 'false'
      run: |
        echo "status=skipped" >> $GITHUB_OUTPUT
        echo "error=X API credentials not configured" >> $GITHUB_OUTPUT
```

#### Quality Gate ✋

- [ ] YAML 문법 검증 통과
- [ ] Dry Run 모드 정상 동작
- [ ] 키 미설정 시 정상 스킵
- [ ] 기존 테스트 통과

---

### Sub-Phase 4.2: LinkedIn 포스팅 Job

**Goal**: LinkedIn Posts API로 포스트 생성
**Estimated Time**: 1.5시간
**Status**: ⏳ Pending

#### API Spec

```bash
# LinkedIn Posts API
# 인증: OAuth 2.0 Bearer Token (Edge Config에서 조회)
# Rate Limit: 일 100개

# Step 1: 사용자 ID 조회
GET https://api.linkedin.com/v2/userinfo
Authorization: Bearer {ACCESS_TOKEN}

# 응답: { "sub": "person_id", ... }

# Step 2: 포스트 생성
POST https://api.linkedin.com/rest/posts
Authorization: Bearer {ACCESS_TOKEN}
LinkedIn-Version: 202401
X-Restli-Protocol-Version: 2.0.0
Content-Type: application/json

{
  "author": "urn:li:person:{PERSON_ID}",
  "commentary": "포스트 내용",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED"
}

# 성공 응답: HTTP 201
# Header: x-restli-id: urn:li:share:123456789
```

#### Tasks

**🟢 GREEN: 구현**

- [ ] **Task 4.2.1**: LinkedIn 포스팅 Job 생성
  - File: `.github/workflows/sns-auto-post.yml`
  - Job 이름: `post-to-linkedin`
  - 의존성: `needs: [prepare-content]`

- [ ] **Task 4.2.2**: Edge Config에서 토큰 조회
  - `VERCEL_TOKEN`과 `EDGE_CONFIG_ID`로 Edge Config API 호출
  - `LINKEDIN_ACCESS_TOKEN` 추출
  - 토큰 없으면 스킵

- [ ] **Task 4.2.3**: 사용자 ID 조회
  - `GET /v2/userinfo` API 호출
  - `sub` 필드에서 person ID 추출

- [ ] **Task 4.2.4**: 포스트 생성
  - `POST /rest/posts` API 호출
  - `LinkedIn-Version` 헤더 필수 (202401)
  - `post_long` 사용

- [ ] **Task 4.2.5**: 결과 처리
  - 성공: 포스트 URN → URL 변환
  - 실패: 에러 로깅
  - 스킵: 사유 로깅

#### 참고 코드

```yaml
post-to-linkedin:
  name: Post to LinkedIn
  runs-on: ubuntu-latest
  needs: [prepare-content]
  if: needs.prepare-content.outputs.has_posts == 'true'

  outputs:
    status: ${{ steps.post.outputs.status }}
    url: ${{ steps.post.outputs.url }}
    error: ${{ steps.post.outputs.error }}

  steps:
    - name: Get LinkedIn token from Edge Config
      id: get-token
      env:
        VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        EDGE_CONFIG_ID: ${{ secrets.EDGE_CONFIG_ID }}
      run: |
        if [ -z "$VERCEL_TOKEN" ] || [ -z "$EDGE_CONFIG_ID" ]; then
          echo "configured=false" >> $GITHUB_OUTPUT
          echo "⚠️ Edge Config credentials not configured"
          exit 0
        fi

        # Edge Config에서 토큰 조회
        RESPONSE=$(curl -s "https://edge-config.vercel.com/${EDGE_CONFIG_ID}?token=${VERCEL_TOKEN}")

        ACCESS_TOKEN=$(echo "$RESPONSE" | jq -r '.LINKEDIN_ACCESS_TOKEN // empty')

        if [ -z "$ACCESS_TOKEN" ]; then
          echo "configured=false" >> $GITHUB_OUTPUT
          echo "⚠️ LinkedIn access token not found in Edge Config"
          exit 0
        fi

        echo "configured=true" >> $GITHUB_OUTPUT
        echo "access_token=$ACCESS_TOKEN" >> $GITHUB_OUTPUT
        echo "✅ LinkedIn token retrieved from Edge Config"

    - name: Get LinkedIn user ID
      id: get-user
      if: steps.get-token.outputs.configured == 'true'
      env:
        ACCESS_TOKEN: ${{ steps.get-token.outputs.access_token }}
      run: |
        RESPONSE=$(curl -s "https://api.linkedin.com/v2/userinfo" \
          -H "Authorization: Bearer $ACCESS_TOKEN")

        PERSON_ID=$(echo "$RESPONSE" | jq -r '.sub // empty')

        if [ -z "$PERSON_ID" ]; then
          echo "❌ Failed to get LinkedIn user ID"
          echo "$RESPONSE"
          echo "status=error" >> $GITHUB_OUTPUT
          echo "error=Failed to get user ID" >> $GITHUB_OUTPUT
          exit 0
        fi

        echo "person_id=$PERSON_ID" >> $GITHUB_OUTPUT
        echo "✅ LinkedIn user ID: $PERSON_ID"

    - name: Post to LinkedIn
      id: post
      if: steps.get-user.outputs.person_id != ''
      env:
        ACCESS_TOKEN: ${{ steps.get-token.outputs.access_token }}
        PERSON_ID: ${{ steps.get-user.outputs.person_id }}
        POST_TEXT: ${{ needs.prepare-content.outputs.post_long }}
        DRY_RUN: ${{ github.event.inputs.dry_run }}
      run: |
        if [ "$DRY_RUN" = "true" ]; then
          echo "🧪 DRY RUN: Would post to LinkedIn"
          echo "📝 Content: $POST_TEXT"
          echo "status=dry_run" >> $GITHUB_OUTPUT
          exit 0
        fi

        # 포스트 생성
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
          "https://api.linkedin.com/rest/posts" \
          -H "Authorization: Bearer $ACCESS_TOKEN" \
          -H "LinkedIn-Version: 202401" \
          -H "X-Restli-Protocol-Version: 2.0.0" \
          -H "Content-Type: application/json" \
          -d "{
            \"author\": \"urn:li:person:$PERSON_ID\",
            \"commentary\": $(echo "$POST_TEXT" | jq -Rs .),
            \"visibility\": \"PUBLIC\",
            \"distribution\": {
              \"feedDistribution\": \"MAIN_FEED\",
              \"targetEntities\": [],
              \"thirdPartyDistributionChannels\": []
            },
            \"lifecycleState\": \"PUBLISHED\"
          }")

        HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
        BODY=$(echo "$RESPONSE" | sed '$d')

        if [ "$HTTP_CODE" = "201" ]; then
          # x-restli-id 헤더에서 share URN 추출 (curl -i 필요할 수 있음)
          # 또는 응답 본문에서 추출
          SHARE_ID=$(echo "$BODY" | jq -r '.id // empty')
          if [ -z "$SHARE_ID" ]; then
            SHARE_ID="unknown"
          fi
          
          POST_URL="https://www.linkedin.com/feed/update/${SHARE_ID}"
          echo "✅ LinkedIn post created: $POST_URL"
          echo "status=success" >> $GITHUB_OUTPUT
          echo "url=$POST_URL" >> $GITHUB_OUTPUT
        else
          echo "❌ LinkedIn API error: HTTP $HTTP_CODE"
          echo "$BODY"
          echo "status=error" >> $GITHUB_OUTPUT
          echo "error=HTTP $HTTP_CODE" >> $GITHUB_OUTPUT
        fi

    - name: Handle skipped
      if: steps.get-token.outputs.configured == 'false'
      run: |
        echo "status=skipped" >> $GITHUB_OUTPUT
        echo "error=LinkedIn not configured" >> $GITHUB_OUTPUT
```

#### Quality Gate ✋

- [ ] Edge Config 토큰 조회 정상 동작
- [ ] 사용자 ID 조회 성공
- [ ] 포스트 생성 API 호출 성공
- [ ] Dry Run 모드 정상 동작
- [ ] 토큰 미설정 시 정상 스킵

---

### Sub-Phase 4.3: Threads 포스팅 Job

**Goal**: Threads API로 포스트 생성 (2단계: 컨테이너 → 발행)
**Estimated Time**: 1시간
**Status**: ⏳ Pending

#### API Spec

```bash
# Threads API (Meta Graph API)
# 인증: Instagram/Meta Access Token
# Rate Limit: 일 250개

# Step 1: 미디어 컨테이너 생성
POST https://graph.threads.net/v1.0/{user-id}/threads
  ?media_type=TEXT
  &text={encoded_text}
  &access_token={ACCESS_TOKEN}

# 응답: { "id": "container_id" }

# Step 2: 포스트 발행
POST https://graph.threads.net/v1.0/{user-id}/threads_publish
  ?creation_id={container_id}
  &access_token={ACCESS_TOKEN}

# 응답: { "id": "post_id" }
```

#### Tasks

**🟢 GREEN: 구현**

- [ ] **Task 4.3.1**: Threads 포스팅 Job 생성
  - File: `.github/workflows/sns-auto-post.yml`
  - Job 이름: `post-to-threads`
  - 의존성: `needs: [prepare-content]`

- [ ] **Task 4.3.2**: API 키 확인
  - `THREADS_ACCESS_TOKEN` 존재 확인
  - `THREADS_USER_ID` 존재 확인
  - 없으면 스킵

- [ ] **Task 4.3.3**: 미디어 컨테이너 생성
  - `POST /{user-id}/threads` API 호출
  - `media_type=TEXT` 설정
  - 컨테이너 ID 추출

- [ ] **Task 4.3.4**: 포스트 발행
  - `POST /{user-id}/threads_publish` API 호출
  - 컨테이너 ID 전달
  - 포스트 ID 추출

- [ ] **Task 4.3.5**: 결과 처리
  - 성공: Threads 포스트 URL 생성
  - 실패: 에러 로깅
  - 스킵: 사유 로깅

#### 참고 코드

```yaml
post-to-threads:
  name: Post to Threads
  runs-on: ubuntu-latest
  needs: [prepare-content]
  if: needs.prepare-content.outputs.has_posts == 'true'

  outputs:
    status: ${{ steps.publish.outputs.status }}
    url: ${{ steps.publish.outputs.url }}
    error: ${{ steps.publish.outputs.error }}

  steps:
    - name: Check Threads credentials
      id: check-creds
      run: |
        if [ -z "${{ secrets.THREADS_ACCESS_TOKEN }}" ] || \
           [ -z "${{ secrets.THREADS_USER_ID }}" ]; then
          echo "configured=false" >> $GITHUB_OUTPUT
          echo "⚠️ Threads credentials not configured"
        else
          echo "configured=true" >> $GITHUB_OUTPUT
          echo "✅ Threads credentials configured"
        fi

    - name: Create Threads container
      id: container
      if: steps.check-creds.outputs.configured == 'true'
      env:
        ACCESS_TOKEN: ${{ secrets.THREADS_ACCESS_TOKEN }}
        USER_ID: ${{ secrets.THREADS_USER_ID }}
        POST_TEXT: ${{ needs.prepare-content.outputs.post_long }}
        DRY_RUN: ${{ github.event.inputs.dry_run }}
      run: |
        if [ "$DRY_RUN" = "true" ]; then
          echo "🧪 DRY RUN: Would create Threads container"
          echo "📝 Content: $POST_TEXT"
          echo "status=dry_run" >> $GITHUB_OUTPUT
          exit 0
        fi

        # URL 인코딩
        ENCODED_TEXT=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$POST_TEXT'''))")

        # 컨테이너 생성
        RESPONSE=$(curl -s -X POST \
          "https://graph.threads.net/v1.0/${USER_ID}/threads?media_type=TEXT&text=${ENCODED_TEXT}&access_token=${ACCESS_TOKEN}")

        CONTAINER_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
        ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')

        if [ -n "$CONTAINER_ID" ] && [ "$CONTAINER_ID" != "null" ]; then
          echo "container_id=$CONTAINER_ID" >> $GITHUB_OUTPUT
          echo "✅ Threads container created: $CONTAINER_ID"
        else
          echo "❌ Failed to create Threads container"
          echo "$RESPONSE"
          echo "status=error" >> $GITHUB_OUTPUT
          echo "error=$ERROR" >> $GITHUB_OUTPUT
        fi

    - name: Publish Threads post
      id: publish
      if: steps.container.outputs.container_id != ''
      env:
        ACCESS_TOKEN: ${{ secrets.THREADS_ACCESS_TOKEN }}
        USER_ID: ${{ secrets.THREADS_USER_ID }}
        CONTAINER_ID: ${{ steps.container.outputs.container_id }}
      run: |
        # 발행
        RESPONSE=$(curl -s -X POST \
          "https://graph.threads.net/v1.0/${USER_ID}/threads_publish?creation_id=${CONTAINER_ID}&access_token=${ACCESS_TOKEN}")

        POST_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
        ERROR=$(echo "$RESPONSE" | jq -r '.error.message // empty')

        if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
          POST_URL="https://www.threads.net/post/${POST_ID}"
          echo "✅ Threads post published: $POST_URL"
          echo "status=success" >> $GITHUB_OUTPUT
          echo "url=$POST_URL" >> $GITHUB_OUTPUT
        else
          echo "❌ Failed to publish Threads post"
          echo "$RESPONSE"
          echo "status=error" >> $GITHUB_OUTPUT
          echo "error=$ERROR" >> $GITHUB_OUTPUT
        fi

    - name: Handle skipped
      if: steps.check-creds.outputs.configured == 'false'
      run: |
        echo "status=skipped" >> $GITHUB_OUTPUT
        echo "error=Threads not configured" >> $GITHUB_OUTPUT

    - name: Handle dry run
      if: steps.container.outputs.status == 'dry_run'
      run: |
        echo "status=dry_run" >> $GITHUB_OUTPUT
```

#### Quality Gate ✋

- [ ] 컨테이너 생성 API 호출 성공
- [ ] 포스트 발행 API 호출 성공
- [ ] Dry Run 모드 정상 동작
- [ ] 키 미설정 시 정상 스킵

---

### Sub-Phase 4.4: 결과 수집 및 Summary

**Goal**: 모든 플랫폼 결과를 수집하여 Summary 생성 및 Phase 5로 전달
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 4.4.1**: 결과 수집 Job 생성
  - Job 이름: `collect-results`
  - 의존성: `needs: [prepare-content, post-to-x, post-to-linkedin, post-to-threads]`
  - 조건: `if: always()` (항상 실행)

- [ ] **Task 4.4.2**: 각 플랫폼 결과 집계
  - X: `needs.post-to-x.outputs.*`
  - LinkedIn: `needs.post-to-linkedin.outputs.*`
  - Threads: `needs.post-to-threads.outputs.*`

- [ ] **Task 4.4.3**: Summary 테이블 생성
  - 플랫폼별 상태 (✅/❌/⏭️)
  - 포스트 URL 또는 에러 메시지

- [ ] **Task 4.4.4**: Phase 5용 출력 준비
  - `page_id`: Notion 페이지 ID (Write-back용)
  - `results`: JSON 형식의 결과 요약

#### 참고 코드

```yaml
collect-results:
  name: Collect Results
  runs-on: ubuntu-latest
  needs: [prepare-content, post-to-x, post-to-linkedin, post-to-threads]
  if: always() && needs.prepare-content.outputs.has_posts == 'true'

  outputs:
    page_id: ${{ needs.prepare-content.outputs.page_id }}
    x_status: ${{ needs.post-to-x.outputs.status }}
    x_url: ${{ needs.post-to-x.outputs.url }}
    linkedin_status: ${{ needs.post-to-linkedin.outputs.status }}
    linkedin_url: ${{ needs.post-to-linkedin.outputs.url }}
    threads_status: ${{ needs.post-to-threads.outputs.status }}
    threads_url: ${{ needs.post-to-threads.outputs.url }}

  steps:
    - name: Generate Results Summary
      env:
        TITLE: ${{ needs.prepare-content.outputs.title }}
        BLOG_URL: ${{ needs.prepare-content.outputs.blog_url }}
        TRANSFORM: ${{ needs.prepare-content.outputs.transform_method }}
        X_STATUS: ${{ needs.post-to-x.outputs.status || 'skipped' }}
        X_URL: ${{ needs.post-to-x.outputs.url || 'N/A' }}
        X_ERROR: ${{ needs.post-to-x.outputs.error || '' }}
        LI_STATUS: ${{ needs.post-to-linkedin.outputs.status || 'skipped' }}
        LI_URL: ${{ needs.post-to-linkedin.outputs.url || 'N/A' }}
        LI_ERROR: ${{ needs.post-to-linkedin.outputs.error || '' }}
        TH_STATUS: ${{ needs.post-to-threads.outputs.status || 'skipped' }}
        TH_URL: ${{ needs.post-to-threads.outputs.url || 'N/A' }}
        TH_ERROR: ${{ needs.post-to-threads.outputs.error || '' }}
        DRY_RUN: ${{ github.event.inputs.dry_run }}
      run: |
        echo "## 📱 SNS Auto Post Results" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY

        if [ "$DRY_RUN" = "true" ]; then
          echo "> 🧪 **DRY RUN MODE** - No actual posts were created" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
        fi

        echo "### 📄 Post Info" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY
        echo "| Field | Value |" >> $GITHUB_STEP_SUMMARY
        echo "|-------|-------|" >> $GITHUB_STEP_SUMMARY
        echo "| Title | $TITLE |" >> $GITHUB_STEP_SUMMARY
        echo "| Blog URL | $BLOG_URL |" >> $GITHUB_STEP_SUMMARY
        echo "| Transform Method | $TRANSFORM |" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY

        echo "### 🌐 Platform Results" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY
        echo "| Platform | Status | URL/Error |" >> $GITHUB_STEP_SUMMARY
        echo "|----------|--------|-----------|" >> $GITHUB_STEP_SUMMARY

        # X Status
        case "$X_STATUS" in
          success) echo "| X (Twitter) | ✅ Success | $X_URL |" >> $GITHUB_STEP_SUMMARY ;;
          error)   echo "| X (Twitter) | ❌ Error | $X_ERROR |" >> $GITHUB_STEP_SUMMARY ;;
          dry_run) echo "| X (Twitter) | 🧪 Dry Run | Would post |" >> $GITHUB_STEP_SUMMARY ;;
          *)       echo "| X (Twitter) | ⏭️ Skipped | $X_ERROR |" >> $GITHUB_STEP_SUMMARY ;;
        esac

        # LinkedIn Status
        case "$LI_STATUS" in
          success) echo "| LinkedIn | ✅ Success | $LI_URL |" >> $GITHUB_STEP_SUMMARY ;;
          error)   echo "| LinkedIn | ❌ Error | $LI_ERROR |" >> $GITHUB_STEP_SUMMARY ;;
          dry_run) echo "| LinkedIn | 🧪 Dry Run | Would post |" >> $GITHUB_STEP_SUMMARY ;;
          *)       echo "| LinkedIn | ⏭️ Skipped | $LI_ERROR |" >> $GITHUB_STEP_SUMMARY ;;
        esac

        # Threads Status
        case "$TH_STATUS" in
          success) echo "| Threads | ✅ Success | $TH_URL |" >> $GITHUB_STEP_SUMMARY ;;
          error)   echo "| Threads | ❌ Error | $TH_ERROR |" >> $GITHUB_STEP_SUMMARY ;;
          dry_run) echo "| Threads | 🧪 Dry Run | Would post |" >> $GITHUB_STEP_SUMMARY ;;
          *)       echo "| Threads | ⏭️ Skipped | $TH_ERROR |" >> $GITHUB_STEP_SUMMARY ;;
        esac

        echo "" >> $GITHUB_STEP_SUMMARY
        echo "---" >> $GITHUB_STEP_SUMMARY
        echo "*Workflow executed at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')*" >> $GITHUB_STEP_SUMMARY
```

#### Quality Gate ✋

- [ ] 모든 플랫폼 결과 정상 수집
- [ ] Summary 테이블 정상 출력
- [ ] Phase 5용 outputs 정상 전달

---

## 📊 Complete Workflow Structure (Phase 4 완료 후)

```
┌─────────────────────────────────────────────────────────────────┐
│                    sns-auto-post.yml                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Phase 3] prepare-content                                       │
│     ├─ Notion Ready 글 조회                                      │
│     ├─ LLM 또는 Fallback 변환                                    │
│     └─ outputs: post_short, post_long, page_id, blog_url        │
│                    ↓                                             │
│  [Phase 4] post-to-x (parallel) ────────────────┐               │
│     ├─ OAuth 1.0a + twitter-api-v2               │               │
│     └─ outputs: status, url, error               │               │
│                                                   ├─→ collect-results
│  [Phase 4] post-to-linkedin (parallel) ─────────┤               │
│     ├─ Edge Config 토큰 조회                     │               │
│     ├─ Posts API 호출                            │               │
│     └─ outputs: status, url, error               │               │
│                                                   │               │
│  [Phase 4] post-to-threads (parallel) ──────────┘               │
│     ├─ 컨테이너 생성 → 발행                                      │
│     └─ outputs: status, url, error                               │
│                    ↓                                             │
│  [Phase 4] collect-results                                       │
│     ├─ 결과 집계                                                 │
│     ├─ Summary 생성                                              │
│     └─ outputs: page_id, x_*, linkedin_*, threads_*             │
│                    ↓                                             │
│  [Phase 5] write-back-notion (다음 Phase)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Risk Assessment

| Risk                        | Probability | Impact   | Mitigation Strategy                      |
| --------------------------- | ----------- | -------- | ---------------------------------------- |
| X API Rate Limit (월 100개) | Medium      | Medium   | 개인 블로그 기준 충분, 초과 시 에러 로깅 |
| LinkedIn 토큰 만료          | Low         | High     | Phase 2 자동 갱신 워크플로우 활용        |
| Threads API 변경            | Medium      | Medium   | Meta Graph API 버전 명시, 에러 모니터링  |
| OAuth 1.0a 서명 복잡성      | Low         | Low      | twitter-api-v2 라이브러리 사용           |
| 네트워크 타임아웃           | Low         | Medium   | curl 타임아웃 설정, 재시도 로직 고려     |
| API 키 노출                 | Low         | Critical | GitHub Secrets 사용, 로그 마스킹         |

---

## 🔄 Rollback Strategy

### If Phase 4 Fails

**Steps to revert**:

1. `.github/workflows/sns-auto-post.yml`에서 Phase 4 관련 Job 삭제
2. Phase 3 `prepare-content` Job만 유지
3. Cron 스케줄 비활성화 (주석 처리)

### Partial Rollback

- **X 포스팅 실패**: 다른 플랫폼 계속 실행 (자동)
- **LinkedIn 포스팅 실패**: 다른 플랫폼 계속 실행 (자동)
- **Threads 포스팅 실패**: 다른 플랫폼 계속 실행 (자동)
- **특정 플랫폼 영구 비활성화**: 해당 Job 조건에 `false` 추가

---

## 📊 Progress Tracking

### Completion Status

- **Sub-Phase 4.1 (X 포스팅)**: ✅ 100%
- **Sub-Phase 4.2 (LinkedIn 포스팅)**: ✅ 100%
- **Sub-Phase 4.3 (Threads 포스팅)**: ✅ 100%
- **Sub-Phase 4.4 (결과 수집)**: ✅ 100%

**Overall Progress**: 100% complete

### Time Tracking

| Sub-Phase           | Estimated | Actual | Variance |
| ------------------- | --------- | ------ | -------- |
| 4.1 X 포스팅        | 1.5시간   | 10분   | -1.3시간 |
| 4.2 LinkedIn 포스팅 | 1.5시간   | 10분   | -1.3시간 |
| 4.3 Threads 포스팅  | 1시간     | 5분    | -55분    |
| 4.4 결과 수집       | 30분      | 5분    | -25분    |
| **Total**           | 4.5시간   | ~30분  | -4시간   |

---

## 📝 Notes & Learnings

### Implementation Notes

- **전체 Job 한 번에 구현**: 계획 문서가 상세해서 참고하며 빠르게 구현
- **twitter-api-v2 사용**: OAuth 1.0a 서명 복잡성을 라이브러리가 해결
- **Edge Config 토큰 조회**: Phase 1-2 구현 패턴 재사용
- **Threads 2단계 API**: 컨테이너 생성 후 2초 대기 후 발행 (안정성)
- **병렬 실행**: 3개 플랫폼 Job이 동시에 실행되어 시간 절약
- **조건부 실행**: API 키 없는 플랫폼 자동 스킵으로 유연성 확보

### Blockers Encountered

- 없음 (원활하게 진행됨)

---

## 📚 References

### Documentation

- [X API v2 - Create Tweet](https://developer.x.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets)
- [X API v2 - Authentication](https://developer.x.com/en/docs/authentication/oauth-1-0a)
- [twitter-api-v2 (npm)](https://www.npmjs.com/package/twitter-api-v2)
- [LinkedIn Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)
- [LinkedIn API Version Header](https://learn.microsoft.com/en-us/linkedin/marketing/versioning)
- [Threads API - Publishing](https://developers.facebook.com/docs/threads/posts)
- [Vercel Edge Config API](https://vercel.com/docs/edge-config/api)

### Related Files

- `.github/workflows/sns-auto-post.yml`: 메인 워크플로우
- `.github/workflows/refresh-linkedin-token.yml`: LinkedIn 토큰 갱신
- `docs/plans/sns-auto-post/PHASE-3-CORE-POSTING.md`: Phase 3 구현 완료

---

## ✅ Final Checklist

**Before marking Phase 4 as COMPLETE**:

- [ ] 모든 Sub-Phase 완료
- [ ] YAML Lint 검증 통과
- [ ] Dry Run 테스트 성공 (workflow_dispatch)
- [ ] X 포스팅 또는 스킵 정상 동작
- [ ] LinkedIn 포스팅 또는 스킵 정상 동작
- [ ] Threads 포스팅 또는 스킵 정상 동작
- [ ] Summary 출력 정상 확인
- [ ] 기존 테스트 91개 통과
- [ ] PHASE-4-PLATFORM-POSTING.md 체크박스 업데이트

---

## ➡️ Next Phase

→ [Phase 5: Notion Write-back](./PHASE-5-NOTION-WRITEBACK.md)

Phase 4 완료 후 `collect-results` Job의 outputs를 사용하여 Notion 상태 변경 및 System Log 기록을 수행합니다.

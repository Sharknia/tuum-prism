# Implementation Plan: SNS 자동 포스팅 (SNS Auto Post)

**Status**: 🔄 In Progress
**Started**: 2026-01-14
**Last Updated**: 2026-01-14 (Phase 1 완료)
**Estimated Completion**: TBD

---

## 📋 Overview

### Feature Description

Notion에 작성한 블로그 글을 **GitHub Actions**를 통해 SNS(X, LinkedIn, Threads)에 자동으로 포스팅하는 시스템입니다.

**핵심 원칙:**

- **Vercel 컴퓨팅 절약**: 모든 처리를 GitHub Actions에서 수행
- **선택적 포스팅**: API 키가 있는 SNS만 포스팅
- **LLM 옵션**: Vercel AI Gateway로 요약 생성 (미설정 시 Fallback)

### Success Criteria

- [ ] GitHub Actions Cron으로 매시간 자동 실행
- [ ] Notion `Ready` 상태 글 조회 및 포스팅
- [ ] LLM 요약 생성 (AI Gateway 옵션)
- [ ] Fallback: LLM 없이도 기본 변환 동작
- [ ] SNS 포스팅 (키가 있는 플랫폼만)
- [ ] Notion Write-back (상태 변경 + 로그 기록)
- [ ] LinkedIn Access Token 자동 갱신 (60일 주기)
- [ ] LinkedIn Refresh Token 만료 30일 전 알림
- [x] LinkedIn OAuth 재인증 엔드포인트 구현

### User Impact

- Notion에 글 작성 → 자동으로 SNS에 공유
- 별도 SNS 클라이언트 접속 불필요
- 일관된 포맷으로 퍼스널 브랜딩 자동화
- **LinkedIn**: 초기 설정 후 1년간 완전 자동, 이후 1분 재인증

---

## 🏗️ Architecture Decisions

### Why GitHub Actions? (Not Vercel)

| 항목                    | Vercel Hobby             | GitHub Actions (개인) |
| ----------------------- | ------------------------ | --------------------- |
| **총 컴퓨팅 시간**      | 100 GB-Hours/월          | 2,000분/월 (~33시간)  |
| **단일 실행 최대 시간** | 10초 (기본), 60초 (최대) | 6시간 (단일 Job)      |
| **LLM 호출 (10-30초)**  | 제한에 걸릴 수 있음      | 충분히 여유           |

**결론**: LLM 변환 등 시간이 걸리는 작업은 GitHub Actions에서 처리하고, Vercel은 블로그 렌더링에만 집중.

### 키 관리 정책

```
GitHub Secrets:
├── NOTION_API_KEY          # Notion 조회 + Write-back
├── NOTION_DATABASE_ID      # 블로그 DB
├── NEXT_PUBLIC_BASE_URL    # 블로그 URL 생성
├── AI_GATEWAY_API_KEY      # LLM 변환 (옵션)
├── X_API_KEY               # X 포스팅 (옵션)
├── X_API_SECRET            # X 포스팅 (옵션)
├── X_ACCESS_TOKEN          # X 포스팅 (옵션) - User Context 인증 필수
├── X_ACCESS_TOKEN_SECRET   # X 포스팅 (옵션) - User Context 인증 필수
├── VERCEL_TOKEN            # Edge Config 업데이트용
├── EDGE_CONFIG_ID          # Edge Config ID
└── THREADS_ACCESS_TOKEN    # Threads 포스팅 (옵션)

Vercel Edge Config:
├── LINKEDIN_ACCESS_TOKEN   # 자동 갱신됨 (60일 주기)
└── LINKEDIN_REFRESH_TOKEN  # 자동 갱신됨 (1년 주기 재인증)

Vercel Env:
├── NOTION_API_KEY          # 블로그 렌더링용 (중복)
├── NOTION_DATABASE_ID      # 블로그 렌더링용 (중복)
├── LINKEDIN_CLIENT_ID      # OAuth 재인증용
├── LINKEDIN_CLIENT_SECRET  # OAuth 재인증용
└── EDGE_CONFIG             # 연결 문자열 (자동 주입)
```

> **참고**: Notion 키는 Vercel(블로그)과 GitHub Actions(SNS) 양쪽에서 필요하여 중복 저장됨.
> **참고**: LinkedIn 토큰은 Edge Config에 저장되어 GitHub Actions에서 읽고, OAuth Callback에서 갱신됨.

---

## 🔄 System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                 GitHub Actions (매시간 Cron)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Notion API                                              │
│     └─ 상태 "Ready"인 글 GET                                │
│                    ↓                                        │
│  2. 콘텐츠 변환                                              │
│     ├─ AI Gateway 있음 → LLM 요약                           │
│     │   ├─ 짧은 버전 (~250자) → X용                         │
│     │   └─ 긴 버전 (~450자) → Threads/LinkedIn 공용         │
│     └─ AI Gateway 없음 → Fallback                           │
│         └─ 글자 수 자르기 + 블로그 링크                      │
│                    ↓                                        │
│  3. 해시태그 생성                                            │
│     └─ Notion 태그 → #태그 변환                             │
│                    ↓                                        │
│  4. SNS 포스팅 (키가 있는 플랫폼만)                          │
│     ├─ X (Twitter) ← 짧은 버전                              │
│     ├─ Threads ← 긴 버전                                    │
│     ├─ LinkedIn ← 긴 버전                                   │
│     └─ [옵션] 썸네일 이미지 첨부                             │
│                    ↓                                        │
│  5. Notion Write-back                                        │
│     ├─ 상태: Ready → Updated                                │
│     └─ System Log에 결과 기록                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Content Transformation Strategy

### 글자 수 전략

| 버전          | 글자 수       | 사용 플랫폼       | 플랫폼 제한     |
| ------------- | ------------- | ----------------- | --------------- |
| **짧은 버전** | ~250자 + 링크 | X                 | 280자           |
| **긴 버전**   | ~450자 + 링크 | Threads, LinkedIn | 500자 / 3,000자 |

### LLM 변환 (AI Gateway 사용 시)

```yaml
# vercel/ai-action@v2 사용
- uses: vercel/ai-action@v2
  with:
    model: "openai/gpt-4o"
    api-key: ${{ secrets.AI_GATEWAY_API_KEY }}
    system: |
      블로그 글을 SNS 포스트로 변환합니다.
      - 핵심 내용만 간결하게
      - 이모지는 최소한으로
      - 전문적이지만 친근한 톤
    prompt: |
      제목: ${title}
      내용: ${content}
    schema: |
      {
        "type": "object",
        "properties": {
          "short": { "type": "string", "description": "X용 ~250자" },
          "long": { "type": "string", "description": "Threads/LinkedIn용 ~450자" }
        },
        "required": ["short", "long"]
      }
```

### Fallback 변환 (AI Gateway 미설정 시)

```typescript
function fallbackTransform(title: string, content: string, blogUrl: string) {
  const MAX_SHORT = 200; // 링크 공간 확보
  const MAX_LONG = 400;

  const short = content.slice(0, MAX_SHORT) + "...";
  const long = content.slice(0, MAX_LONG) + "...";

  return {
    short: `${title}\n\n${short}\n\n${blogUrl}`,
    long: `${title}\n\n${long}\n\n${blogUrl}`,
  };
}
```

### 해시태그 변환

```typescript
// Notion 태그 → 해시태그
function tagsToHashtags(tags: string[]): string {
  return tags.map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ");
}

// 예시
// ["React", "TIL", "TypeScript"] → "#React #TIL #TypeScript"
```

### 블로그 URL 생성

```typescript
const blogUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/blog/${notionPageId}`;
```

---

## 📱 SNS Platform Specs

### X (Twitter)

| 항목       | 값                                 |
| ---------- | ---------------------------------- |
| 글자 제한  | 280자                              |
| 이미지     | media/upload 엔드포인트            |
| API        | v2 Free Tier                       |
| Rate Limit | **월 100개 트윗**, 17 requests/24h |
| 인증       | OAuth 1.0a (User Context 필수)     |

> **주의**: X API Free Tier는 2025년 하반기 대폭 축소됨. 개인 블로그 기준 (월 10~30개) 충분.

### Threads

| 항목       | 값                              |
| ---------- | ------------------------------- |
| 글자 제한  | 500자                           |
| 이미지     | 컨테이너 생성 → 이미지 URL 지정 |
| Rate Limit | 하루 250 포스트                 |

### LinkedIn

| 항목       | 값                                      |
| ---------- | --------------------------------------- |
| 글자 제한  | 3,000자                                 |
| 이미지     | Asset 등록 → URN 획득 → 포스트에 첨부   |
| 권한       | `w_member_social`                       |
| Rate Limit | 하루 100 포스트                         |
| API        | Posts API (`/rest/posts`) - 2025년 기준 |
| 인증       | OAuth 2.0 (Refresh Token 1년 만료)      |

---

## 🔐 LinkedIn 토큰 관리 아키텍처

### 토큰 수명 정책 (LinkedIn 공식)

| 토큰 종류     | 수명             | 갱신 방법                   |
| ------------- | ---------------- | --------------------------- |
| Access Token  | **60일**         | Refresh Token으로 자동 갱신 |
| Refresh Token | **365일 (고정)** | 갱신 불가, 재인증 필수      |

> **중요**: Refresh Token 사용 시 TTL이 연장되지 않음. 최초 발급일로부터 365일 후 만료.

### 토큰 저장소: Vercel Edge Config

| 이유                      | 설명                                   |
| ------------------------- | -------------------------------------- |
| **Vercel 네이티브**       | 추가 인프라/계정 불필요                |
| **프로그래매틱 업데이트** | REST API로 GitHub Actions에서 갱신     |
| **Hobby 무료**            | 월 100회 쓰기 (60일 주기면 월 ~1회)    |
| **미래 확장**             | Vercel 함수에서 토큰 필요 시 즉시 활용 |

### 자동화 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                    LinkedIn 토큰 자동 관리                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [0~60일] Access Token 유효                                     │
│     └─ GitHub Actions에서 Edge Config 읽어서 포스팅             │
│                                                                 │
│  [60일 주기] Access Token 자동 갱신                              │
│     ├─ GitHub Actions Cron (매주 체크)                          │
│     ├─ Refresh Token으로 새 Access Token 발급                   │
│     └─ Edge Config 업데이트 (Vercel API)                        │
│                                                                 │
│  [335일] 만료 30일 전 알림                                       │
│     └─ GitHub Issue 자동 생성 + (선택) 이메일/Slack              │
│                                                                 │
│  [365일] Refresh Token 만료 → 재인증 필요                        │
│     ├─ 사용자가 재인증 URL 클릭                                  │
│     ├─ LinkedIn OAuth 승인                                      │
│     ├─ Callback에서 새 토큰 발급                                 │
│     └─ Edge Config 자동 업데이트                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### OAuth 재인증 엔드포인트 (Vercel 블로그 앱)

#### 1. 재인증 시작 (`/api/auth/linkedin`)

```typescript
// apps/blog/src/app/api/auth/linkedin/route.ts
export async function GET() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/linkedin/callback`,
    scope: "openid profile w_member_social",
  });

  return Response.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?${params}`,
  );
}
```

#### 2. OAuth Callback (`/api/auth/linkedin/callback`)

```typescript
// apps/blog/src/app/api/auth/linkedin/callback/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response("Authorization code missing", { status: 400 });
  }

  // 1. Authorization Code → Token 교환
  const tokenResponse = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    },
  );

  const { access_token, refresh_token } = await tokenResponse.json();

  // 2. Edge Config 업데이트
  await fetch(
    `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            operation: "upsert",
            key: "LINKEDIN_ACCESS_TOKEN",
            value: access_token,
          },
          {
            operation: "upsert",
            key: "LINKEDIN_REFRESH_TOKEN",
            value: refresh_token,
          },
          {
            operation: "upsert",
            key: "LINKEDIN_TOKEN_ISSUED_AT",
            value: Date.now(),
          },
        ],
      }),
    },
  );

  // 3. 완료 페이지
  return new Response(
    `<html>
      <body style="font-family: system-ui; padding: 40px; text-align: center;">
        <h1>✅ LinkedIn 연동 완료!</h1>
        <p>토큰이 갱신되었습니다. 이 창을 닫으셔도 됩니다.</p>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } },
  );
}
```

### GitHub Actions: 토큰 자동 갱신

```yaml
# .github/workflows/refresh-linkedin-token.yml
name: Refresh LinkedIn Token

on:
  schedule:
    - cron: "0 0 * * 1" # 매주 월요일
  workflow_dispatch:

jobs:
  refresh-token:
    runs-on: ubuntu-latest
    steps:
      - name: Get current tokens from Edge Config
        id: get-tokens
        run: |
          TOKENS=$(curl -s "https://edge-config.vercel.com/${{ secrets.EDGE_CONFIG_ID }}" \
            -H "Authorization: Bearer ${{ secrets.EDGE_CONFIG_TOKEN }}")
          echo "refresh_token=$(echo $TOKENS | jq -r '.LINKEDIN_REFRESH_TOKEN')" >> $GITHUB_OUTPUT
          echo "issued_at=$(echo $TOKENS | jq -r '.LINKEDIN_TOKEN_ISSUED_AT')" >> $GITHUB_OUTPUT

      - name: Check if refresh needed (within 7 days of expiry)
        id: check
        run: |
          ISSUED_AT=${{ steps.get-tokens.outputs.issued_at }}
          NOW=$(date +%s)
          DAYS_ELAPSED=$(( (NOW - ISSUED_AT/1000) / 86400 ))
          ACCESS_EXPIRES_IN=$(( 60 - DAYS_ELAPSED ))
          REFRESH_EXPIRES_IN=$(( 365 - DAYS_ELAPSED ))

          echo "access_expires_in=$ACCESS_EXPIRES_IN" >> $GITHUB_OUTPUT
          echo "refresh_expires_in=$REFRESH_EXPIRES_IN" >> $GITHUB_OUTPUT

          if [ $ACCESS_EXPIRES_IN -le 7 ]; then
            echo "needs_refresh=true" >> $GITHUB_OUTPUT
          else
            echo "needs_refresh=false" >> $GITHUB_OUTPUT
          fi

      - name: Refresh Access Token
        if: steps.check.outputs.needs_refresh == 'true'
        run: |
          RESPONSE=$(curl -s -X POST "https://www.linkedin.com/oauth/v2/accessToken" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -d "grant_type=refresh_token" \
            -d "refresh_token=${{ steps.get-tokens.outputs.refresh_token }}" \
            -d "client_id=${{ secrets.LINKEDIN_CLIENT_ID }}" \
            -d "client_secret=${{ secrets.LINKEDIN_CLIENT_SECRET }}")

          ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')

          # Update Edge Config
          curl -X PATCH "https://api.vercel.com/v1/edge-config/${{ secrets.EDGE_CONFIG_ID }}/items" \
            -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d "{\"items\": [{\"operation\": \"upsert\", \"key\": \"LINKEDIN_ACCESS_TOKEN\", \"value\": \"$ACCESS_TOKEN\"}]}"

      - name: Alert if Refresh Token expiring soon
        if: steps.check.outputs.refresh_expires_in <= 30
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔔 LinkedIn 재인증 필요 (30일 이내 만료)',
              body: `## LinkedIn Refresh Token 만료 예정
              
              **남은 일수**: ${{ steps.check.outputs.refresh_expires_in }}일
              
              아래 링크에서 재인증해주세요:
              
              👉 [LinkedIn 재인증하기](${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/linkedin)
              
              > 1분 내 완료됩니다.`,
              labels: ['urgent', 'auth']
            })
```

---

## 🔧 Environment Variables

### Required

| 키                     | 설명                                            |
| ---------------------- | ----------------------------------------------- |
| `NOTION_API_KEY`       | Notion Integration 토큰                         |
| `NOTION_DATABASE_ID`   | 블로그 데이터베이스 ID                          |
| `NEXT_PUBLIC_BASE_URL` | 블로그 도메인 (예: `https://myblog.vercel.app`) |

### Optional

| 키                      | 설명                  | 미설정 시           |
| ----------------------- | --------------------- | ------------------- |
| `AI_GATEWAY_API_KEY`    | Vercel AI Gateway 키  | Fallback 변환 사용  |
| `X_API_KEY`             | X API Key             | X 포스팅 스킵       |
| `X_API_SECRET`          | X API Secret          | X 포스팅 스킵       |
| `X_ACCESS_TOKEN`        | X Access Token        | X 포스팅 스킵       |
| `X_ACCESS_TOKEN_SECRET` | X Access Token Secret | X 포스팅 스킵       |
| `THREADS_ACCESS_TOKEN`  | Threads 액세스 토큰   | Threads 포스팅 스킵 |

### LinkedIn 전용 (Edge Config 사용)

| 키                         | 저장 위치      | 설명                    |
| -------------------------- | -------------- | ----------------------- |
| `LINKEDIN_CLIENT_ID`       | Vercel Env     | OAuth App Client ID     |
| `LINKEDIN_CLIENT_SECRET`   | Vercel Env     | OAuth App Client Secret |
| `LINKEDIN_ACCESS_TOKEN`    | Edge Config    | 자동 갱신 (60일)        |
| `LINKEDIN_REFRESH_TOKEN`   | Edge Config    | 1년 후 재인증 필요      |
| `LINKEDIN_TOKEN_ISSUED_AT` | Edge Config    | 발급 시각 (만료 계산용) |
| `VERCEL_TOKEN`             | GitHub Secrets | Edge Config 업데이트용  |
| `EDGE_CONFIG_ID`           | GitHub Secrets | Edge Config 식별자      |

---

## 📊 Notion Integration

### 상태 기반 워크플로우

```
Writing → Ready → Updated
              ↓
           [SNS 포스팅]
              ↓
         System Log 기록
```

| 상태      | 의미            |
| --------- | --------------- |
| `Ready`   | SNS 포스팅 대상 |
| `Updated` | 포스팅 완료     |

### System Log 기록 형식

```
[2026-01-14 10:00:00] SNS Auto Post
- X: ✅ https://x.com/user/status/123456
- LinkedIn: ✅ https://linkedin.com/feed/update/urn:li:share:789
- Threads: ❌ THREADS_ACCESS_TOKEN not configured
- LLM: ✅ AI Gateway (gpt-4o)
```

### 에러 발생 시

```
[2026-01-14 10:00:00] SNS Auto Post
- X: ❌ Rate limit exceeded
- LinkedIn: ✅ https://linkedin.com/feed/update/urn:li:share:789
- Threads: ✅ https://threads.net/@user/post/123
- LLM: ✅ AI Gateway (gpt-4o)
- Error: X posting failed, will retry next hour
```

---

## 🔁 GitHub Actions Workflow

### 기본 구조

```yaml
# .github/workflows/sns-auto-post.yml
name: SNS Auto Post

on:
  schedule:
    - cron: "0 * * * *" # 매시간 정각
  workflow_dispatch: # 수동 트리거 (Notion 상태 기반으로 동일 로직)

jobs:
  post-to-sns:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Fetch Ready Posts from Notion
        id: notion
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
        run: |
          # Notion API 호출하여 Ready 상태 글 조회

      - name: Transform Content with AI Gateway
        if: env.AI_GATEWAY_API_KEY != ''
        uses: vercel/ai-action@v2
        id: transform
        with:
          model: "openai/gpt-4o"
          api-key: ${{ secrets.AI_GATEWAY_API_KEY }}
          prompt: |
            # LLM 프롬프트
          schema: |
            # JSON Schema

      - name: Fallback Transform
        if: env.AI_GATEWAY_API_KEY == ''
        id: fallback
        run: |
          # 글자 수 자르기 + 링크

      - name: Post to X
        if: env.X_API_KEY != ''
        env:
          X_API_KEY: ${{ secrets.X_API_KEY }}
          X_API_SECRET: ${{ secrets.X_API_SECRET }}
        run: |
          # X API 호출

      - name: Post to LinkedIn
        if: env.LINKEDIN_ACCESS_TOKEN != ''
        env:
          LINKEDIN_ACCESS_TOKEN: ${{ secrets.LINKEDIN_ACCESS_TOKEN }}
        run: |
          # LinkedIn API 호출

      - name: Post to Threads
        if: env.THREADS_ACCESS_TOKEN != ''
        env:
          THREADS_ACCESS_TOKEN: ${{ secrets.THREADS_ACCESS_TOKEN }}
        run: |
          # Threads API 호출

      - name: Update Notion Status
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
        run: |
          # Ready → Updated 상태 변경
          # System Log 기록
```

---

## 🎯 Optional Features (Roadmap)

| 기능            | 설명                                 | 우선순위 |
| --------------- | ------------------------------------ | :------: |
| 썸네일 이미지   | 블로그 첫 번째 이미지를 SNS에 첨부   |    중    |
| 블로그 URL 포함 | 포스트에 블로그 링크 추가            |    중    |
| 재시도 로직     | SNS API 실패 시 다음 Cron에서 재시도 |   낮음   |
| 다국어 지원     | 영어 버전 SNS 포스트 생성            |   낮음   |

---

## ⚠️ Constraints & Considerations

### Rate Limits

개인 블로그 사용 기준으로는 Rate Limit 문제 없음:

- 매시간 1개 포스트 가정 → 하루 24개 (제한 훨씬 이하)

### 보안

- 모든 API 키는 GitHub Secrets에 저장
- 로그에 토큰 노출 주의
- Prompt Injection 방지 (환경변수로 sanitize)

### 중복 포스팅 방지

- `Ready` → `Updated` 상태 변경으로 자연스럽게 해결
- 한 번 포스팅된 글은 다시 조회되지 않음

---

## 📝 Notes

_구현 중 발견한 이슈나 학습 내용을 여기에 기록합니다._

---

## 📦 Phase별 To-Do 리스트

구현은 아래 Phase별 문서를 따라 진행합니다:

| Phase | 상태 | 문서                                                                                   | 설명                      | 예상 소요 |
| :---: | :--: | -------------------------------------------------------------------------------------- | ------------------------- | :-------: |
|   0   |  ⏳  | [PHASE-0-SETUP.md](./sns-auto-post/PHASE-0-SETUP.md)                                   | 인프라 및 초기 설정       |  1-2시간  |
|   1   |  ✅  | [PHASE-1-LINKEDIN-OAUTH.md](./sns-auto-post/PHASE-1-LINKEDIN-OAUTH.md)                 | LinkedIn OAuth 엔드포인트 |   ~45분   |
|   2   |  ⏳  | [PHASE-2-LINKEDIN-TOKEN-REFRESH.md](./sns-auto-post/PHASE-2-LINKEDIN-TOKEN-REFRESH.md) | LinkedIn 토큰 자동 갱신   |  2-3시간  |
|   3   |  ⏳  | [PHASE-3-CORE-POSTING.md](./sns-auto-post/PHASE-3-CORE-POSTING.md)                     | SNS 포스팅 핵심 로직      |  4-5시간  |
|   4   |  ⏳  | [PHASE-4-PLATFORM-POSTING.md](./sns-auto-post/PHASE-4-PLATFORM-POSTING.md)             | 플랫폼별 포스팅           |  4-5시간  |
|   5   |  ⏳  | [PHASE-5-NOTION-WRITEBACK.md](./sns-auto-post/PHASE-5-NOTION-WRITEBACK.md)             | Notion Write-back         |  2-3시간  |

**총 예상 소요: 15-21시간**

### 의존성 그래프

```
Phase 0 (인프라)
    │
    ├──→ Phase 1 (LinkedIn OAuth) ──→ Phase 2 (토큰 자동 갱신)
    │
    └──→ Phase 3 (핵심 로직) ──→ Phase 4 (플랫폼 포스팅) ──→ Phase 5 (Write-back)
```

> Phase 1-2 (LinkedIn)와 Phase 3-5 (포스팅)는 병렬 진행 가능

---

## 📚 References

- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [vercel/ai-action GitHub](https://github.com/vercel/ai-action)
- [X API v2 Documentation](https://developer.x.com/en/docs/twitter-api)
- [X API v2 Authentication](https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping)
- [LinkedIn Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)
- [LinkedIn Programmatic Refresh Tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)
- [Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Vercel Edge Config](https://vercel.com/docs/edge-config)
- [Vercel Edge Config API](https://vercel.com/docs/rest-api/reference/endpoints/edge-config/update-edge-config-items-in-batch)

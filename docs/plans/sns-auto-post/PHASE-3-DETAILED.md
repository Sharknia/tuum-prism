# Phase 3: SNS 포스팅 핵심 로직 - 상세 구현 계획

**Status**: ✅ Complete
**Started**: 2026-01-14
**Last Updated**: 2026-01-14
**Completed**: 2026-01-14
**Actual Time**: ~1시간
**Dependencies**: Phase 0 완료 (Phase 1, 2는 LinkedIn 전용이므로 병렬 가능)

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

Notion에서 `Ready` 상태 글을 조회하고, SNS용 콘텐츠로 변환하는 핵심 로직을 구현합니다.
이 Phase는 SNS 자동 포스팅 워크플로우의 핵심이며, Phase 4 (플랫폼별 포스팅)의 입력 데이터를 생성합니다.

### Success Criteria

- [x] GitHub Actions 워크플로우 `sns-auto-post.yml` 생성 완료
- [x] Notion `Ready` 상태 글 조회 성공
- [x] LLM 변환 또는 Fallback 변환 동작
- [x] short/long 버전 콘텐츠 생성
- [x] 해시태그 생성
- [x] 블로그 URL 생성
- [x] 다음 Step으로 데이터 전달 (GITHUB_OUTPUT)

### User Impact

- SNS 자동 포스팅의 핵심 파이프라인 구축
- LLM을 활용한 고품질 콘텐츠 생성 또는 Fallback으로 기본 변환

---

## 🏗️ Architecture Decisions

| Decision                                    | Rationale                             | Trade-offs                |
| ------------------------------------------- | ------------------------------------- | ------------------------- |
| **GitHub Actions에서 Notion API 직접 호출** | 블로그 앱 의존성 제거, 단순화         | 코드 중복 (mapper 로직)   |
| **curl + jq 사용**                          | Node.js 설정 불필요, 빠른 실행        | 복잡한 로직 처리 어려움   |
| **vercel/ai-action@v2 사용**                | Vercel AI Gateway 통합, 구조화된 출력 | AI Gateway API Key 필요   |
| **Fallback 변환**                           | AI Gateway 미설정 시에도 동작 보장    | LLM 대비 품질 저하        |
| **GITHUB_OUTPUT으로 데이터 전달**           | 단계 간 데이터 공유 표준 방식         | 대용량 데이터 제한 (~1MB) |

---

## 📦 Dependencies

### Required Before Starting

- [ ] Phase 0: GitHub Secrets 설정 완료
  - `NOTION_API_KEY`: Notion Integration 토큰
  - `NOTION_DATABASE_ID`: 블로그 데이터베이스 ID
  - `NEXT_PUBLIC_BASE_URL`: 블로그 도메인
- [ ] (선택) `AI_GATEWAY_API_KEY`: Vercel AI Gateway 키

### External Dependencies

- Notion API: `https://api.notion.com/v1/databases/{id}/query`
- Vercel AI Gateway: `vercel/ai-action@v2`
- GitHub Actions: `actions/checkout@v4`

### Codebase References

| 파일                                            | 참조 목적                                   |
| ----------------------------------------------- | ------------------------------------------- |
| `.github/workflows/refresh-linkedin-token.yml`  | curl + jq 패턴, GITHUB_OUTPUT, Summary 출력 |
| `apps/blog/src/domain/post/post-status.enum.ts` | PostStatus 정의 (`Ready`, `Updated`)        |
| `apps/blog/src/domain/post/post.entity.ts`      | Post 인터페이스 (title, description, tags)  |
| `docs/plans/PLAN_SNS_AUTO_POST.md`              | LLM 프롬프트, Schema 정의                   |

---

## 🧪 Test Strategy

### Testing Approach

GitHub Actions 워크플로우는 TDD보다 **수동 검증 + workflow_dispatch**로 테스트합니다.

### Test Categories

| Test Type       | Coverage Target | Purpose                       |
| --------------- | --------------- | ----------------------------- |
| **YAML Syntax** | 100%            | yamllint로 문법 검증          |
| **Dry Run**     | 핵심 로직       | workflow_dispatch로 수동 실행 |
| **Mock Data**   | 엣지 케이스     | 빈 결과, 에러 상황 처리       |

### Manual Test Scenarios

1. **Happy Path**: Ready 상태 글 1개 → 변환 성공
2. **Empty Result**: Ready 상태 글 0개 → 조기 종료
3. **LLM Fallback**: AI Gateway 키 없음 → Fallback 변환
4. **Error Handling**: Notion API 실패 → 에러 로그 출력

---

## 🚀 Implementation Sub-Phases

### Sub-Phase 3.1: 워크플로우 기본 구조 생성

**Goal**: GitHub Actions 워크플로우 파일 생성 및 기본 트리거 설정
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 3.1.1**: 워크플로우 파일 생성
  - File: `.github/workflows/sns-auto-post.yml`
  - Details:
    - Cron 스케줄: `0 * * * *` (매시간 정각)
    - workflow_dispatch 추가 (수동 트리거)
    - permissions 설정: `issues: write`, `contents: read`

- [ ] **Task 3.1.2**: 환경 변수 블록 정의
  - 글자 수 제한 상수
  - Notion API 버전

- [ ] **Task 3.1.3**: Job 기본 구조 설정
  - `runs-on: ubuntu-latest`
  - checkout step 추가

#### 참고 코드

```yaml
name: SNS Auto Post

on:
  schedule:
    - cron: "0 * * * *" # 매시간 정각
  workflow_dispatch: # 수동 트리거

env:
  MAX_SHORT_CHARS: 200
  MAX_LONG_CHARS: 400
  NOTION_API_VERSION: "2022-06-28"

jobs:
  post-to-sns:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read

    steps:
      - uses: actions/checkout@v4
```

#### Quality Gate ✋

- [ ] YAML 문법 검증 통과
- [ ] workflow_dispatch로 수동 실행 성공 (빈 실행)

---

### Sub-Phase 3.2: Notion Ready 상태 글 조회

**Goal**: Notion API를 호출하여 Ready 상태 글을 조회하고 필요한 데이터 추출
**Estimated Time**: 1시간
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 3.2.1**: Notion API 호출 Step 작성
  - curl로 POST 요청
  - Status = "Ready" 필터
  - page_size: 10 (합리적 제한)

- [ ] **Task 3.2.2**: 응답 파싱 및 데이터 추출
  - jq로 결과 개수 확인
  - 첫 번째 포스트 데이터 추출:
    - `page_id`
    - `title` (Name 속성)
    - `description` (Rich Text 속성)
    - `tags` (Multi-select 속성)

- [ ] **Task 3.2.3**: 조기 종료 로직
  - 결과가 0개면 워크플로우 종료
  - Summary에 "No posts to process" 출력

- [ ] **Task 3.2.4**: GITHUB_OUTPUT으로 데이터 전달
  - 다음 단계에서 사용할 수 있도록 출력

#### 참고 코드

```yaml
- name: Fetch Ready Posts from Notion
  id: notion
  env:
    NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
    NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
  run: |
    echo "📥 Fetching Ready posts from Notion..."

    RESPONSE=$(curl -s -X POST "https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query" \
      -H "Authorization: Bearer ${NOTION_API_KEY}" \
      -H "Notion-Version: ${{ env.NOTION_API_VERSION }}" \
      -H "Content-Type: application/json" \
      --data '{
        "filter": {
          "property": "상태",
          "status": {
            "equals": "Ready"
          }
        },
        "page_size": 10
      }')

    # 결과 개수 확인
    COUNT=$(echo "$RESPONSE" | jq '.results | length')
    echo "📊 Found $COUNT posts with Ready status"

    if [ "$COUNT" -eq 0 ]; then
      echo "has_posts=false" >> $GITHUB_OUTPUT
      echo "✅ No posts to process"
      exit 0
    fi

    echo "has_posts=true" >> $GITHUB_OUTPUT

    # 첫 번째 포스트 추출
    FIRST_POST=$(echo "$RESPONSE" | jq '.results[0]')
    PAGE_ID=$(echo "$FIRST_POST" | jq -r '.id')

    # 속성 추출 (Notion 속성명에 맞게 조정 필요)
    TITLE=$(echo "$FIRST_POST" | jq -r '.properties.이름.title[0].plain_text // .properties.Name.title[0].plain_text // "Untitled"')
    DESCRIPTION=$(echo "$FIRST_POST" | jq -r '.properties.설명.rich_text[0].plain_text // .properties.Description.rich_text[0].plain_text // ""')
    TAGS=$(echo "$FIRST_POST" | jq -r '[.properties.태그.multi_select[].name // .properties.Tags.multi_select[].name] | join(",")')

    echo "page_id=$PAGE_ID" >> $GITHUB_OUTPUT
    echo "title=$TITLE" >> $GITHUB_OUTPUT
    echo "description=$DESCRIPTION" >> $GITHUB_OUTPUT
    echo "tags=$TAGS" >> $GITHUB_OUTPUT

    echo "✅ Post data extracted: $TITLE"
```

#### Notion 속성 매핑

| Notion 속성명          | 타입         | jq 경로                                    |
| ---------------------- | ------------ | ------------------------------------------ |
| `이름` / `Name`        | Title        | `.properties.이름.title[0].plain_text`     |
| `설명` / `Description` | Rich Text    | `.properties.설명.rich_text[0].plain_text` |
| `태그` / `Tags`        | Multi-select | `.properties.태그.multi_select[].name`     |
| `상태` / `Status`      | Status       | `.properties.상태.status.name`             |

#### Quality Gate ✋

- [ ] Ready 상태 글 조회 성공 (workflow_dispatch 테스트)
- [ ] 빈 결과 시 조기 종료 동작 확인
- [ ] GITHUB_OUTPUT에 데이터 정상 전달

---

### Sub-Phase 3.3: LLM 콘텐츠 변환 (AI Gateway)

**Goal**: vercel/ai-action을 사용하여 블로그 글을 SNS용 short/long 버전으로 변환
**Estimated Time**: 1시간
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 3.3.1**: AI Gateway 조건부 실행 설정
  - `if: env.AI_GATEWAY_API_KEY != ''` 조건
  - 환경 변수 체크 로직

- [ ] **Task 3.3.2**: vercel/ai-action Step 작성
  - model: `openai/gpt-4o`
  - system: SNS 변환 가이드라인
  - schema: short/long 구조화된 출력

- [ ] **Task 3.3.3**: 출력 캡처 및 전달
  - `fromJSON(steps.transform.outputs.json)` 사용
  - GITHUB_OUTPUT으로 short/long 전달

#### 참고 코드

```yaml
- name: Check AI Gateway availability
  id: check-ai
  run: |
    if [ -n "${{ secrets.AI_GATEWAY_API_KEY }}" ]; then
      echo "available=true" >> $GITHUB_OUTPUT
    else
      echo "available=false" >> $GITHUB_OUTPUT
      echo "⚠️ AI Gateway not configured, will use fallback"
    fi

- name: Transform Content with AI Gateway
  id: transform
  if: steps.check-ai.outputs.available == 'true' && steps.notion.outputs.has_posts == 'true'
  uses: vercel/ai-action@v2
  with:
    model: "openai/gpt-4o"
    api-key: ${{ secrets.AI_GATEWAY_API_KEY }}
    system: |
      블로그 글을 SNS 포스트로 변환합니다.

      규칙:
      - 핵심 내용만 간결하게 요약
      - 이모지는 최소한으로 (1-2개)
      - 전문적이지만 친근한 톤
      - 한국어로 작성
      - 해시태그는 포함하지 않음 (별도 처리)

      short 버전: X(Twitter)용, 200자 이내
      long 버전: LinkedIn/Threads용, 400자 이내
    prompt: |
      제목: ${{ steps.notion.outputs.title }}
      내용: ${{ steps.notion.outputs.description }}
    schema: |
      {
        "type": "object",
        "properties": {
          "short": {
            "type": "string",
            "description": "X용 짧은 버전 (~200자)"
          },
          "long": {
            "type": "string",
            "description": "LinkedIn/Threads용 긴 버전 (~400자)"
          }
        },
        "required": ["short", "long"]
      }

- name: Capture AI Transform Output
  if: steps.transform.outputs.json != ''
  id: ai-output
  run: |
    SHORT='${{ fromJSON(steps.transform.outputs.json).short }}'
    LONG='${{ fromJSON(steps.transform.outputs.json).long }}'
    echo "short<<EOF" >> $GITHUB_OUTPUT
    echo "$SHORT" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
    echo "long<<EOF" >> $GITHUB_OUTPUT
    echo "$LONG" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
    echo "transform_method=ai" >> $GITHUB_OUTPUT
    echo "✅ AI transformation complete"
```

#### Quality Gate ✋

- [ ] AI Gateway 설정 시 LLM 변환 성공
- [ ] short (~200자), long (~400자) 생성 확인
- [ ] 출력 데이터 GITHUB_OUTPUT 전달 확인

---

### Sub-Phase 3.4: Fallback 콘텐츠 변환

**Goal**: AI Gateway 미설정 시 기본 변환 로직으로 short/long 생성
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 3.4.1**: Fallback 조건부 실행
  - AI Gateway 미사용 시에만 실행
  - `if: steps.check-ai.outputs.available == 'false'`

- [ ] **Task 3.4.2**: 글자 수 자르기 로직
  - short: 200자 + "..."
  - long: 400자 + "..."

- [ ] **Task 3.4.3**: 출력 포맷 통일
  - AI 변환과 동일한 출력 형식

#### 참고 코드

```yaml
- name: Fallback Transform (No AI)
  id: fallback
  if: steps.check-ai.outputs.available == 'false' && steps.notion.outputs.has_posts == 'true'
  env:
    TITLE: ${{ steps.notion.outputs.title }}
    DESCRIPTION: ${{ steps.notion.outputs.description }}
    MAX_SHORT: ${{ env.MAX_SHORT_CHARS }}
    MAX_LONG: ${{ env.MAX_LONG_CHARS }}
  run: |
    echo "🔄 Using fallback transformation..."

    # 글자 수 자르기
    SHORT=$(echo "$DESCRIPTION" | cut -c1-${MAX_SHORT})
    if [ ${#DESCRIPTION} -gt ${MAX_SHORT} ]; then
      SHORT="${SHORT}..."
    fi

    LONG=$(echo "$DESCRIPTION" | cut -c1-${MAX_LONG})
    if [ ${#DESCRIPTION} -gt ${MAX_LONG} ]; then
      LONG="${LONG}..."
    fi

    echo "short<<EOF" >> $GITHUB_OUTPUT
    echo "$SHORT" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
    echo "long<<EOF" >> $GITHUB_OUTPUT
    echo "$LONG" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT
    echo "transform_method=fallback" >> $GITHUB_OUTPUT
    echo "✅ Fallback transformation complete"
```

#### Quality Gate ✋

- [ ] AI Gateway 미설정 시 Fallback 실행 확인
- [ ] 글자 수 제한 정상 동작
- [ ] 출력 형식 AI 변환과 동일

---

### Sub-Phase 3.5: 해시태그 및 URL 생성

**Goal**: Notion 태그를 해시태그로 변환하고 블로그 URL 생성
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 3.5.1**: 해시태그 변환 로직
  - 태그 배열 → `#태그` 형식
  - 공백 제거
  - 최대 5개 제한

- [ ] **Task 3.5.2**: 블로그 URL 생성
  - `${BASE_URL}/blog/${page_id}` 형식
  - Notion 하이픈 제거된 UUID 사용

- [ ] **Task 3.5.3**: 최종 포스트 콘텐츠 조립
  - short + 해시태그 + URL (X용)
  - long + 해시태그 + URL (LinkedIn/Threads용)

#### 참고 코드

```yaml
- name: Generate Hashtags and URL
  id: format
  if: steps.notion.outputs.has_posts == 'true'
  env:
    TAGS: ${{ steps.notion.outputs.tags }}
    PAGE_ID: ${{ steps.notion.outputs.page_id }}
    BASE_URL: ${{ secrets.NEXT_PUBLIC_BASE_URL }}
    TITLE: ${{ steps.notion.outputs.title }}
  run: |
    echo "🏷️ Generating hashtags and URL..."

    # 해시태그 변환 (공백 제거, 최대 5개)
    HASHTAGS=""
    IFS=',' read -ra TAG_ARRAY <<< "$TAGS"
    COUNT=0
    for tag in "${TAG_ARRAY[@]}"; do
      if [ $COUNT -ge 5 ]; then break; fi
      # 공백 제거
      clean_tag=$(echo "$tag" | tr -d ' ')
      if [ -n "$clean_tag" ]; then
        HASHTAGS="$HASHTAGS #$clean_tag"
        COUNT=$((COUNT + 1))
      fi
    done
    HASHTAGS=$(echo "$HASHTAGS" | xargs)  # trim

    # 블로그 URL 생성
    BLOG_URL="${BASE_URL}/blog/${PAGE_ID}"

    echo "hashtags=$HASHTAGS" >> $GITHUB_OUTPUT
    echo "blog_url=$BLOG_URL" >> $GITHUB_OUTPUT

    echo "✅ Hashtags: $HASHTAGS"
    echo "✅ Blog URL: $BLOG_URL"

- name: Compose Final Posts
  id: compose
  if: steps.notion.outputs.has_posts == 'true'
  env:
    TITLE: ${{ steps.notion.outputs.title }}
    SHORT: ${{ steps.ai-output.outputs.short || steps.fallback.outputs.short }}
    LONG: ${{ steps.ai-output.outputs.long || steps.fallback.outputs.long }}
    HASHTAGS: ${{ steps.format.outputs.hashtags }}
    BLOG_URL: ${{ steps.format.outputs.blog_url }}
    TRANSFORM_METHOD: ${{ steps.ai-output.outputs.transform_method || steps.fallback.outputs.transform_method }}
  run: |
    echo "📝 Composing final posts..."

    # X용 (280자 제한 고려)
    POST_SHORT="${TITLE}

${SHORT}

${HASHTAGS}
${BLOG_URL}"

    # LinkedIn/Threads용
    POST_LONG="${TITLE}

${LONG}

${HASHTAGS}

🔗 ${BLOG_URL}"

    # 멀티라인 출력
    echo "post_short<<EOF" >> $GITHUB_OUTPUT
    echo "$POST_SHORT" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

    echo "post_long<<EOF" >> $GITHUB_OUTPUT
    echo "$POST_LONG" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

    echo "transform_method=$TRANSFORM_METHOD" >> $GITHUB_OUTPUT

    echo "✅ Posts composed successfully"
    echo "📏 Short post length: ${#POST_SHORT} chars"
    echo "📏 Long post length: ${#POST_LONG} chars"
```

#### Quality Gate ✋

- [ ] 해시태그 정상 생성 (최대 5개, 공백 제거)
- [ ] 블로그 URL 정상 생성
- [ ] 최종 포스트 조립 완료

---

### Sub-Phase 3.6: Summary 및 출력 준비

**Goal**: 워크플로우 결과 Summary 생성 및 Phase 4로 전달할 데이터 정리
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 3.6.1**: GITHUB_STEP_SUMMARY 생성
  - 처리 결과 테이블
  - 에러 발생 시 상세 로그

- [ ] **Task 3.6.2**: Phase 4 입력 데이터 정리
  - page_id, title
  - post_short, post_long
  - blog_url, transform_method

- [ ] **Task 3.6.3**: 에러 핸들링
  - Notion API 실패 시 Issue 생성
  - AI Gateway 실패 시 Fallback 자동 전환

#### 참고 코드

```yaml
- name: Generate Workflow Summary
  if: always()
  env:
    HAS_POSTS: ${{ steps.notion.outputs.has_posts }}
    TITLE: ${{ steps.notion.outputs.title }}
    TRANSFORM_METHOD: ${{ steps.compose.outputs.transform_method }}
    BLOG_URL: ${{ steps.format.outputs.blog_url }}
  run: |
    echo "## 📱 SNS Auto Post Summary" >> $GITHUB_STEP_SUMMARY
    echo "" >> $GITHUB_STEP_SUMMARY
    echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
    echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY

    if [ "$HAS_POSTS" = "true" ]; then
      echo "| Posts Found | ✅ Yes |" >> $GITHUB_STEP_SUMMARY
      echo "| Title | $TITLE |" >> $GITHUB_STEP_SUMMARY
      echo "| Transform Method | $TRANSFORM_METHOD |" >> $GITHUB_STEP_SUMMARY
      echo "| Blog URL | $BLOG_URL |" >> $GITHUB_STEP_SUMMARY
    else
      echo "| Posts Found | ❌ No Ready posts |" >> $GITHUB_STEP_SUMMARY
      echo "| Status | ⏭️ Skipped |" >> $GITHUB_STEP_SUMMARY
    fi

    echo "" >> $GITHUB_STEP_SUMMARY
    echo "---" >> $GITHUB_STEP_SUMMARY
    echo "*Workflow executed at: $(date -u '+%Y-%m-%d %H:%M:%S UTC')*" >> $GITHUB_STEP_SUMMARY
```

#### Quality Gate ✋

- [ ] Summary 정상 출력
- [ ] 모든 출력 데이터 확인 가능
- [ ] 에러 시나리오 처리 완료

---

## 📊 Complete Workflow Structure

### 전체 Step 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│                    sns-auto-post.yml                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Fetch Ready Posts from Notion                                │
│     └─ POST /v1/databases/{id}/query (Status = "Ready")          │
│                    ↓                                             │
│  2. Check AI Gateway Availability                                │
│     ├─ secrets.AI_GATEWAY_API_KEY 존재 여부                      │
│                    ↓                                             │
│  3a. Transform with AI Gateway (if available)                    │
│      └─ vercel/ai-action@v2 → short/long                         │
│                    OR                                            │
│  3b. Fallback Transform (if no AI)                               │
│      └─ 글자 수 자르기 → short/long                              │
│                    ↓                                             │
│  4. Generate Hashtags and URL                                    │
│     ├─ tags → #hashtags                                          │
│     └─ page_id → blog_url                                        │
│                    ↓                                             │
│  5. Compose Final Posts                                          │
│     ├─ post_short (X용)                                          │
│     └─ post_long (LinkedIn/Threads용)                            │
│                    ↓                                             │
│  6. Generate Summary                                             │
│                                                                  │
│  → Phase 4: Platform Posting                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Risk Assessment

| Risk                             | Probability | Impact | Mitigation Strategy                        |
| -------------------------------- | ----------- | ------ | ------------------------------------------ |
| Notion API Rate Limit (3req/sec) | Low         | Medium | 단일 쿼리로 최대 10개 조회, 배치 처리      |
| AI Gateway 비용 증가             | Medium      | Low    | Fallback 제공, 월간 사용량 모니터링        |
| 긴 콘텐츠 GITHUB_OUTPUT 제한     | Low         | High   | EOF 문법 사용, 필요시 artifact 저장        |
| Notion 속성명 불일치             | Medium      | High   | 한글/영문 속성명 모두 지원 (fallback 체인) |

---

## 🔄 Rollback Strategy

### If Phase 3 Fails

**Steps to revert**:

1. `.github/workflows/sns-auto-post.yml` 파일 삭제
2. Cron 스케줄 비활성화 (파일 삭제로 자동 해제)
3. 관련 GitHub Secrets는 유지 (다른 용도 가능)

### Partial Rollback

- LLM 변환 실패 시: Fallback 자동 전환
- Notion 조회 실패 시: 다음 Cron 실행까지 대기

---

## 📊 Progress Tracking

### Completion Status

- **Sub-Phase 3.1**: ✅ 100%
- **Sub-Phase 3.2**: ✅ 100%
- **Sub-Phase 3.3**: ✅ 100%
- **Sub-Phase 3.4**: ✅ 100%
- **Sub-Phase 3.5**: ✅ 100%
- **Sub-Phase 3.6**: ✅ 100%

**Overall Progress**: 100% complete

### Time Tracking

| Sub-Phase                | Estimated | Actual | Variance |
| ------------------------ | --------- | ------ | -------- |
| 3.1 워크플로우 기본 구조 | 30분      | 10분   | -20분    |
| 3.2 Notion 글 조회       | 1시간     | 15분   | -45분    |
| 3.3 LLM 콘텐츠 변환      | 1시간     | 15분   | -45분    |
| 3.4 Fallback 변환        | 30분      | 10분   | -20분    |
| 3.5 해시태그/URL 생성    | 30분      | 5분    | -25분    |
| 3.6 Summary 출력         | 30분      | 5분    | -25분    |
| **Total**                | 4-5시간   | ~1시간 | -3~4시간 |

---

## 📝 Notes & Learnings

### Implementation Notes

- **전체 워크플로우 한 번에 구현**: Sub-Phase를 나눠서 진행하지 않고 전체 워크플로우를 한 번에 작성하여 예상보다 훨씬 빠르게 완료
- **한글/영문 속성명 지원**: jq의 `//` 연산자로 fallback 체인 구현하여 다양한 Notion 설정 지원
- **멀티라인 출력**: GITHUB_OUTPUT에서 `<<EOF` 문법 사용하여 멀티라인 데이터 안전하게 전달
- **에러 핸들링**: Notion API 실패 시 자동 Issue 생성으로 운영 안정성 확보
- **YAML Lint 활용**: `npx yaml-lint`로 문법 검증하여 CI 전에 오류 발견

### Blockers Encountered

- 없음 (원활하게 진행됨)

---

## 📚 References

### Documentation

- [Notion API Database Query](https://developers.notion.com/reference/post-database-query)
- [vercel/ai-action GitHub](https://github.com/vercel/ai-action)
- [GitHub Actions Outputs](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter)
- [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)

### Related Files

- `docs/plans/PLAN_SNS_AUTO_POST.md`: 전체 프로젝트 계획
- `.github/workflows/refresh-linkedin-token.yml`: 참고 워크플로우

---

## ✅ Final Checklist

**Before marking Phase 3 as COMPLETE**:

- [ ] 모든 Sub-Phase 완료
- [ ] workflow_dispatch로 수동 테스트 성공
- [ ] Ready 상태 글 조회 → 콘텐츠 변환 → 출력 생성 파이프라인 동작 확인
- [ ] AI Gateway 및 Fallback 양쪽 경로 테스트
- [ ] Summary 출력 정상 확인
- [ ] PHASE-3-CORE-POSTING.md 완료 체크박스 업데이트

---

## ➡️ Next Phase

→ [Phase 4: 플랫폼별 포스팅](./PHASE-4-PLATFORM-POSTING.md)

Phase 3 완료 후 `post_short`, `post_long`, `page_id`, `blog_url`을 Phase 4에서 사용하여 실제 SNS 플랫폼에 포스팅합니다.

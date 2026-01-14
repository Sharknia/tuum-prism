# Phase 3: SNS 포스팅 핵심 로직

**Status**: ✅ Complete
**Started**: 2026-01-14
**Last Updated**: 2026-01-14
**Completed**: 2026-01-14
**Actual Time**: ~1시간
**Dependencies**: Phase 0 완료 (Phase 1, 2는 LinkedIn 전용이므로 병렬 가능)

---

## 목표

Notion에서 Ready 상태 글을 조회하고, SNS용 콘텐츠로 변환하는 핵심 로직을 구현합니다.

---

## ✅ 구현 완료 항목

### 3.1 GitHub Actions 메인 워크플로우 생성

**파일**: `.github/workflows/sns-auto-post.yml`

- [x] Cron 스케줄 설정 (매시간 정각 `0 * * * *`)
- [x] workflow_dispatch 추가 (수동 트리거 + dry_run 옵션)
- [x] 기본 Job 구조 설정 (runs-on, permissions, checkout)

### 3.2 Notion Ready 상태 글 조회

- [x] Notion API 호출 (상태 = "Ready" 필터)
- [x] 조회 결과가 없으면 조기 종료
- [x] 포스트 데이터 추출
  - [x] 제목 (이름/Name/제목 속성 지원)
  - [x] 설명 (설명/Description/요약 속성 지원)
  - [x] 태그 (태그/Tags 속성 지원)
  - [x] 페이지 ID

### 3.3 콘텐츠 변환 - LLM (AI Gateway)

- [x] `vercel/ai-action@v2` 사용
- [x] 시스템 프롬프트 설정 (한국어, 이모지 최소화, 전문적 톤)
- [x] 입력: 제목 + 설명
- [x] 출력: short (X용 ~200자), long (LinkedIn/Threads용 ~400자)
- [x] JSON Schema 정의

### 3.4 콘텐츠 변환 - Fallback

- [x] AI Gateway 미설정 시 Fallback 로직
- [x] 글자 수 자르기 (short: 200자, long: 400자)
- [x] Description 없으면 Title 사용

### 3.5 해시태그 생성

- [x] Notion 태그 배열 → `#태그` 형식 변환
- [x] 공백 제거
- [x] 최대 5개 제한

### 3.6 블로그 URL 생성

- [x] `${NEXT_PUBLIC_BASE_URL}/blog/${pageId}` 형식

### 3.7 출력 준비

- [x] short 버전 (X용) - `post_short`
- [x] long 버전 (Threads/LinkedIn용) - `post_long`
- [x] 해시태그 - `hashtags`
- [x] 블로그 URL - `blog_url`
- [x] 다음 Step으로 전달 (GitHub Actions outputs)

### 3.8 추가 구현 항목

- [x] GITHUB_STEP_SUMMARY 생성 (실행 결과 요약)
- [x] 에러 핸들링 (Notion API 실패 시 Issue 자동 생성)
- [x] Dry Run 모드 지원

---

## 완료 기준

- [x] Ready 상태 글 조회 성공
- [x] LLM 변환 또는 Fallback 변환 동작
- [x] short/long 버전 생성
- [x] 해시태그 생성
- [x] 블로그 URL 생성
- [x] YAML 문법 검증 통과
- [x] 기존 테스트 91개 모두 통과

---

## 📊 테스트 결과

```
✔ YAML Lint successful.

Test Files  11 passed (11)
     Tests  91 passed (91)
  Duration  1.67s
```

---

## 📝 생성된 파일

- `.github/workflows/sns-auto-post.yml` (525줄)
- `docs/plans/sns-auto-post/PHASE-3-DETAILED.md` (상세 구현 계획)

---

## 워크플로우 구조

```
prepare-content Job
├── Step 1: Checkout repository
├── Step 2: Fetch Ready posts from Notion
│   ├── API 키 확인
│   ├── Notion API 호출 (Status = "Ready")
│   └── 데이터 추출 (page_id, title, description, tags)
├── Step 3: Check AI Gateway availability
├── Step 4a: Transform content with AI Gateway (조건부)
├── Step 4b: Capture AI transform output
├── Step 4c: Fallback transform (AI 미사용 시)
├── Step 5: Generate hashtags and blog URL
├── Step 6: Compose final posts (post_short, post_long)
├── Step 7: Generate workflow summary
└── Step 8: Create issue on Notion API error (조건부)
```

---

## Job Outputs (Phase 4에서 사용)

| Output             | 설명                             |
| ------------------ | -------------------------------- |
| `has_posts`        | Ready 상태 글 존재 여부          |
| `page_id`          | Notion 페이지 ID                 |
| `title`            | 글 제목                          |
| `post_short`       | X용 완성된 포스트                |
| `post_long`        | LinkedIn/Threads용 완성된 포스트 |
| `blog_url`         | 블로그 URL                       |
| `hashtags`         | 해시태그 문자열                  |
| `transform_method` | 변환 방식 (ai/fallback)          |

---

## 다음 Phase

→ [Phase 4: 플랫폼별 포스팅](./PHASE-4-PLATFORM-POSTING.md)

Phase 3의 `prepare-content` Job outputs를 사용하여 실제 SNS 플랫폼에 포스팅합니다.

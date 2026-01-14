# Phase 3: SNS 포스팅 핵심 로직

**예상 소요**: 4-5시간
**의존성**: Phase 0 완료 (Phase 1, 2는 LinkedIn 전용이므로 병렬 가능)

---

## 목표

Notion에서 Ready 상태 글을 조회하고, SNS용 콘텐츠로 변환하는 핵심 로직을 구현합니다.

---

## To-Do

### 3.1 GitHub Actions 메인 워크플로우 생성

**파일**: `.github/workflows/sns-auto-post.yml`

- [ ] Cron 스케줄 설정 (매시간 정각)
- [ ] workflow_dispatch 추가 (수동 트리거)
- [ ] 기본 Job 구조 설정

### 3.2 Notion Ready 상태 글 조회

**파일**: 별도 스크립트 또는 워크플로우 inline

- [ ] Notion API 호출 (상태 = "Ready" 필터)
- [ ] 조회 결과가 없으면 조기 종료
- [ ] 포스트 데이터 추출
  - [ ] 제목
  - [ ] 설명 (description)
  - [ ] 태그
  - [ ] 페이지 ID

### 3.3 콘텐츠 변환 - LLM (AI Gateway)

- [ ] `vercel/ai-action@v2` 사용
- [ ] 시스템 프롬프트 설정
- [ ] 입력: 제목 + 설명
- [ ] 출력: short (X용), long (Threads/LinkedIn용)
- [ ] JSON Schema 정의

### 3.4 콘텐츠 변환 - Fallback

- [ ] AI Gateway 미설정 시 Fallback 로직
- [ ] 글자 수 자르기 (short: 200자, long: 400자)
- [ ] 블로그 URL 추가

### 3.5 해시태그 생성

- [ ] Notion 태그 배열 → `#태그` 형식 변환
- [ ] 공백 제거
- [ ] 최대 5개 제한 (선택)

### 3.6 블로그 URL 생성

- [ ] `${NEXT_PUBLIC_BASE_URL}/blog/${pageId}` 형식

### 3.7 출력 준비

- [ ] short 버전 (X용)
- [ ] long 버전 (Threads/LinkedIn용)
- [ ] 해시태그
- [ ] 블로그 URL
- [ ] 다음 Step으로 전달 (GitHub Actions outputs)

---

## 완료 기준

- [ ] Ready 상태 글 조회 성공
- [ ] LLM 변환 또는 Fallback 변환 동작
- [ ] short/long 버전 생성
- [ ] 해시태그 생성
- [ ] 블로그 URL 생성

---

## 참고 코드

```typescript
// Fallback 변환
function fallbackTransform(title: string, content: string, blogUrl: string) {
  const MAX_SHORT = 200;
  const MAX_LONG = 400;

  const short = content.slice(0, MAX_SHORT) + "...";
  const long = content.slice(0, MAX_LONG) + "...";

  return {
    short: `${title}\n\n${short}\n\n${blogUrl}`,
    long: `${title}\n\n${long}\n\n${blogUrl}`,
  };
}

// 해시태그 변환
function tagsToHashtags(tags: string[]): string {
  return tags.map((tag) => `#${tag.replace(/\s+/g, "")}`).join(" ");
}
```

```yaml
# LLM 변환 (vercel/ai-action)
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
      제목: ${{ steps.notion.outputs.title }}
      내용: ${{ steps.notion.outputs.description }}
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

---

## 다음 Phase

→ [Phase 4: 플랫폼별 포스팅](./PHASE-4-PLATFORM-POSTING.md)

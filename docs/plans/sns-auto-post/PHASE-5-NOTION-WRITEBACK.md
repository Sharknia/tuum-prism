# Phase 5: Notion Write-back 및 완료 처리

**예상 소요**: 2-3시간
**의존성**: Phase 4 완료

---

## 목표

SNS 포스팅 결과를 Notion에 기록하고, 상태를 업데이트합니다.

---

## To-Do

### 5.1 상태 변경

- [ ] Notion API로 페이지 상태 업데이트
- [ ] `Ready` → `Updated`
- [ ] 기존 `NotionPostRepository.updateStatus()` 재사용 검토

### 5.2 System Log 기록

- [ ] 포스팅 결과를 System Log에 append
- [ ] 기존 `NotionPostRepository.appendLog()` 재사용 검토
- [ ] 로그 형식:
  ```
  [2026-01-14 10:00:00] SNS Auto Post
  - X: ✅ https://x.com/user/status/123456
  - LinkedIn: ✅ https://linkedin.com/feed/update/urn:li:share:789
  - Threads: ❌ THREADS_ACCESS_TOKEN not configured
  - LLM: ✅ AI Gateway (gpt-4o)
  ```

### 5.3 에러 발생 시 처리

- [ ] 일부 플랫폼 실패해도 나머지 결과 기록
- [ ] 전체 실패 시 상태 유지 (`Ready` 그대로)
- [ ] 에러 로그에 상세 내용 기록

### 5.4 GitHub Actions Job Summary

- [ ] 포스팅 결과 요약 출력
- [ ] 성공/실패/스킵 플랫폼 표시
- [ ] 에러 메시지 표시 (있는 경우)

---

## 완료 기준

- [ ] 포스팅 성공 시 `Ready` → `Updated` 상태 변경
- [ ] System Log에 결과 기록
- [ ] 일부 실패해도 성공한 플랫폼 결과는 기록
- [ ] GitHub Actions에서 결과 확인 가능

---

## 참고 코드

```typescript
// 기존 NotionPostRepository 메서드 활용
await repository.updateStatus(pageId, PostStatus.Updated);
await repository.appendLog(pageId, logMessage);
```

```typescript
// 로그 메시지 생성
function formatLogMessage(results: PostingResults): string {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const lines = [`[${timestamp}] SNS Auto Post`];

  for (const [platform, result] of Object.entries(results)) {
    if (result.success) {
      lines.push(`- ${platform}: ✅ ${result.url}`);
    } else if (result.skipped) {
      lines.push(`- ${platform}: ⏭️ ${result.reason}`);
    } else {
      lines.push(`- ${platform}: ❌ ${result.error}`);
    }
  }

  return lines.join("\n");
}
```

---

## Phase 5 완료 = MVP 완료 🎉

모든 Phase 완료 시:

- [x] Phase 0: 인프라 설정
- [x] Phase 1: LinkedIn OAuth 엔드포인트
- [x] Phase 2: LinkedIn 토큰 자동 갱신
- [x] Phase 3: SNS 포스팅 핵심 로직
- [x] Phase 4: 플랫폼별 포스팅
- [x] Phase 5: Notion Write-back

---

## 향후 개선 (Roadmap)

| 기능          | 설명                                 | 우선순위 |
| ------------- | ------------------------------------ | :------: |
| 썸네일 이미지 | 블로그 첫 번째 이미지를 SNS에 첨부   |    중    |
| 재시도 로직   | SNS API 실패 시 다음 Cron에서 재시도 |   낮음   |
| 다국어 지원   | 영어 버전 SNS 포스트 생성            |   낮음   |
| 슬랙 알림     | 포스팅 결과를 Slack으로 알림         |   낮음   |

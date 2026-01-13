# tuum-prism MVP To Do List

> **목표**: Notion에 글 작성 → 블로그 배포 + SNS 동시 업로드 + GitHub 잔디 자동화

---

## Phase 1: 프로젝트 기반 구축 ✅

- [x] Next.js 프로젝트 초기 세팅
- [x] TypeScript + ESLint + Prettier 설정
- [x] Vitest 테스트 환경 설정
- [x] 환경변수 구조 설계 (`.env.example` 작성)

---

## Phase 2: Notion 연동

- [x] Notion API 클라이언트 구현
- [x] 특정 태그(`Ready`) 필터링 로직
- [x] 페이지 데이터 파싱 및 변환
- [x] 배포 완료 시 상태 업데이트 (`Published`) Write-back
- [x] 배포 결과(SNS URL 등) Notion 속성에 기록

---

## Phase 3: 블로그 렌더링

- [x] `@tuum/refract-notion` 자체 개발
- [ ] 게시글 목록 페이지
- [ ] 게시글 상세 페이지
- [x] ISR (Incremental Static Regeneration) 적용
- [ ] 커스텀 도메인 설정 가이드

---

## Phase 4: 이미지 영구화 파이프라인

- [x] Notion 이미지 URL 만료 문제 해결
- [x] Vercel Blob 연동 (ImageService, BlobStorageAdapter)
- [ ] 기존 이미지 마이그레이션 스크립트 (선택)

---

## Phase 5: 댓글 시스템

- [ ] Giscus / Utterances 선택 및 통합
- [ ] 환경변수 기반 설정

---

## Phase 6: SNS 자동 업로드

### LinkedIn

- [ ] LinkedIn API 연동 (`w_member_social` 권한)
- [ ] 이미지 Asset 등록 프로세스
- [ ] 게시글 포맷팅 및 업로드

### X (Twitter)

- [ ] X API v2 연동
- [ ] Rate Limit 예외 처리
- [ ] 게시글 포맷팅 및 업로드

### Threads

- [ ] Threads 공식 API 연동
- [ ] 이미지 컨테이너 생성
- [ ] 게시글 포맷팅 및 업로드

---

## Phase 7: 자동화 (GitHub Actions)

- [ ] Cron 기반 자동 실행 워크플로우 (`0 * * * *`)
- [ ] 수동 트리거 지원 (`workflow_dispatch`)
- [ ] Notion → 블로그 → SNS 파이프라인 통합

---

## Phase 8: 문서화 및 Onboarding

- [ ] README.md 상세 가이드
- [ ] 환경변수 설정 가이드
- [ ] 각 플랫폼 API 키 발급 가이드
- [ ] 트러블슈팅 FAQ

---

## 우선순위 참고

| 순위 | 항목      | 이유                                          |
| ---- | --------- | --------------------------------------------- |
| 1    | Phase 1~3 | **핵심 기능** - Notion → 블로그가 작동해야 함 |
| 2    | Phase 4   | 이미지 없으면 블로그 품질 저하                |
| 3    | Phase 7   | 자동화 없으면 수동 배포 필요                  |
| 4    | Phase 5~6 | SNS/댓글은 점진적 추가 가능                   |
| 5    | Phase 8   | 사용자 온보딩에 필수                          |

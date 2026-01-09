# tuum-prism

> **"Turn your Tuum(틈) into a Prism"**

## Prism의 의미

하나의 빛이 프리즘을 통과하면 여러 갈래 빛이 되듯,  
**한 번의 Notion 작성으로 여러 채널에 동시 배포**합니다.

- Notion → 블로그
- Notion → LinkedIn, X, Threads
- Notion → GitHub 커밋 (잔디)

**Write Once, Publish Everywhere.**

## 핵심 기능 (구현됨)

- Notion 기반 블로그 자동 렌더링 (@tuum/refract-notion)
- 에러 핸들링 (Result 패턴, 404/500 페이지)
- 성능 최적화 (캐싱, 서버 사이드 필터링)
- 키보드 네비게이션 및 접근성

## 예정 기능

- 글 작성 시 GitHub 커밋 자동 생성
- SNS 동시 배포 (LinkedIn, X, Threads)
- 이미지 영구화 파이프라인
- Giscus/Utterances 댓글 시스템

## 문서

| 문서                               | 설명                       |
| ---------------------------------- | -------------------------- |
| [기획서](./docs/PLAN.md)           | 프로젝트 상세 기획안       |
| [아키텍처](./docs/ARCHITECTURE.md) | 디렉토리 구조 및 설계 문서 |
| [TODO](./TODO.md)                  | MVP 구현 체크리스트        |

## 기술 스택

| 항목            | 내용                    |
| --------------- | ----------------------- |
| Framework       | Next.js 16 (App Router) |
| Language        | TypeScript (strict)     |
| Styling         | Tailwind CSS v4         |
| Notion Renderer | @tuum/refract-notion    |
| Package Manager | pnpm                    |
| Deployment      | Vercel                  |

## 아키텍처 개요

```
src/
├── app/                # Next.js Pages (RSC)
├── application/        # 유스케이스, Port 인터페이스
├── domain/             # 엔티티, 비즈니스 로직
├── infrastructure/     # 외부 시스템 연동 (Notion)
├── components/         # React 컴포넌트
└── lib/                # 유틸리티 함수
```

자세한 내용은 [아키텍처 문서](./docs/ARCHITECTURE.md)를 참조하세요.

## 에러 핸들링

Result 패턴을 사용하여 404와 500 에러를 명확히 구분합니다:

```typescript
const result = await postRepository.findById(id);

if (!result.success) {
  if (result.error.code === ErrorCode.NOT_FOUND) {
    notFound(); // 404 페이지
  }
  throw result.error; // 500 에러 페이지
}
```

## 성능 최적화

- **메타데이터 캐싱**: 태그/시리즈 데이터 5분 캐시 (`unstable_cache`)
- **서버 사이드 필터링**: Notion API 레벨에서 필터링
- **ISR**: 1분/1시간 단위 증분 정적 재생성

## 접근성

- **키보드 네비게이션**: Tab, Arrow, Home/End, ESC 지원
- **ARIA 속성**: `aria-current`, `aria-expanded`, `aria-controls`
- **Focus 스타일**: `focus-visible:ring-2` 적용
- **목표**: Lighthouse 접근성 95+

## 빠른 시작

### 필수 조건

- Node.js v24.11.1
- pnpm

### 설치 및 실행

1. 의존성 설치

   ```bash
   pnpm install
   ```

2. 환경변수 설정

   ```bash
   cp .env.example .env.local
   # .env.local 파일에 Notion API 키 등 입력
   ```

3. 개발 서버 실행
   ```bash
   pnpm dev
   ```
   http://localhost:36001

## 사용 가능한 스크립트

| 명령어       | 설명                           |
| ------------ | ------------------------------ |
| `pnpm dev`   | 개발 서버 (포트 36001)         |
| `pnpm build` | 프로덕션 빌드                  |
| `pnpm check` | lint + typecheck + format 검증 |
| `pnpm test`  | Vitest 테스트 실행             |

## 라이선스

MIT License

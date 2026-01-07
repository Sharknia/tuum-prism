# tuum-prism

> **"Turn your Tuum(틈) into a Prism"**

## Prism의 의미

하나의 빛이 프리즘을 통과하면 여러 갈래 빛이 되듯,  
**한 번의 Notion 작성으로 여러 채널에 동시 배포**합니다.

- Notion → 블로그
- Notion → LinkedIn, X, Threads
- Notion → GitHub 커밋 (잔디)

**Write Once, Publish Everywhere.**

## 핵심 기능

- Notion 기반 블로그 자동 렌더링 (react-notion-x)
- 글 작성 시 GitHub 커밋 자동 생성
- SNS 동시 배포 (LinkedIn, X, Threads)
- 이미지 영구화 파이프라인
- Giscus/Utterances 댓글 시스템

## 문서

| 문서                     | 설명                 |
| ------------------------ | -------------------- |
| [기획서](./docs/PLAN.md) | 프로젝트 상세 기획안 |
| [TODO](./TODO.md)        | MVP 구현 체크리스트  |

## 기술 스택

| 항목            | 내용                    |
| --------------- | ----------------------- |
| Framework       | Next.js 16 (App Router) |
| Language        | TypeScript (strict)     |
| Styling         | Tailwind CSS v4         |
| Package Manager | pnpm                    |
| Deployment      | Vercel                  |

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

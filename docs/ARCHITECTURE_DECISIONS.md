# Tuum Prism 아키텍처

> **"Write Once, Publish Everywhere"**  
> 한 번의 Notion 작성으로 블로그와 SNS에 동시 배포

---

## 개요

Tuum Prism은 **Notion을 CMS로 사용**하여 개인 블로그와 SNS 자동 포스팅을 지원하는 오픈소스 프로젝트입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                         NOTION                              │
│                    (콘텐츠 작성)                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                        VERCEL                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  블로그 (Next.js ISR)                                │    │
│  │  • Notion API → 블로그 렌더링                        │    │
│  │  • 모든 API 키 관리 (Notion, SNS)                    │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API 엔드포인트                                      │    │
│  │  • POST /api/sns/publish                            │    │
│  │  • 내부에서 Notion + SNS 처리                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │ HTTP 호출 (API Key 인증)
                          │
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Cron 워커 (1시간마다)                               │    │
│  │  • Vercel API 엔드포인트 호출만 함                    │    │
│  │  • Notion/SNS 키 알 필요 없음                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 핵심 설계 원칙

### 🔐 키 관리 단일화

```
❌ 기존 (중복 저장):
├── Vercel Env: NOTION_API_KEY, X_API_KEY, ...
└── GitHub Secrets: NOTION_API_KEY, X_API_KEY, ... (중복!)

✅ 개선 (단일 저장):
├── Vercel Env: 모든 API 키 (Notion, SNS)
└── GitHub Secrets: TUUM_API_KEY, TUUM_API_URL (접근용만)
```

**장점:**
- 키 관리 포인트 단일화
- GitHub Actions는 Vercel API만 호출
- 보안 강화: 외부에 Notion/SNS 키 노출 안 함

---

## Why: 이 아키텍처를 선택한 이유

### 1. Vercel 단독 블로그 (GitHub Actions 배포 X)

| 고려사항 | 결정 |
|---------|------|
| **배포 트리거** | Vercel GitHub Integration (push → 자동 배포) |
| **콘텐츠 갱신** | ISR (Incremental Static Regeneration) |
| **GitHub Actions 배포?** | ❌ 불필요 |

**이유:**
- Vercel은 GitHub 레포 연결 시 **자동 배포** 지원
- ISR로 **사용자 방문 시 자동 갱신** → 별도 배포 불필요
- GitHub Actions로 Vercel 배포하는 건 불필요한 복잡도 추가

---

### 2. SNS 포스팅에 GitHub Actions Cron 사용

| 옵션 | 장점 | 단점 | 선택 |
|------|------|------|:----:|
| **Vercel Cron** | 설정 간단 | Hobby 플랜 2개 제한, 1시간 오차 | ❌ |
| **GitHub Actions** | 무제한, 2000분/월 | Fork 필요 | ✅ |
| **3rd Party (Make/Zapier)** | 실시간 가능 | 무료 제한, 별도 가입 필요 | ❌ |

**이유:**
- Vercel Hobby 플랜은 **Cron 2개 제한** + **정시 실행 보장 안 됨**
- GitHub Actions는 **무료 2000분/월** (15분마다 실행해도 충분)
- 원터치 설치 스크립트로 **자동화 가능**

---

### 3. GitHub Actions → Vercel API 호출 방식

```
❌ 기존 (직접 호출):
GitHub Actions → Notion API (직접)
                → SNS API (직접)
문제: 모든 키를 GitHub Secrets에 중복 저장 필요

✅ 개선 (위임 방식):
GitHub Actions → Vercel API (/api/sns/publish)
                       ↓
                 Vercel 내부에서 Notion + SNS 처리
장점: GitHub Secrets에는 API Key 하나만 저장
```

---

### 4. Fork 방식 채택 (Template Repository X)

| 옵션 | 오픈소스 지표 | GitHub Actions 작동 | 선택 |
|------|:------------:|:------------------:|:----:|
| **Fork** | ✅ Fork 수 카운트 | ✅ 사용자 레포에서 실행 | ✅ |
| **Template** | ❌ 카운트 안 됨 | ✅ | ❌ |
| **Clone** | ❌ | ⚠️ 별도 설정 필요 | ❌ |

**이유:**
- 오픈소스 배포자로서 **Fork 수, Network Graph** 등 지표 확보
- 사용자의 GitHub Actions가 **사용자 레포에서** 실행되어야 함
- 사용자가 기여(PR)하기 쉬움

---

## How: 시스템 동작 방식

### 블로그 콘텐츠 흐름

```
1. 사용자 블로그 방문
       ↓
2. Vercel Edge Network에서 캐시 확인
       ↓ (캐시 만료 시)
3. Next.js ISR → Notion API 호출
       ↓
4. 새 콘텐츠 렌더링 + 캐시 갱신
       ↓
5. 사용자에게 응답
```

**ISR 설정:**
```typescript
// apps/blog/src/app/blog/[id]/page.tsx
export const revalidate = 3600; // 1시간마다 갱신
```

---

### SNS 자동 포스팅 흐름

```
1. GitHub Actions Cron (매시간 실행)
       ↓
2. Vercel API 호출: POST /api/sns/publish
   Authorization: Bearer ${TUUM_API_KEY}
       ↓
3. Vercel 내부:
   ├── Notion API → 새 글 확인
   ├── 마지막 포스팅 ID와 비교
   └── 새 글 있으면 → SNS API 호출
       ↓
4. 결과 반환 → GitHub Actions 로그
```

**GitHub Actions 워크플로우:**
```yaml
# .github/workflows/sns-post.yml
name: SNS Auto Post

on:
  schedule:
    - cron: '0 * * * *'  # 매시간 정각
  workflow_dispatch:      # 수동 실행도 가능

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger SNS Publish
        run: |
          curl -X POST "${{ secrets.TUUM_API_URL }}/api/sns/publish" \
            -H "Authorization: Bearer ${{ secrets.TUUM_API_KEY }}" \
            -H "Content-Type: application/json"
```

---

## 원터치 설치 흐름

### 자동화 가능한 항목

| 항목 | 자동화 | 방법 |
|------|:------:|------|
| `TUUM_API_KEY` | ✅ 자동 생성 | `crypto.randomUUID()` |
| `TUUM_API_URL` | ✅ 자동 캡처 | `vercel deploy` 출력 |
| Notion API Key | ❌ 수동 | 사용자 입력 |
| SNS 토큰들 | ❌ 수동 | 사용자 입력 |
| 사이트 설정 | ⚠️ 반자동 | 대화형 프롬프트 |

### 설치 단계

```
┌─────────────────────────────────────────┐
│  1. 사전 조건 확인                       │
│     - Node.js 18+, pnpm, git            │
│     - GitHub CLI (gh), Vercel CLI       │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  2. GitHub 로그인 + Fork                │
│     - gh auth login                     │
│     - gh repo fork sharknia/tuum-prism  │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  3. Vercel 로그인 + 프로젝트 연결        │
│     - vercel login                      │
│     - vercel link                       │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  4. Notion 설정 (사용자 입력)            │
│     - Integration 생성 가이드           │
│     - API Key, Database ID 입력         │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  5. SNS 설정 (선택, 사용자 입력)         │
│     - X, LinkedIn, Threads 토큰         │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  6. 사이트 설정 (대화형 프롬프트)        │
│     - 블로그 제목, 닉네임, 소셜 링크     │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  7. 초기 배포 + API Key 생성             │
│     - vercel deploy --prod              │
│     - TUUM_API_KEY = crypto.randomUUID()│
│     - 배포 URL 캡처                      │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  8. 환경변수 & Secrets 자동 설정         │
│     - vercel env add TUUM_API_KEY       │
│     - gh secret set TUUM_API_KEY        │
│     - gh secret set TUUM_API_URL        │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  9. 완료!                               │
│     🌐 블로그: https://xxx.vercel.app   │
│     🤖 SNS Cron: 자동 활성화            │
└─────────────────────────────────────────┘
```

---

## 환경변수 전체 목록

### Vercel 환경변수 (블로그 + API)

| 변수 | 필수 | 설명 | 입력 방식 |
|------|:----:|------|----------|
| `NOTION_API_KEY` | ✅ | Notion Integration 토큰 | 사용자 입력 |
| `NOTION_DATABASE_ID` | ✅ | 블로그 데이터베이스 ID | 사용자 입력 |
| `TUUM_API_KEY` | ✅ | API 인증용 키 | **자동 생성** |
| `X_API_KEY` | ❌ | X 포스팅 | 사용자 입력 |
| `X_API_SECRET` | ❌ | X 포스팅 | 사용자 입력 |
| `LINKEDIN_ACCESS_TOKEN` | ❌ | LinkedIn 포스팅 | 사용자 입력 |
| `THREADS_ACCESS_TOKEN` | ❌ | Threads 포스팅 | 사용자 입력 |
| `NEXT_PUBLIC_SITE_TITLE` | ❌ | 블로그 제목 | 사용자 입력 |
| `NEXT_PUBLIC_OWNER_NAME` | ❌ | 프로필 닉네임 | 사용자 입력 |
| `BLOB_READ_WRITE_TOKEN` | ❌ | 이미지 영구화 | Vercel 자동 |

### GitHub Secrets (Cron 워커)

| Secret | 필수 | 설명 | 입력 방식 |
|--------|:----:|------|----------|
| `TUUM_API_KEY` | ✅ | Vercel API 인증 | **자동 설정** |
| `TUUM_API_URL` | ✅ | 배포된 Vercel URL | **자동 설정** |

> 💡 **핵심:** GitHub Secrets에 Notion/SNS 키 저장 불필요!

---

## 무료 티어 제한 분석

### Vercel Hobby (무료)

| 리소스 | 제한 | 블로그 사용량 | 여유 |
|--------|------|-------------|:----:|
| Edge Requests | 100만/월 | ~수천 | ✅ |
| Function Invocations | 100만/월 | ~수천 | ✅ |
| Bandwidth | 100GB/월 | ~수GB | ✅ |
| **Cron Jobs** | **2개** | - | ❌ 사용 안 함 |

### GitHub Actions (무료)

| 리소스 | 제한 | SNS Cron 사용량 | 여유 |
|--------|------|---------------|:----:|
| 실행 시간 | 2000분/월 | ~45분 (매시간 1분 가정) | ✅ |
| 동시 실행 | 20개 | 1개 | ✅ |
| 스토리지 | 500MB | ~0 | ✅ |

---

## 대안 비교 및 기각 이유

### ❌ GitHub Actions에서 직접 Notion/SNS 호출

```
문제점:
- 모든 API 키를 GitHub Secrets에 중복 저장
- 키 관리 포인트가 분산됨
- 보안 표면 증가
```

### ❌ Vercel Cron만 사용

```
문제점:
- Hobby 플랜 2개 제한
- 정시 실행 보장 안 됨 (1시간 오차)
- SNS 포스팅에 부적합
```

### ❌ Template Repository

```
문제점:
- Fork 수 카운트 안 됨
- 오픈소스 지표 손실
- 기여(PR) 흐름 단절
```

---

## 결론

Tuum Prism 아키텍처는 다음 원칙을 따릅니다:

1. **키 관리 단일화**: 모든 API 키는 Vercel에만 저장
2. **무료 우선**: Vercel Hobby + GitHub Actions 무료 티어 활용
3. **자동화**: 원터치 설치 스크립트로 API Key/URL 자동 생성
4. **오픈소스 친화**: Fork 방식으로 커뮤니티 참여 유도

> **"Write Once, Publish Everywhere"**  
> Notion에 글 하나 쓰면, 블로그와 SNS에 자동으로 배포됩니다.

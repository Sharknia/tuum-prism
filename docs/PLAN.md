# tuum-prism 프로젝트 기획서
## 1. 개요 (Overview)
| 항목 | 내용 |
|------|------|
| 프로젝트명 | tuum-prism |
| 레포지토리명 | tuum-prism |
| 슬로건 | "Turn your Tuum(틈) into a Prism — 그리고 매일, 잔디가 자랍니다." |
| 라이선스 | MIT License (무료 오픈소스) |
### 슬로건 의미
- **Prism**: 하나의 빛이 프리즘을 통과하면 여러 갈래 빛이 되듯, 한 번의 작성으로 여러 채널에 동시 배포
- **잔디**: Notion에 글을 쓰면 GitHub 커밋이 발생하여 Contribution Graph가 채워짐
### 핵심 가치
> **"Write Once, Publish Everywhere."**  
> Notion 작성만으로 블로그, SNS, GitHub 잔디까지 — 퍼스널 브랜딩 자동화
---
## 2. 왜 tuum-prism인가? (Why This Project)
### 2.1 문제 정의
개발자가 꾸준히 학습 기록(TIL)을 남기고 퍼스널 브랜딩을 하려면:
1. 기술 블로그 운영
2. SNS(LinkedIn, X 등)에 공유
3. GitHub 활동 유지
이 세 가지를 **각각 관리하는 것은 번거롭고 지속하기 어려움**.
### 2.2 기존 솔루션의 한계
| 구분 | 유료 SaaS (Super, Oopy 등) | tuum-prism |
|------|---------------------------|------------|
| 비용 | 월 $10~16 / ₩9,900~ | **무료** |
| 소유권 | 플랫폼 의존 | **내 GitHub, 내 도메인** |
| SNS 자동 연동 | ❌ | ✅ |
| GitHub 커밋 연동 | ❌ | ✅ |
| 커스터마이징 | 제한적 | **완전한 자유** |
### 2.3 tuum-prism의 차별점
1. **완전 무료**: 오픈소스로 제공, 호스팅 비용만 발생 (Vercel 무료 티어 가능)
2. **완전한 소유권**: 사용자의 GitHub 레포에서 직접 운영
3. **글 = 커밋**: Notion에 글을 쓰면 자동으로 GitHub 커밋 발생 → 잔디 채움
4. **원스톱 배포**: 블로그 + SNS(LinkedIn, X, Threads) 동시 배포
---
## 3. 타겟 사용자 (Target Persona)
### Primary Persona
> **"월 구독료 없이 기술 블로그를 운영하고 싶고, 초기 설정을 직접 할 수 있는 기술 역량을 갖춘 한국 개발자"**
### 특성
- Notion을 학습 기록/메모 용도로 이미 사용 중
- 자신만의 도메인으로 기술 블로그를 갖고 싶음
- GitHub 잔디(Contribution Graph)에 관심이 있음
- 유료 서비스 대신 직접 셋업하는 것을 선호
- CLI/환경변수 설정에 거부감이 없음
### 지역
- 한국 개발자 커뮤니티 우선 타겟
---
## 4. 개발 범위 (Scope)
### 4.1 MVP (Minimum Viable Product)
#### 콘텐츠 소스
- **Notion 연동**: Notion API를 통한 데이터베이스 조회
- 특정 태그(예: `Ready`)가 설정된 페이지만 배포 대상으로 선정
- 배포 완료 시 상태 자동 업데이트 (예: `Published`)
- 배포 결과(SNS URL 등) Notion 속성에 Write-back
#### 블로그 (Next.js)
- `react-notion-x` 등을 활용한 Notion → React 렌더링
- Vercel 배포 + ISR (Incremental Static Regeneration)
- 커스텀 도메인 지원
#### 댓글 시스템
- **Giscus** (GitHub Discussions 기반) 또는 **Utterances** (GitHub Issues 기반) 선택 가능
- 별도 DB 없이 환경변수 설정만으로 작동
#### SNS 자동 업로드
| 채널 | 방식 |
|------|------|
| LinkedIn | `w_member_social` 권한, 이미지 Asset 등록 프로세스 |
| X (Twitter) | API v2 Free Tier, Rate Limit 예외 처리 |
| Threads | 공식 API, 이미지 컨테이너 생성 |
#### 이미지 영구화 파이프라인
- **문제**: Notion API 이미지 URL은 약 1시간 후 만료
- **해결**: 외부 스토리지(Vercel Blob 또는 Cloudinary)로 이관 후 영구 URL 사용
#### 자동화
- GitHub Actions 기반 Cron 실행 (`0 * * * *`)
- GitHub Web UI에서 수동 트리거 가능 (`workflow_dispatch`)
### 4.2 MVP 제외 (Roadmap)
- LLM 기반 요약/톤앤매너 변환
- 채널 확장 (Dev.to, Medium, velog 등)
- 배포 현황 대시보드
---
## 5. 설정 및 Onboarding
### 5.1 설정 방식
- **별도 웹 UI 없음**: `.env` 또는 호스팅 플랫폼(Vercel, GitHub Secrets)에서 직접 설정
- **문서 기반**: README.md에 상세 가이드 제공
### 5.2 필수 vs 선택 설정
| 설정 | 필수 여부 | 활성화되는 기능 |
|------|----------|----------------|
| Notion API Key | **필수** | 블로그 |
| Vercel 계정 | **필수** | 블로그 호스팅 |
| LinkedIn API | 선택 | LinkedIn 배포 |
| X API | 선택 | X 배포 |
| Threads API | 선택 | Threads 배포 |
| 이미지 스토리지 | 선택 | 이미지 영구화 |
> **핵심**: Notion + Vercel만으로 블로그는 완전히 작동. SNS 연동은 점진적으로 추가 가능.
---
## 6. 시스템 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub Actions                        │
│                     (Cron / Manual Trigger)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Notion    │───▶│  tuum-prism     │───▶│     Vercel      │
│  Database   │    │  (Processing)   │    │   (Next.js)     │
└─────────────┘    └─────────────────┘    └─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ LinkedIn │   │    X     │   │ Threads  │
        └──────────┘   └──────────┘   └──────────┘
```
### 인프라 구성
| 역할 | 서비스 |
|------|--------|
| Web | Vercel (Next.js) |
| Automation | GitHub Actions |
| Storage | Vercel Blob / Cloudinary |
| Database | Notion (별도 User DB 없음) |
### 레포지토리 구조
- **Monorepo**: Next.js 프론트엔드 + 자동화 스크립트 (Python/Node.js)
---
## 7. 성공 지표 (Success Metrics)
| 지표 | 측정 방법 |
|------|----------|
| GitHub Stars | 레포지토리 Stars 수 |
| Fork/Clone 수 | GitHub Insights |
| 실사용자 수 | (추후) 익명 Telemetry 또는 커뮤니티 피드백 |
---
## 8. 라이선스 및 고지사항
### 라이선스
**MIT License** — 누구나 수정 및 재배포 가능
### 면책 조항
- 본 프로젝트는 각 플랫폼의 공개 API를 사용하며, 플랫폼 정책 변경에 따른 기능 작동을 보장하지 않음
- API 사용으로 인한 계정 제재 등 사용자 불이익에 대해 제작자는 책임지지 않음
- 사용자는 각 플랫폼의 이용 약관(ToS)을 준수할 의무가 있음
---
## 부록: 경쟁 환경 요약
tuum-prism은 유료 SaaS와 **다른 카테고리**에 위치합니다.
| 유형 | 대상 | 가치 제안 |
|------|------|----------|
| 유료 SaaS | 편의성 우선 사용자 | "설정 없이 바로 시작" |
| **tuum-prism** | 소유권/자유도 우선 개발자 | "무료로, 내 것으로, 한 번에 전부" |

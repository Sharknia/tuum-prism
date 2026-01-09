# Tuum Prism

> **"Turn your Tuum(틈) into a Prism"**

Notion에 작성된 원본 데이터(틈새의 빛)를 프리즘처럼 굴절시켜 블로그, SNS 등 다양한 세상으로 확산시키는 모노레포 프로젝트입니다.

## 📦 모노레포 구조

| 패키지 | 경로 | 설명 |
|--------|------|------|
| [**@tuum/blog**](./apps/blog) | [`apps/blog`](./apps/blog) | Next.js 16 기반의 기술 블로그 애플리케이션 |
| [**@tuum/refract-notion**](./packages/refract-notion) | [`packages/refract-notion`](./packages/refract-notion) | 공식 SDK 기반 자체 Notion 렌더링 라이브러리 |

## 💡 기술적 의사결정

### Q1. 왜 `react-notion-x`를 사용하지 않았나요?

`react-notion-x`는 훌륭한 라이브러리지만, Notion의 **비공개 API**를 사용한다는 점이 장기적인 운영에 리스크가 될 수 있다고 판단했습니다.

우리는 **안정성**과 **표준 준수**를 최우선으로 생각하여 다음과 같은 결정 내렸습니다:
1.  **공식 SDK Only**: **`@notionhq/client`** 만을 사용하여 Notion API 변경에 유연하게 대처하고 안정성을 보장합니다.
2.  **RSC 최적화**: Next.js App Router의 Server Components 환경에 최적화된 가벼운 구조를 설계했습니다.
3.  **Headless**: 스타일링 제어권을 사용자에게 완전히 위임하여 Tailwind CSS 등과 완벽하게 결합할 수 있습니다.

### Q2. 왜 Turborepo(Monorepo)를 도입했나요?

단순히 블로그를 만드는 것을 넘어, **`@tuum/refract-notion`을 독립적인 오픈소스 라이브러리로 발전시키기 위함**입니다.

- **Dogfooding**: 실제 프로덕트인 `@tuum/blog`에서 라이브러리를 직접 사용하며 기능을 검증하고 개선합니다.
- **Scalability**: 추후 npm 배포를 통해 누구나 안정적인 Notion 렌더러를 사용할 수 있도록 확장성을 고려하여 설계했습니다.

## 🚀 시작하기

이 프로젝트는 `pnpm`과 `turborepo`를 사용합니다.

### 설치

```bash
pnpm install
```

### 환경변수 설정

`apps/blog` 디렉토리에 `.env.local` 파일을 생성해야 합니다.

```bash
cp apps/blog/.env.example apps/blog/.env.local
# Notion API Key 및 Database ID 입력
```

### ⚙️ 설정 (Configuration)

이 프로젝트는 `apps/blog/src/config/site.config.ts` 파일을 통해 블로그의 핵심 정보를 중앙에서 관리합니다.
코드를 수정하지 않고도 설정 파일만으로 나만의 블로그를 완성할 수 있습니다.

#### 블로그 및 프로필 설정

`site.config.ts` 파일을 열어 다음 항목들을 수정하세요:

```typescript
// apps/blog/src/config/site.config.ts
export const siteConfig = {
  blog: {
    // 블로그 제목 (상단 네비게이션, 브라우저 탭, SEO 제목에 사용됨)
    title: 'Tuum Prism', 
  },
  owner: {
    // 작성자 이름 (메인 프로필, 게시글 하단 서명에 표시됨)
    name: 'Furychick',
    
    // 프로필 설명 및 SEO 메타 설명 (화면과 검색엔진 모두에 사용됨)
    description: 'Frontend Developer loves efficient workflows.',
    
    // 프로필 이미지 경로 (public 폴더 기준)
    avatar: '/images/default-profile.svg', 
    
    // (선택) 소셜 링크 설정
    social: {
      github: 'https://github.com/furychick', // GitHub 프로필 링크
      email: 'furychick@example.com', // 이메일 주소
      linkedin: 'https://linkedin.com/in/furychick', // LinkedIn 프로필 링크
      x: 'https://x.com/furychick', // X (Twitter) 프로필 링크
      threads: '', // Threads 프로필 링크
    },
  },
};
```

#### 이미지 변경

1. `apps/blog/public/images/` 폴더에 원하는 프로필 이미지(jpg, png, svg 등)를 넣으세요.
2. `site.config.ts`의 `owner.avatar` 경로를 변경한 파일명으로 수정하세요.


### 개발 서버 실행

```bash
pnpm dev
```

- 블로그: http://localhost:36001

## 📄 라이선스

MIT License

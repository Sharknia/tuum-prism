# Refract Notion

**Refract Notion**은 Notion 공식 SDK(`@notionhq/client`)를 기반으로 한 안정적이고 강력한 React 렌더링 라이브러리입니다.  
외부 의존성을 최소화하고 Next.js Server Components(RSC)에 최적화되어 있습니다.

## 특징

- **Official SDK Only**: 비공개 API를 사용하지 않아 안정적입니다.
- **Config Injection**: 환경변수(`NOTION_API_KEY`)를 라이브러리 내부가 아닌 외부에서 주입받아 유연합니다.
- **Recursion**: 페이지 내부의 중첩된 블록까지 자동으로 조회하여 트리 구조로 반환합니다.
- **Headless**: 스타일 없이 시맨틱 HTML 구조만 렌더링합니다. 스타일링은 사용자가 자유롭게 적용합니다.

## 설치

```bash
pnpm add @tuum/refract-notion @notionhq/client
```

## 기본 사용법

### 1. 데이터 조회

```typescript
import { Client } from '@notionhq/client';
import { getBlocks } from '@tuum/refract-notion';

// Notion Client 생성 (환경변수는 앱에서 관리)
const client = new Client({ auth: process.env.NOTION_API_KEY });

// 블록 데이터 조회 (재귀적으로 하위 블록 포함)
const blocks = await getBlocks(client, 'your-page-id');
```

### 2. 렌더링

```tsx
import { BlockRenderer } from '@tuum/refract-notion';

export default function PostPage({ blocks }) {
  return <BlockRenderer blocks={blocks} />;
}
```

> **Note**: 라이브러리는 CSS를 포함하지 않습니다. 스타일링은 아래 가이드를 참고하세요.

## 지원 블록

| 카테고리 | 블록 |
|----------|------|
| **Typography** | Paragraph, Heading 1-3, Quote, Bulleted List, Numbered List |
| **Media** | Image, Divider, Callout, Bookmark |
| **Advanced** | Code Block, Toggle, Table |

## 스타일링 가이드

### Headless 원칙

이 라이브러리는 **Headless**입니다. 스타일 없이 시맨틱 HTML과 클래스명만 렌더링됩니다.

- 모든 블록에 `notion-block` 클래스가 적용됩니다.
- 각 블록 타입별로 `notion-{type}` 클래스가 적용됩니다. (예: `notion-h1`, `notion-paragraph`)
- 색상은 `notion-color-{color}`, `notion-bg-{color}` 클래스로 적용됩니다.

### 참고용 CSS

GitHub 레포지토리의 `examples/demo.css`를 참고하여 스타일을 작성하세요.

```bash
# 레포지토리에서 참고용 CSS 확인
git clone https://github.com/your-org/refract-notion
cat examples/demo.css
```

## 커스터마이징

### Code Block: Syntax Highlighting

라이브러리는 `<pre><code class="language-{lang}">` 구조만 렌더링합니다.  
Syntax Highlighting은 PrismJS, Shiki 등을 직접 적용하세요.

```tsx
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { useEffect } from 'react';

export default function PostPage({ blocks }) {
  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return <BlockRenderer blocks={blocks} />;
}
```

### Image: 커스텀 렌더러

`next/image`를 사용하려면 커스텀 렌더러를 주입하세요.

```tsx
import Image from 'next/image';
import { ImageBlock, ImageProps } from '@tuum/refract-notion';

function CustomImage({ src, alt, caption }: ImageProps) {
  return (
    <figure>
      <Image src={src} alt={alt} width={800} height={600} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// 사용 시 (BlockRenderer에서 커스텀 컴포넌트 지원 예정)
```

## 라이선스

MIT

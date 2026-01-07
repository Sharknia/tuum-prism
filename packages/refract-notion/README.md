# Refract Notion

**Refract Notion**은 Notion 공식 SDK(`@notionhq/client`)를 기반으로 한 안정적이고 강력한 React 렌더링 라이브러리입니다.
외부 의존성을 최소화하고 Next.js Server Components(RSC)에 최적화되어 있습니다.

## 특징

- **Official SDK Only**: 비공개 API를 사용하지 않아 안정적입니다.
- **Config Injection**: 환경변수(`NOTION_API_KEY`)를 라이브러리 내부가 아닌 외부에서 주입받아 유연합니다.
- **Recursion**: 페이지 내부의 중첩된 블록까지 자동으로 조회하여 트리 구조로 반환합니다.

## 설치

```bash
pnpm add @tuum/refract-notion @notionhq/client
```

## 사용법 (Data Fetching)

```typescript
import { Client } from '@notionhq/client';
import { getBlocks } from '@tuum/refract-notion';

// 1. Notion Client 생성 (환경변수는 앱에서 관리)
const client = new Client({ auth: process.env.NOTION_API_KEY });

// 2. 블록 데이터 조회 (재귀적으로 하위 블록 포함)
const blocks = await getBlocks(client, 'your-page-id');

console.log(blocks);
```

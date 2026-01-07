# Refract Notion 라이브러리 설계 명세서

## 1. 설계 원칙 (Design Principles)
- **Direct Component Mapping**: Notion 데이터를 중간 객체(AST) 변환 없이 React 컴포넌트 Props로 직접 전달하여 오버헤드를 최소화합니다.
- **RSC Optimized**: Next.js Server Components 환경에 최적화된 가벼운 구조를 지향합니다.
- **Inversion of Control**: 이미지 렌더러나 스타일링을 사용자가 제어할 수 있도록 설계합니다.

---

## 2. 지원 범위 (Scope)

### Phase 1: MVP (핵심 기능 + 확장)
블로그 및 문서화에 필요한 필수 기능을 모두 포함합니다.

#### 기본 요소
- **Typography**: Paragraph, Heading (1, 2, 3), Quote
- **List**: Bulleted List, Numbered List (Grouping 필수)
- **Decoration**: Divider, Callout (아이콘 지원)
- **Media**: Image (기본 `<img>` 태그 사용, 커스텀 렌더러 주입 가능)
- **Rich Text**: Bold, Italic, Strikethrough, Underline, Code (Inline), Link, Color, Mention(User/Date/Page)

#### 확장 요소 (MVP 포함)
- **Code Block**: Syntax Highlighting (PrismJS 등 연동)
- **Structure**: Toggle (Details), Bookmark (OpenGraph 처리 필요)
- **Table**: Basic Table (Notion API의 Table Row/Cell 처리)

### Phase 2: Future (Out of MVP)
- Equation (Katex)
- Column List (Layout)
- Embed (Youtube, Maps)
- Synced Block

---

## 3. 아키텍처 및 구현 전략 (Architecture)

### A. 데이터 변환 (Direct Mapping)
Notion API의 JSON 응답을 그대로 Props로 받아 렌더링합니다.
- **Flow**: `NotionBlock[]` → `BlockRenderer(props)` → `<Component>`
- 타입스크립트 인터페이스(`NotionBlock`)가 스키마 역할을 수행합니다.

### B. 들여쓰기 및 구조화 (Indentation & Structuring)

#### 1. Recursive Rendering with Depth
Notion의 논리적 종속(Nesting)을 시각화하기 위해 재귀 렌더링 시 **Depth 정보**를 전달합니다.
- **구현**: `BlockRenderer`는 자식 렌더링 시 `depth={currentDepth + 1}`을 넘겨줍니다.
- **활용**: 각 컴포넌트는 `depth`에 따라 indentation(`padding-left`)이나 가이드라인을 그립니다.

#### 2. List Grouping (Preprocessor)
연속된 리스트 아이템을 시맨틱한 HTML(`<ul>`, `<ol>`)로 변환하기 위해 렌더링 전 전처리를 수행합니다.
- **Input**: `[ListItem, ListItem, Paragraph, ListItem]`
- **Process**: 연속된 `ListItem`을 `ListGroup` 가상 블록으로 묶음.
- **Output**: `[ListGroup(Item, Item), Paragraph, ListGroup(Item)]`

### C. Notion 고유 기능 처리
1. **Color & Background**: Tailwind CSS 유틸리티 클래스로 매핑 (`orange` → `text-orange-500` / `bg-orange-100`).
2. **Callout**: 전용 컴포넌트 구현 (Icon + Color + Children).
3. **Caption**: `<figure>` 및 `<figcaption>` 태그 활용.

---

## 4. 주요 의사결정 (Key Decisions)

1. **이미지 처리**:
   - 기본적으로 표준 `<img>` 태그를 사용합니다.
   - 사용자가 `next/image`를 원할 경우 `ImageComponent` prop을 통해 커스텀 렌더러를 주입할 수 있습니다.
   - 이미지 영구화(Notion URL 만료 대응)는 라이브러리 책임이 아니며, 앱 레벨에서 처리합니다.
2. **스타일링**:
   - **Headless 기반**: 기본적으로는 스타일이 없는 HTML 구조만 렌더링합니다.
   - **Default Theme**: 사용 편의성을 위해 '기본 테마 CSS'를 별도로 제공하여, import 한 줄로 스타일을 적용할 수 있게 합니다.
3. **Callout**: 아이콘(Emoji/External/File) + 배경색 + Children 지원.
4. **Bookmark**: MVP에서는 URL 링크만 표시. OpenGraph 메타데이터는 앱에서 처리.
5. **Code Block**: Headless 원칙 적용. `<pre><code class="language-{lang}">` 구조만 렌더링. Syntax Highlighting은 사용자가 PrismJS/Shiki 등 선택.
6. **Toggle**: 네이티브 HTML5 `<details>` / `<summary>` 사용. JavaScript 없이 동작.
7. **Table**: `has_column_header`, `has_row_header` 플래그에 따라 `<thead>` / `<th>` 자동 적용.

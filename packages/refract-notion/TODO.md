# Refract Notion: Development Roadmap

## Phase 1: MVP (핵심 + 확장)

### Core Infrastructure
- [x] ColorMapper - Notion Color → Semantic Class (`notion-color-orange`)
- [x] RichText 컴포넌트 - 어노테이션(Bold, Italic, Code, Underline, Strikethrough), 링크, 색상 처리
- [x] BlockRenderer - 재귀 렌더링 및 `depth` prop 지원
- [x] List Grouping - 연속 리스트 아이템을 `<ul>`/`<ol>`로 그룹화하는 전처리 로직
- [x] Default Styles - `styles.css` 기본 테마 제공

### Typography Blocks
- [x] Paragraph
- [x] Heading 1
- [x] Heading 2
- [x] Heading 3
- [x] Quote
- [x] Bulleted List Item
- [x] Numbered List Item
- [ ] Divider - `<hr>` 태그

### Media & Decoration
- [ ] Image - 기본 `<img>` + 커스텀 렌더러 주입 지원
- [ ] Callout - 아이콘 + 배경색 + Children
- [ ] Bookmark - OpenGraph 메타 정보 처리 (Optional)

### Advanced Blocks
- [ ] Code Block - Syntax Highlighting (PrismJS 등 연동)
- [ ] Toggle - `<details>` / `<summary>` 활용
- [ ] Table - Notion API의 Table Row/Cell 처리

### Rich Text Extensions
- [ ] Mention - `@User`, `@Date`, `[[Page Link]]` 렌더링

---

## Phase 2: Future (Out of MVP)

- [ ] Equation - Katex 연동
- [ ] Column List - 다단 레이아웃 (CSS Grid/Flex)
- [ ] Embed - Youtube, Maps 등 Iframe 처리
- [ ] Synced Block - 원본/사본 블록 처리

---

## Optional / Nice-to-Have

- [ ] Dark Mode 스타일 보강
- [ ] Anchor Link ID 생성 (Heading에서 자동 ID 추출)
- [ ] 커스텀 컴포넌트 주입 API 설계 (Image, Link 등 사용자 오버라이드)

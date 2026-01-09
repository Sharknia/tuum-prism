# 접근성 가이드

> **대상**: `apps/blog` 개발자  
> **목표**: Lighthouse 접근성 점수 95+

---

## 키보드 네비게이션

### 지원 키

| 키            | 동작               | 컴포넌트                      |
| ------------- | ------------------ | ----------------------------- |
| `Tab`         | 포커스 이동        | 전체                          |
| `Shift + Tab` | 역방향 포커스 이동 | 전체                          |
| `Enter`       | 선택/활성화        | 버튼, 링크                    |
| `Escape`      | 닫기               | 모바일 목차, 검색창, 드롭다운 |
| `↑` `↓`       | 항목 이동          | 목차 (데스크탑)               |
| `Home`        | 첫 항목으로        | 목차 (데스크탑)               |
| `End`         | 마지막 항목으로    | 목차 (데스크탑)               |

### 구현 예시

```typescript
// ESC 키 핸들링
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen]);
```

```typescript
// 방향키 네비게이션
const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      document.getElementById(`toc-item-${index + 1}`)?.focus();
      break;
    case 'ArrowUp':
      e.preventDefault();
      document.getElementById(`toc-item-${index - 1}`)?.focus();
      break;
  }
};
```

---

## ARIA 속성

### 필수 속성

| 속성            | 용도                 | 예시                          |
| --------------- | -------------------- | ----------------------------- |
| `aria-label`    | 스크린 리더용 레이블 | `aria-label="검색"`           |
| `aria-expanded` | 열림/닫힘 상태       | `aria-expanded={isOpen}`      |
| `aria-current`  | 현재 위치 표시       | `aria-current="location"`     |
| `aria-controls` | 제어 대상 연결       | `aria-controls={dropdownId}`  |
| `aria-hidden`   | 스크린 리더에서 숨김 | `aria-hidden="true"` (아이콘) |

### 구현 예시

```tsx
<button
  aria-expanded={isOpen}
  aria-controls={mobileNavId}
  aria-label={isOpen ? '목차 닫기' : '목차 열기'}
>
  목차
</button>;

{
  isOpen && (
    <nav id={mobileNavId} aria-label="목차">
      {/* 내용 */}
    </nav>
  );
}
```

---

## Focus 스타일

### 권장 스타일

```css
.focus-visible:ring-2
.focus-visible:ring-(--accent)
.focus-visible:ring-offset-2
```

### 구현 예시

```tsx
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)">
  클릭
</button>
```

### focus vs focus-visible

| 속성             | 활성화 시점                    |
| ---------------- | ------------------------------ |
| `:focus`         | 모든 포커스 (마우스 클릭 포함) |
| `:focus-visible` | 키보드 포커스만                |

**권장**: `focus-visible`을 사용하여 키보드 사용자에게만 포커스 링 표시

---

## 테스트

### Lighthouse 접근성 점수 확인

1. 개발 서버 실행: `pnpm dev`
2. Chrome DevTools → Lighthouse
3. **Accessibility** 카테고리 선택
4. **목표**: 95점 이상

### 수동 테스트 체크리스트

- [ ] Tab 키로 모든 인터랙티브 요소 접근 가능
- [ ] ESC 키로 모달/드롭다운 닫힘
- [ ] 포커스 링이 명확히 표시됨
- [ ] 스크린 리더에서 적절한 레이블 읽힘

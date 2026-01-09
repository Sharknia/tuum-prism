'use client';

import type { TocItem } from '@/lib/toc-extractor';
import { useEffect, useId, useRef, useState } from 'react';

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // 고유 ID 생성 (ARIA 연결용)
  const mobileNavId = useId();

  // 현재 화면에 보이는(교차된) 요소들을 추적하기 위한 Map
  const intersectingElements = useRef<Map<string, boolean>>(new Map());

  // Intersection Observer로 활성 섹션 추적
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 1. 교차 상태 업데이트
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            intersectingElements.current.set(entry.target.id, true);
          } else {
            intersectingElements.current.delete(entry.target.id);
          }
        });

        // 2. 목차 순서(items)대로 확인하여 가장 먼저 보이는 요소를 Active로 설정
        // 이를 통해 여러 섹션이 동시에 활성화 영역에 있을 때 가장 상단(먼저 나오는) 섹션을 우선시함
        for (const item of items) {
          if (intersectingElements.current.has(item.id)) {
            setActiveId(item.id);
            break;
          }
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    // 모든 heading 요소 관찰
    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [items]);

  // ESC 키로 모바일 목차 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 방향키 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex: number | null = null;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        targetIndex = Math.min(index + 1, items.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        targetIndex = Math.max(index - 1, 0);
        break;
      case 'Home':
        e.preventDefault();
        targetIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        targetIndex = items.length - 1;
        break;
    }

    if (targetIndex !== null) {
      document.getElementById(`toc-item-${targetIndex}`)?.focus();
    }
  };

  if (items.length === 0) {
    return null;
  }

  // 버튼 스타일 함수
  const getButtonClassName = (isActive: boolean) =>
    `relative text-left w-full py-1 pl-3 rounded-r
    before:absolute before:left-0 before:top-0 before:h-full before:w-0.5
    before:rounded-full before:transition-colors
    transition-colors
    focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2
    ${
      isActive
        ? 'text-(--accent) font-medium before:bg-(--accent) before:w-1'
        : 'text-(--muted) hover:text-(--foreground) before:bg-transparent hover:before:bg-(--border)'
    }`.trim();

  return (
    <>
      {/* Desktop: 고정 사이드바 */}
      <aside className="hidden lg:block w-64 shrink-0">
        <nav aria-label="목차">
          <h3
            id="toc-heading"
            className="text-xs font-semibold text-(--muted) uppercase tracking-widest mb-4 pb-2 border-b border-(--border)"
          >
            목차
          </h3>
          <ul
            className="space-y-0.5 text-sm max-h-[calc(100vh-10rem)] overflow-y-auto pr-2"
            aria-labelledby="toc-heading"
          >
            {items.map((item, index) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
              >
                <button
                  id={`toc-item-${index}`}
                  onClick={() => handleClick(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-current={activeId === item.id ? 'location' : undefined}
                  className={getButtonClassName(activeId === item.id)}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile: 접히는 목차 */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-(--surface) text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          aria-expanded={isOpen}
          aria-controls={mobileNavId}
          aria-label={isOpen ? '목차 닫기' : '목차 열기'}
        >
          <span>목차</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {isOpen && (
          <nav
            id={mobileNavId}
            className="mt-2 p-4 rounded-lg bg-(--surface) border border-(--border)"
            aria-label="목차"
          >
            <ul className="space-y-0.5 text-sm max-h-[50vh] overflow-y-auto">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                >
                  <button
                    id={`mobile-toc-item-${index}`}
                    onClick={() => handleClick(item.id)}
                    aria-current={activeId === item.id ? 'location' : undefined}
                    className={getButtonClassName(activeId === item.id)}
                  >
                    {item.text}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}

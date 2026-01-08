'use client';

import type { TocItem } from '@/lib/toc-extractor';
import { useEffect, useId, useState } from 'react';

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // 고유 ID 생성 (ARIA 연결용)
  const mobileNavId = useId();

  // Intersection Observer로 활성 섹션 추적
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
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
      setIsOpen(false);
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
    `text-left w-full py-1 rounded transition-colors 
    focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2
    ${isActive ? 'text-(--accent) font-medium' : 'text-(--muted) hover:text-(--foreground)'}`.trim();

  return (
    <>
      {/* Desktop: 고정 사이드바 */}
      <aside className="hidden lg:block w-64 shrink-0">
        <nav className="sticky top-20" aria-label="목차">
          <h3
            id="toc-heading"
            className="text-sm font-semibold text-(--muted) uppercase tracking-wider mb-4"
          >
            목차
          </h3>
          <ul className="space-y-2 text-sm" aria-labelledby="toc-heading">
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
          <span>📑 목차</span>
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
            <ul className="space-y-2 text-sm">
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

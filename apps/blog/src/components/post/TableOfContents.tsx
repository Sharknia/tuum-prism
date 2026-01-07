'use client';

import type { TocItem } from '@/lib/toc-extractor';
import { useEffect, useState } from 'react';

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

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

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop: 고정 사이드바 */}
      <aside className="hidden lg:block w-64 shrink-0">
        <nav className="sticky top-20">
          <h3 className="text-sm font-semibold text-(--muted) uppercase tracking-wider mb-4">
            목차
          </h3>
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
              >
                <button
                  onClick={() => handleClick(item.id)}
                  className={`text-left w-full py-1 transition-colors ${
                    activeId === item.id
                      ? 'text-(--accent) font-medium'
                      : 'text-(--muted) hover:text-(--foreground)'
                  }`}
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
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-(--surface) text-sm font-medium"
          aria-expanded={isOpen}
        >
          <span>📑 목차</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {isOpen && (
          <nav className="mt-2 p-4 rounded-lg bg-(--surface) border border-(--border)">
            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{ paddingLeft: `${(item.level - 1) * 0.75}rem` }}
                >
                  <button
                    onClick={() => handleClick(item.id)}
                    className={`text-left w-full py-1 transition-colors ${
                      activeId === item.id
                        ? 'text-(--accent) font-medium'
                        : 'text-(--muted) hover:text-(--foreground)'
                    }`}
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

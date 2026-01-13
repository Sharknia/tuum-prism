'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface TagSidebarProps {
  tags: { name: string; count: number }[];
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

interface UserOverride {
  expanded: boolean;
  forTag: string | null;
}

export function TagSidebar({ tags }: TagSidebarProps) {
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag');

  const VISIBLE_COUNT = 24;
  const COLLAPSE_THRESHOLD = 28;

  const [userOverride, setUserOverride] = useState<UserOverride | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const shouldShowToggle = tags.length > COLLAPSE_THRESHOLD;
  const remainingCount = tags.length - VISIBLE_COUNT;

  const selectedTagIsHidden = useMemo(() => {
    if (!selectedTag || !shouldShowToggle) return false;
    const selectedIndex = tags.findIndex((t) => t.name === selectedTag);
    return selectedIndex >= VISIBLE_COUNT;
  }, [selectedTag, tags, shouldShowToggle, VISIBLE_COUNT]);

  const isExpanded = useMemo(() => {
    if (userOverride && userOverride.forTag === selectedTag) {
      return userOverride.expanded;
    }
    return selectedTagIsHidden;
  }, [userOverride, selectedTag, selectedTagIsHidden]);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setUserOverride({ expanded: newExpanded, forTag: selectedTag });

    if (!newExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const getTagHref = (tagName: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedTag === tagName) {
      params.delete('tag');
    } else {
      params.set('tag', tagName);
    }
    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  if (tags.length === 0) return null;

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-24 flex flex-col">
        <h3 className="text-sm font-semibold text-(--muted) uppercase tracking-wider mb-4 shrink-0">
          TAGS
        </h3>

        <div className="relative flex flex-col">
          <div
            ref={scrollRef}
            className={cn(
              'transition-[max-height] duration-300 ease-in-out',
              isExpanded
                ? 'max-h-[calc(100vh-14rem)] overflow-y-auto scrollbar-thin'
                : 'max-h-[320px] overflow-hidden'
            )}
            style={{
              transitionTimingFunction: isExpanded
                ? 'cubic-bezier(0, 0, 0.2, 1)'
                : 'cubic-bezier(0.4, 0, 1, 1)',
              transitionDuration: isExpanded ? '250ms' : '200ms',
            }}
          >
            <ul
              id="tag-list"
              className="flex flex-wrap gap-2 pb-1"
              role="list"
              aria-label="태그 목록"
            >
              {tags.map(({ name, count }) => {
                const isSelected = selectedTag === name;
                return (
                  <li key={name}>
                    <Link
                      href={getTagHref(name)}
                      className={cn(
                        'flex items-center px-2.5 py-1 rounded-md text-xs border transition-all active:scale-95',
                        isSelected
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)] font-medium'
                          : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]'
                      )}
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      <span>#{name}</span>
                      <span className="ml-1.5 opacity-60">({count})</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-16 pointer-events-none transition-opacity duration-200',
              'bg-gradient-to-b from-transparent to-[var(--background)]',
              'backdrop-blur-[2px]',
              !shouldShowToggle || isExpanded ? 'opacity-0' : 'opacity-100'
            )}
            aria-hidden="true"
          />
        </div>

        {shouldShowToggle && (
          <div
            className={cn(
              'flex justify-center mt-2 transition-all duration-300',
              !isExpanded && '-mt-8 relative z-10'
            )}
          >
            <button
              onClick={handleToggle}
              aria-expanded={isExpanded}
              aria-controls="tag-list"
              className={cn(
                'group flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'text-xs font-medium text-(--muted) transition-colors',
                'hover:text-(--foreground) hover:bg-[var(--surface)]',
                'min-h-[44px] min-w-[44px] justify-center'
              )}
            >
              <span>
                {isExpanded ? '접기' : `+${remainingCount}개 더 보기`}
              </span>
              <ChevronDownIcon
                className={cn(
                  'w-4 h-4 transition-transform duration-300',
                  isExpanded ? 'rotate-180' : 'rotate-0'
                )}
              />
            </button>
          </div>
        )}

        {selectedTag && (
          <Link
            href="/"
            className="mt-4 self-start text-xs text-(--muted) hover:text-(--accent) transition-colors active:scale-95"
          >
            필터 초기화
          </Link>
        )}
      </div>
    </aside>
  );
}

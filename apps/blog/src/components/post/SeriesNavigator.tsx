'use client';

import type { Post } from '@/domain/post';
import Link from 'next/link';
import { useId, useState } from 'react';

interface SeriesNavigatorProps {
  seriesName: string;
  posts: Post[];
  currentPostId: string;
}

export function SeriesNavigator({
  seriesName,
  posts,
  currentPostId,
}: SeriesNavigatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const mobileNavId = useId();
  const desktopNavId = useId();

  // 현재 포스트의 인덱스 찾기 (1-based)
  const currentIndex = posts.findIndex((p) => p.id === currentPostId) + 1;
  const totalCount = posts.length;

  if (posts.length === 0) {
    return null;
  }

  // 항목 스타일 - className과 style 분리해서 반환
  const getItemClassName = (isActive: boolean) =>
    `relative text-left w-full leading-snug py-1 pl-3 rounded-r
    before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-0.5
    before:rounded-full before:transition-colors
    transition-colors
    ${isActive ? 'font-medium before:bg-(--accent) before:w-1' : 'before:bg-transparent hover:before:bg-(--border)'}`.trim();

  // 색상은 style로 직접 적용 (globals.css의 a 태그 스타일 덮어쓰기)
  const getItemStyle = (isActive: boolean): React.CSSProperties => ({
    color: isActive ? 'var(--accent)' : 'var(--muted)',
  });

  // 호버 시 색상 변경을 위한 핸들러
  const handleMouseEnter = (
    e: React.MouseEvent<HTMLAnchorElement>,
    isActive: boolean
  ) => {
    if (!isActive) {
      e.currentTarget.style.color = 'var(--foreground)';
    }
  };

  const handleMouseLeave = (
    e: React.MouseEvent<HTMLAnchorElement>,
    isActive: boolean
  ) => {
    if (!isActive) {
      e.currentTarget.style.color = 'var(--muted)';
    }
  };

  return (
    <>
      {/* Desktop: 고정 사이드바 */}
      <div className="hidden lg:block mb-6">
        <nav aria-label="시리즈 목록">
          {/* 헤더 - 클릭하여 접기/펼치기 */}
          <button
            onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
            className="flex items-center justify-between w-full font-header text-xs font-semibold text-(--muted) uppercase tracking-widest mb-4 pb-2 border-b border-(--border) hover:text-(--foreground) transition-colors"
            aria-expanded={!isDesktopCollapsed}
            aria-controls={desktopNavId}
          >
            <span>Series</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-3 h-3 transition-transform ${isDesktopCollapsed ? '' : 'rotate-180'}`}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>

          {!isDesktopCollapsed && (
            <>
              {/* 시리즈 제목 + 진행률 */}
              <div className="mb-3">
                <Link
                  href={`/?series=${encodeURIComponent(seriesName)}`}
                  className="group inline-flex items-baseline gap-2 text-sm transition-colors hover:text-(--accent)"
                  style={{ color: 'var(--muted)' }}
                >
                  <span className="font-medium group-hover:underline underline-offset-2">
                    {seriesName}
                  </span>
                  <span className="text-xs font-mono">
                    {currentIndex}/{totalCount}
                  </span>
                </Link>
              </div>

              {/* 챕터 목록 */}
              <ul
                id={desktopNavId}
                className="text-sm max-h-[calc(100vh-20rem)] overflow-y-auto pr-2"
                aria-label="챕터 목록"
              >
                {posts.map((post, index) => {
                  const isActive = post.id === currentPostId;
                  return (
                    <li key={post.id}>
                      <Link
                        href={`/blog/${post.id}`}
                        aria-current={isActive ? 'page' : undefined}
                        className={getItemClassName(isActive)}
                        style={getItemStyle(isActive)}
                        onMouseEnter={(e) => handleMouseEnter(e, isActive)}
                        onMouseLeave={(e) => handleMouseLeave(e, isActive)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="font-mono text-xs w-5 text-right shrink-0 opacity-60">
                            {(index + 1).toString().padStart(2, '0')}
                          </span>
                          <span className="line-clamp-1">{post.title}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>
      </div>

      {/* Mobile: 접히는 시리즈 네비게이터 - TOC와 동일한 구조 */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-lg bg-(--surface) text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          aria-expanded={isOpen}
          aria-controls={mobileNavId}
          aria-label={isOpen ? '시리즈 목록 닫기' : '시리즈 목록 열기'}
        >
          <span className="font-header">Series</span>
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
            aria-label="시리즈 목록"
          >
            {/* 시리즈 제목 + 진행률 */}
            <div className="mb-3 pb-2 border-b border-(--border)">
              <Link
                href={`/?series=${encodeURIComponent(seriesName)}`}
                className="group inline-flex items-baseline gap-2 text-sm transition-colors hover:text-(--accent)"
                style={{ color: 'var(--muted)' }}
              >
                <span className="font-medium group-hover:underline underline-offset-2">
                  {seriesName}
                </span>
                <span className="text-xs font-mono">
                  {currentIndex}/{totalCount}
                </span>
              </Link>
            </div>

            {/* 챕터 목록 */}
            <ul className="text-sm max-h-[50vh] overflow-y-auto">
              {posts.map((post, index) => {
                const isActive = post.id === currentPostId;
                return (
                  <li key={post.id}>
                    <Link
                      href={`/blog/${post.id}`}
                      aria-current={isActive ? 'page' : undefined}
                      className={getItemClassName(isActive)}
                      style={getItemStyle(isActive)}
                      onMouseEnter={(e) => handleMouseEnter(e, isActive)}
                      onMouseLeave={(e) => handleMouseLeave(e, isActive)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono text-xs w-5 text-right shrink-0 opacity-60">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                        <span className="line-clamp-1">{post.title}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </>
  );
}

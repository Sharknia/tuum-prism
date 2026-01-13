'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface TagSidebarProps {
  tags: { name: string; count: number }[];
}

export function TagSidebar({ tags }: TagSidebarProps) {
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag');

  /**
   * 태그 링크 URL 생성
   * 이미 선택된 태그면 해제, 아니면 선택
   */
  const getTagHref = (tagName: string): string => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedTag === tagName) {
      // 이미 선택된 태그 → 해제
      params.delete('tag');
    } else {
      params.set('tag', tagName);
    }

    const queryString = params.toString();
    return queryString ? `/?${queryString}` : '/';
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20">
        <h3 className="text-sm font-semibold text-(--muted) uppercase tracking-wider mb-4">
          TAGS
        </h3>
        <ul className="flex flex-wrap gap-2">
          {tags.map(({ name, count }) => (
            <li key={name}>
              <Link
                href={getTagHref(name)}
                className={`flex items-center px-2.5 py-1 rounded-md text-xs border transition-all active:scale-95 ${
                  selectedTag === name
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)] font-medium'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]'
                }`}
              >
                <span>#{name}</span>
                <span className="ml-1.5 opacity-60">({count})</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* 필터 초기화 버튼 */}
        {selectedTag && (
          <Link
            href="/"
            className="mt-4 inline-block text-xs text-(--muted) hover:text-(--accent) transition-colors active:scale-95"
          >
            필터 초기화
          </Link>
        )}
      </div>
    </aside>
  );
}

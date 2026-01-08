'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface TagSidebarProps {
  tags: { name: string; count: number }[];
}

export function TagSidebar({ tags }: TagSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTag = searchParams.get('tag');

  const handleTagClick = (tagName: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedTag === tagName) {
      // 이미 선택된 태그 클릭 시 해제
      params.delete('tag');
    } else {
      params.set('tag', tagName);
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
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
              <button
                onClick={() => handleTagClick(name)}
                className={`flex items-center px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  selectedTag === name
                    ? 'bg-(--accent) text-white border-transparent font-medium'
                    : 'bg-(--surface) border-(--border) text-(--muted) hover:text-(--foreground) hover:border-(--accent)'
                }`}
              >
                <span>#{name}</span>
                <span className="ml-1.5 opacity-60">({count})</span>
              </button>
            </li>
          ))}
        </ul>

        {/* 필터 초기화 버튼 */}
        {selectedTag && (
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-xs text-(--muted) hover:text-(--accent) transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>
    </aside>
  );
}

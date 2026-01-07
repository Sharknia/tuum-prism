'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isOpen, setIsOpen] = useState(false);

  // URL에서 검색어 동기화 (URL 변경 시 상태 업데이트 - 유효한 패턴)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // 디바운스된 검색
  const debouncedSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set('q', value.trim());
      } else {
        params.delete('q');
      }

      const queryString = params.toString();
      router.push(queryString ? `/?${queryString}` : '/');
    },
    [router, searchParams]
  );

  // 디바운스 타이머
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      debouncedSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isOpen, debouncedSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    debouncedSearch(query);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-(--surface) transition-colors"
        aria-label="검색"
        title="검색"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색..."
        autoFocus
        className="w-32 sm:w-48 px-3 py-1.5 rounded-lg bg-(--surface) border border-(--border) text-sm focus:outline-none focus:ring-2 focus:ring-(--accent) focus:border-transparent"
      />
      <button
        type="button"
        onClick={() => {
          setIsOpen(false);
          if (query) {
            setQuery('');
            debouncedSearch('');
          }
        }}
        className="p-2 rounded-lg hover:bg-(--surface) transition-colors"
        aria-label="검색 닫기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </form>
  );
}

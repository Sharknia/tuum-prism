'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [isOpen, setIsOpen] = useState(false);

  // 버튼 ref (포커스 관리용)
  const buttonRef = useRef<HTMLButtonElement>(null);

  // URL에서 검색어 동기화 (URL 변경 시 상태 업데이트)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  // 검색 실행 (URL 변경)
  const executeSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set('q', value.trim());
    } else {
      params.delete('q');
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  // ESC 키로 검색창 닫기
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      // ESC로 닫을 때는 검색어 초기화 및 검색 취소 (선택 사항, 여기서는 검색어만 비움)
      if (query) {
        setQuery('');
        // NOTE: 닫을 때 검색 결과도 초기화하려면 아래 주석 해제
        // executeSearch('');
      }
      buttonRef.current?.focus();
    }
  };

  // 닫기 핸들러
  const handleClose = () => {
    setIsOpen(false);
    // 닫을 때 검색어 초기화는 하지 않음 (사용자가 다시 열었을 때 유지)
    // 혹은 기획에 따라 초기화 가능. 여기서는 유지하는 편이 나을 수 있음.
    // 하지만 기존 로직이 닫을 때 초기화였으므로 유지.
    if (query) {
      setQuery('');
      executeSearch('');
    }
    buttonRef.current?.focus();
  };

  if (!isOpen) {
    return (
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-(--surface) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
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
          aria-hidden="true"
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
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
      role="search"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="검색..."
        autoFocus
        className="w-32 sm:w-48 px-3 py-1.5 rounded-lg bg-(--surface) border border-(--border) text-sm focus:outline-none focus:ring-2 focus:ring-(--accent) focus:border-transparent [&::-webkit-search-cancel-button]:hidden"
        aria-label="검색어 입력"
      />
      <button
        type="button"
        onClick={handleClose}
        className="p-2 rounded-lg hover:bg-(--surface) transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        aria-label="검색 닫기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
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

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

interface SeriesDropdownProps {
  series: { name: string; count: number }[];
}

export function SeriesDropdown({ series }: SeriesDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSeries = searchParams.get('series');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 고유 ID 생성 (ARIA 연결용)
  const dropdownId = useId();

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ESC 키로 드롭다운 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSeriesClick = (seriesName: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (seriesName === null || selectedSeries === seriesName) {
      params.delete('series');
    } else {
      params.set('series', seriesName);
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : '/');
    setIsOpen(false);
  };

  if (series.length === 0) {
    return null;
  }

  const currentSeriesName = series.find((s) => s.name === selectedSeries)?.name;

  return (
    <div ref={dropdownRef} className="relative hidden sm:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-(--surface) transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        aria-label={
          currentSeriesName ? `시리즈: ${currentSeriesName}` : '시리즈 선택'
        }
      >
        <span>{currentSeriesName || '시리즈'}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        <div
          id={dropdownId}
          className="absolute right-0 mt-2 w-56 rounded-lg bg-(--surface) border border-(--border) shadow-lg z-50"
        >
          <ul className="py-1" role="listbox" aria-label="시리즈 목록">
            {/* 전체 보기 옵션 */}
            <li>
              <button
                onClick={() => handleSeriesClick(null)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  !selectedSeries
                    ? 'bg-(--accent) text-white'
                    : 'hover:bg-(--background)'
                }`}
                role="option"
                aria-selected={!selectedSeries}
              >
                전체 보기
              </button>
            </li>

            <li className="border-t border-(--border) my-1" />

            {/* 시리즈 목록 */}
            {series.map(({ name, count }) => (
              <li key={name}>
                <button
                  onClick={() => handleSeriesClick(name)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selectedSeries === name
                      ? 'bg-(--accent) text-white'
                      : 'hover:bg-(--background)'
                  }`}
                  role="option"
                  aria-selected={selectedSeries === name}
                >
                  <span>{name}</span>
                  <span className="ml-2 text-xs opacity-60">({count})</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

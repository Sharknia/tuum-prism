// import { SearchBar, SeriesDropdown } from '@/components/filter';
import { SearchBar } from '@/components/filter';
import Link from 'next/link';
import { Suspense } from 'react';
import { ThemeToggle } from './ThemeToggle';

// interface HeaderProps {
//   series?: { name: string; count: number }[];
// }

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-(--border) bg-(--background)/80 backdrop-blur-sm font-header">
      <div className="container-blog flex h-14 items-center justify-between">
        {/* Logo / Home */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg transition-colors"
        >
          <span className="font-[family-name:var(--font-source-code-pro)] text-foreground text-xl">
            Tuum Prism
          </span>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Search */}
          <Suspense fallback={<div className="w-5 h-5" />}>
            <SearchBar />
          </Suspense>

          {/* Series Link */}
          <Link
            href="/series"
            className="p-2 md:px-3 md:py-1.5 rounded-lg hover:bg-(--surface) transition-colors"
            aria-label="시리즈"
            title="시리즈"
          >
            {/* Mobile: Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 md:hidden"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
            {/* Desktop: Text */}
            <span className="hidden md:inline font-[family-name:var(--font-source-code-pro)] text-sm font-medium">
              Series
            </span>
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

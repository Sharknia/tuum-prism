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
    <header className="sticky top-0 z-50 w-full border-b border-(--border) bg-(--background)/80 backdrop-blur-sm">
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
        <div className="flex items-center gap-2">
          {/* Series Link */}
          <Link
            href="/series"
            className="px-3 py-1.5 rounded-lg hover:bg-(--surface) transition-colors text-sm font-medium"
          >
            Series
          </Link>

          {/* Search */}
          <Suspense fallback={<div className="w-5 h-5" />}>
            <SearchBar />
          </Suspense>

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

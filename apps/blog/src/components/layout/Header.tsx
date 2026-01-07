import { SearchBar, SeriesDropdown } from '@/components/filter';
import Link from 'next/link';
import { Suspense } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  series?: { name: string; count: number }[];
}

export function Header({ series = [] }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-(--border) bg-(--background)/80 backdrop-blur-sm">
      <div className="container-blog flex h-14 items-center justify-between">
        {/* Logo / Home */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg hover:text-(--accent) transition-colors"
        >
          <span className="text-xl">◈</span>
          <span>Tuum Prism</span>
        </Link>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Suspense fallback={<div className="w-5 h-5" />}>
            <SearchBar />
          </Suspense>

          {/* Series dropdown */}
          {series.length > 0 && (
            <Suspense fallback={<div className="w-20 h-8" />}>
              <SeriesDropdown series={series} />
            </Suspense>
          )}

          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

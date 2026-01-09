'use client';

import { SeriesStats } from '@/application/post';
import Link from 'next/link';

interface SeriesCardProps {
  series: SeriesStats;
}

export function SeriesCard({ series }: SeriesCardProps) {
  return (
    <article className="group relative grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6 p-6 rounded-2xl bg-(--card-bg) border border-(--border) hover:border-(--accent) transition-all overflow-hidden">
      {/* 장식용 Spine (책등) 효과 - Compact에 맞춰 높이 조정 */}
      <div className="absolute left-0 top-6 bottom-6 w-1 bg-(--border) rounded-r-md opacity-50 group-hover:bg-(--accent) group-hover:opacity-100 transition-all" />

      {/* 왼쪽: 메타 정보 */}
      <div className="flex flex-col gap-3 pl-4 border-b md:border-b-0 md:border-r border-(--border)/50 md:pr-6 pb-4 md:pb-0">
        <div className="flex items-center gap-2 text-xs text-(--muted) font-medium tracking-wide uppercase">
          <span className="bg-(--background) px-2 py-0.5 rounded border border-(--border)">
            Series
          </span>
          <span>•</span>
          <span>Updated {series.lastUpdated.toLocaleDateString()}</span>
        </div>

        <Link href={`/series/${encodeURIComponent(series.name)}`} className="block no-underline" style={{ color: 'var(--foreground)' }}>
          <h2 className="text-xl md:text-2xl font-[family-name:var(--font-source-code-pro)] font-bold tracking-tight">
            {series.name}
          </h2>
        </Link>

        <div className="mt-auto pt-2 text-sm text-(--muted)">
          총 <span className="text-foreground font-bold">{series.count}</span>개의 챕터
        </div>
      </div>

      {/* 오른쪽: 챕터 미리보기 (Compact List) */}
      <div className="flex flex-col pl-4 md:pl-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-(--muted) uppercase tracking-wider">
            CHAPTER PREVIEW
          </span>
          <Link
            href={`/series/${encodeURIComponent(series.name)}`}
            className="text-xs font-bold hover:text-(--accent) flex items-center gap-1 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            전체보기
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <ul className="flex flex-col gap-2">
          {series.previewPosts.slice(0, 3).map((post, index) => ( // 3개까지만 노출
            <li key={post.id} className="group/item">
              <Link
                href={`/blog/${post.id}`}
                className="flex items-baseline gap-3 text-sm hover:text-foreground transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                <span className="font-mono text-xs w-5 text-right" style={{ color: 'var(--muted)' }}>
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span className="flex-1 line-clamp-1 border-b border-dashed border-transparent group-hover/item:border-(--border)">
                  {post.title}
                </span>
              </Link>
            </li>
          ))}
          {/* 더보기 표시 */}
          {series.count > 3 && (
            <li className="flex items-baseline gap-3 text-xs mt-1" style={{ color: 'var(--muted)' }}>
              <span className="font-mono w-5 text-right opacity-50">+</span>
              <span>{series.count - 3} more chapters...</span>
            </li>
          )}
        </ul>
      </div>
    </article>
  );
}

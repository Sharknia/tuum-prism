import { Post } from '@/domain/post';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PostNavigatorProps {
  prevPost: Post | null;
  nextPost: Post | null;
}

export function PostNavigator({ prevPost, nextPost }: PostNavigatorProps) {
  return (
    <div className="border-t border-[var(--border)] mt-4 pt-8">
      {/* Row 1: Prev/Next Navigation */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 w-full">
        {/* Previous Post */}
        <div className="w-full min-w-0">
          {prevPost ? (
            <Link
              href={`/blog/${prevPost.id}`}
              className="group flex flex-col justify-center h-full p-3 md:p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--card-bg)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-[var(--muted)] font-medium mb-1 md:mb-2 group-hover:text-[var(--accent)] transition-colors">
                <ChevronLeftIcon className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                <span>이전</span>
              </div>
              <div className="font-semibold text-sm md:text-base text-[var(--foreground)] truncate w-full group-hover:text-[var(--accent)] transition-colors">
                {prevPost.title}
              </div>
            </Link>
          ) : (
            // Empty placeholder to maintain grid layout
            <div aria-hidden="true" />
          )}
        </div>

        {/* Next Post */}
        <div className="w-full min-w-0">
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.id}`}
              className="group flex flex-col justify-center items-end h-full p-3 md:p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--card-bg)] hover:border-[var(--accent)] transition-all duration-200 shadow-sm hover:shadow-md text-right active:scale-[0.98]"
            >
              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-[var(--muted)] font-medium mb-1 md:mb-2 group-hover:text-[var(--accent)] transition-colors">
                <span>다음</span>
                <ChevronRightIcon className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </div>
              <div className="font-semibold text-sm md:text-base text-[var(--foreground)] truncate w-full group-hover:text-[var(--accent)] transition-colors">
                {nextPost.title}
              </div>
            </Link>
          ) : (
            <div aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

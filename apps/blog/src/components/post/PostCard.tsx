import type { Post } from '@/domain/post';
import Link from 'next/link';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className="block group p-6 rounded-xl border border-(--border) hover:border-(--accent) hover:shadow-md transition-all bg-(--card-bg) shadow-sm active:scale-[0.98] active:shadow-sm"
    >
      <article className="flex flex-col gap-1">
        {/* 헤더: 시리즈 및 날짜 */}
        <div className="flex items-center gap-2 text-xs text-(--muted) mb-1">
          {post.series && (
            <>
              <span className="font-bold text-(--accent) uppercase tracking-wide">
                {post.series}
              </span>
              <span>•</span>
            </>
          )}
          {post.date && (
            <time dateTime={post.date.toISOString()}>
              {post.date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
        </div>

        {/* 제목 */}
        <h3 className="text-xl font-bold transition-colors line-clamp-2 mb-1">
          {post.title}
        </h3>

        {/* 설명 */}
        {post.description && (
          <p className="text-(--muted) line-clamp-2 text-sm leading-relaxed">
            {post.description}
          </p>
        )}

        {/* 메타 정보: 태그 (전체 노출) */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md bg-(--surface) dark:bg-(--background) border border-(--border) text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}

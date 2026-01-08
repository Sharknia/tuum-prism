import type { Post } from '@/domain/post';
import Link from 'next/link';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/blog/${post.id}`}
      className="block group p-6 rounded-xl border border-(--border) hover:border-(--accent) hover:shadow-md transition-all bg-white dark:bg-(--surface) shadow-sm"
    >
      <article className="flex flex-col gap-2">
        {/* 시리즈 표시 */}
        {post.series && (
          <span className="text-xs font-medium text-(--accent) uppercase tracking-wide">
            {post.series}
          </span>
        )}

        {/* 제목 */}
        <h3 className="text-xl font-bold transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* 설명 */}
        {post.description && (
          <p className="text-(--muted) line-clamp-2 text-sm">
            {post.description}
          </p>
        )}

        {/* 메타 정보: 날짜 */}
        {post.date && (
          <div className="mt-2 text-sm text-(--muted)">
            <time dateTime={post.date.toISOString()}>
              {post.date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        )}

        {/* 메타 정보: 태그 (전체 노출) */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
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

import type { Post } from '@/domain/post';
import Link from 'next/link';

interface PostHeaderProps {
  post: Post;
  readingTime: string;
}

export function PostHeader({ post, readingTime }: PostHeaderProps) {
  return (
    <header className="mb-8 pb-8 border-b border-(--border) max-w-3xl mx-auto">
      {/* 제목 */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
        {post.title}
      </h1>

      {/* 설명 (제목과 중복되지 않을 때만 표시) */}
      {post.description && post.description !== post.title && (
        <p className="mt-4 text-lg text-(--muted) leading-relaxed">
          {post.description}
        </p>
      )}

      {/* 메타 정보 */}
      <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-(--muted)">
        {/* 날짜 */}
        {post.date && (
          <time dateTime={post.date.toISOString()}>
            {post.date.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        )}

        <span className="text-(--border)">·</span>

        {/* 읽기 시간 */}
        <span>{readingTime}</span>
      </div>

      {/* 태그 */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/?tag=${encodeURIComponent(tag)}`}
              className="px-3 py-1 rounded-md bg-(--surface) border border-(--border) text-sm text-(--muted) hover:text-(--foreground) hover:border-(--accent) transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

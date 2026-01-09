import type { Post } from '@/domain/post';
import Link from 'next/link';

interface PostHeaderProps {
  post: Post;
  readingTime: string;
}

export function PostHeader({ post, readingTime }: PostHeaderProps) {
  return (
    <header className="mb-8 pb-8 border-b border-(--border) max-w-3xl mx-auto">
      {/* 뒤로 가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-(--muted) hover:text-(--accent) transition-colors mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
          />
        </svg>
        목록으로
      </Link>

      {/* 시리즈 */}
      {post.series && (
        <Link
          href={`/?series=${encodeURIComponent(post.series)}`}
          className="inline-block mb-3 px-3 py-1 rounded-full bg-(--accent)/10 text-(--accent) text-sm font-medium hover:bg-(--accent)/20 transition-colors"
        >
          📚 {post.series}
        </Link>
      )}

      {/* 제목 */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
        {post.title}
      </h1>

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
              className="px-3 py-1 rounded-md bg-(--surface) border border-(--border) text-sm hover:bg-(--accent) hover:text-white transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* 설명 */}
      {post.description && (
        <p className="mt-6 text-lg text-(--muted) leading-relaxed">
          {post.description}
        </p>
      )}
    </header>
  );
}

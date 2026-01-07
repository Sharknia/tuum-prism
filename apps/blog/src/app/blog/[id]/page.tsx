import { PostHeader, TableOfContents } from '@/components/post';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import {
  extractTableOfContents,
  formatReadingTime,
  hasMeaningfulToc,
} from '@/lib';
import '@/styles/notion-theme.css';
import { BlockRenderer } from '@tuum/refract-notion';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

const postRepository = new NotionPostRepository();

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600; // 상세 페이지는 1시간 캐시 (본문 자주 안 바뀜)

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;

  // 포스트 데이터와 블록 병렬 조회
  const [post, blocks] = await Promise.all([
    postRepository.findById(id),
    postRepository.getPostContent(id),
  ]);

  if (!post || !blocks || blocks.length === 0) {
    notFound();
  }

  // 읽기 시간 계산
  const readingTime = formatReadingTime(blocks);

  // 목차 추출
  const tocItems = extractTableOfContents(blocks);
  const showToc = hasMeaningfulToc(blocks);

  return (
    <div className="container-blog py-8">
      <div className="flex gap-8 items-start">
        {/* 메인 콘텐츠 */}
        <article className="flex-1 min-w-0">
          {/* 포스트 헤더 */}
          <PostHeader post={post} readingTime={readingTime} />

          {/* 모바일 목차 */}
          {showToc && (
            <Suspense fallback={null}>
              <div className="lg:hidden">
                <TableOfContents items={tocItems} />
              </div>
            </Suspense>
          )}

          {/* 본문 */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <BlockRenderer blocks={blocks} />
          </div>
        </article>

        {/* 데스크탑 목차 사이드바 */}
        {showToc && (
          <Suspense fallback={null}>
            <TableOfContents items={tocItems} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

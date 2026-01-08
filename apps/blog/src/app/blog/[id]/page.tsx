import { NotionRenderer } from '@/components/notion/NotionRenderer';
import { PostHeader, TableOfContents } from '@/components/post';
import { ErrorCode } from '@/domain/errors';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import {
    extractTableOfContents,
    formatReadingTime,
    hasMeaningfulToc,
} from '@/lib';
import '@/styles/notion-theme.css';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

const postRepository = new NotionPostRepository();

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600; // 상세 페이지는 1시간 캐시 (본문 자주 안 바뀜)

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;

  // 먼저 포스트 존재 여부 확인 (Result 패턴)
  const postResult = await postRepository.findById(id);

  // 포스트가 없으면 404
  if (!postResult.success) {
    if (postResult.error.code === ErrorCode.NOT_FOUND) {
      notFound();
    }
    // 서버 에러: error.tsx에서 처리
    throw postResult.error;
  }

  const post = postResult.data;

  // 포스트가 유효한 경우에만 블록 조회
  const blocks = await postRepository.getPostContent(id);

  if (!blocks || blocks.length === 0) {
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
            <NotionRenderer blocks={blocks} />
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

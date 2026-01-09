import { NotionRenderer } from '@/components/notion/NotionRenderer';
import { PostHeader, TableOfContents } from '@/components/post';
import { Profile } from '@/components/profile/Profile';
import { ErrorCode } from '@/domain/errors';
import { createImageService } from '@/infrastructure/image';
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
const imageService = createImageService();

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 3600; // 상세 페이지는 1시간 캐시 (본문 자주 안 바뀜)

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;

  // getPost는 내부적으로 Published(Updated) 상태 체크
  const postResult = await postRepository.getPost(id);

  // 포스트가 없거나 Published 상태가 아니면 404
  if (!postResult.success) {
    if (postResult.error.code === ErrorCode.NOT_FOUND) {
      notFound();
    }
    // 서버 에러: error.tsx에서 처리
    throw postResult.error;
  }

  const post = postResult.data;

  // 포스트가 유효한 경우에만 블록 조회
  const rawBlocks = await postRepository.getPostContent(id);

  if (!rawBlocks || rawBlocks.length === 0) {
    notFound();
  }

  // 이미지 영구화 처리 (Blob 미설정 시 graceful fallback)
  const blocks = await imageService.processImages(rawBlocks, id);

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
            <div className="lg:hidden">
              <Suspense fallback={null}>
                <TableOfContents items={tocItems} />
              </Suspense>
            </div>
          )}

          {/* 본문 */}
          <div className="prose prose-lg max-w-3xl mx-auto dark:prose-invert">
            <NotionRenderer blocks={blocks} />
          </div>

          {/* 작성자 프로필 */}
          <div className="max-w-3xl mx-auto">
            <Profile variant="article-footer" />
          </div>
        </article>

        {/* 데스크탑 목차 사이드바 */}
        {showToc && (
          <div className="hidden lg:block sticky top-20 self-start">
            <Suspense fallback={null}>
              <TableOfContents items={tocItems} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  );
}

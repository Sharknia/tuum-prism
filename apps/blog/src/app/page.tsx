import { TagSidebar } from '@/components/filter';
import { InfinitePostList } from '@/components/post/InfinitePostList';
import type { Post } from '@/domain/post';
import { PostStatus } from '@/domain/post';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import { getCachedMetadata } from '@/lib';
import { Suspense } from 'react';

const postRepository = new NotionPostRepository();

export const revalidate = 60; // ISR: 1분마다 갱신

interface HomeProps {
  searchParams: Promise<{ tag?: string; series?: string; q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const { tag, series, q } = params;

  // 캐시된 메타데이터 조회 (태그/시리즈 집계)
  const metadata = await getCachedMetadata();

  // 서버 사이드 필터링: 조건에 따라 다른 쿼리 호출
  let posts: Post[] = [];
  let nextCursor: string | null = null;

  if (tag) {
    // 태그 필터링 (Notion API에서 직접 필터)
    posts = await postRepository.findByTag(PostStatus.Updated, tag);
  } else if (series) {
    // 시리즈 필터링 (Notion API에서 직접 필터)
    posts = await postRepository.findBySeries(PostStatus.Updated, series);
  } else {
    // 전체 조회 (검색 시 100개, 일반 시 20개 + 무한스크롤)
    if (q) {
        // 검색어 필터링을 위해 더 많이 조회 (기존 로직 유지)
        const result = await postRepository.findByStatus(PostStatus.Updated, 100);
        posts = result.results;
        // 검색 시 무한 스크롤 비활성화 (client filtering 때문에)
        nextCursor = null; 
    } else {
        const result = await postRepository.findByStatus(PostStatus.Updated, 20);
        posts = result.results;
        nextCursor = result.nextCursor;
    }
  }

  // 검색어 필터링 (클라이언트 사이드 - 본문 검색은 Notion API 미지원)
  if (q) {
    const query = q.toLowerCase();
    posts = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query)
    );
  }

  // 활성 필터 표시
  const activeFilters: string[] = [];
  if (tag) activeFilters.push(`#${tag}`);
  if (series) activeFilters.push(series);
  if (q) activeFilters.push(`"${q}"`);

  return (
    <div className="container-blog py-12">
      {/* 페이지 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          개발 블로그
        </h1>
        <p className="mt-2 text-(--muted)">
          Notion에서 작성한 글을 자동으로 배포합니다
        </p>

        {/* 활성 필터 표시 */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="px-3 py-1 rounded-full bg-(--accent) text-white text-sm"
              >
                {filter}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex gap-8">
        {/* 포스트 목록 */}
        <div className="flex-1 min-w-0">
          <InfinitePostList
            initialPosts={posts}
            initialCursor={nextCursor}
            emptyMessage={
              activeFilters.length > 0
                ? '해당 조건에 맞는 글이 없습니다.'
                : '작성 중인 글이 없습니다.'
            }
          />
        </div>

        {/* 태그 사이드바 (Desktop only) - 캐시된 데이터 사용 */}
        <Suspense fallback={null}>
          <TagSidebar tags={metadata.tags} />
        </Suspense>
      </div>
    </div>
  );
}

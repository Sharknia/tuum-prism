import { TagSidebar } from '@/components/filter';
import { InfinitePostList } from '@/components/post/InfinitePostList';
import { Profile } from '@/components/profile/Profile';
import type { Post } from '@/domain/post';
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

  // 서버 사이드 필터링: 통합된 findPosts 사용
  let posts: Post[] = [];
  let nextCursor: string | null = null;

  if (tag) {
    // 태그 필터링
    const result = await postRepository.findPosts({ tag });
    posts = result.results;
  } else if (series) {
    // 시리즈 필터링
    const result = await postRepository.findPosts({ series });
    posts = result.results;
  } else if (q) {
    // 검색어 필터링을 위해 더 많이 조회
    const result = await postRepository.findPosts({ limit: 100 });
    posts = result.results;
    nextCursor = null; // 검색 시 무한 스크롤 비활성화
  } else {
    // 전체 조회 (20개 + 무한스크롤)
    const result = await postRepository.findPosts({ limit: 20 });
    posts = result.results;
    nextCursor = result.nextCursor;
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
      {/* 페이지 헤더 - Profile 컴포넌트로 교체 */}
      <div className="mb-8">
        <Profile variant="main-header" />

        {/* 활성 필터 표시 */}
        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <span
                key={filter}
                className="px-3 py-1 rounded-full bg-[var(--accent)] text-white text-sm"
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
            queryKey={['posts', { tag, series, q }]}
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

import { TagSidebar } from '@/components/filter';
import { PostList } from '@/components/post';
import { PostStatus } from '@/domain/post';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import { Suspense } from 'react';

const postRepository = new NotionPostRepository();

export const revalidate = 60; // ISR: 1분마다 갱신

interface HomeProps {
  searchParams: Promise<{ tag?: string; series?: string; q?: string }>;
}

// 태그 집계 함수
function aggregateTags(
  posts: { tags: string[] }[]
): { name: string; count: number }[] {
  const tagCount = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// 시리즈 집계 함수
function aggregateSeries(
  posts: { series: string | null }[]
): { name: string; count: number }[] {
  const seriesCount = new Map<string, number>();

  for (const post of posts) {
    if (post.series) {
      seriesCount.set(post.series, (seriesCount.get(post.series) || 0) + 1);
    }
  }

  return Array.from(seriesCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const { tag, series, q } = params;

  // 모든 포스트 조회
  const allPosts = await postRepository.findByStatus(PostStatus.Writing, 100);

  // 태그 집계
  const tags = aggregateTags(allPosts);

  // 필터링
  let filteredPosts = allPosts;

  if (tag) {
    filteredPosts = filteredPosts.filter((post) => post.tags.includes(tag));
  }

  if (series) {
    filteredPosts = filteredPosts.filter((post) => post.series === series);
  }

  if (q) {
    const query = q.toLowerCase();
    filteredPosts = filteredPosts.filter(
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
    <div className="container-blog py-8">
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
          <PostList
            posts={filteredPosts}
            emptyMessage={
              activeFilters.length > 0
                ? '해당 조건에 맞는 글이 없습니다.'
                : '작성 중인 글이 없습니다.'
            }
          />
        </div>

        {/* 태그 사이드바 (Desktop only) */}
        <Suspense fallback={null}>
          <TagSidebar tags={tags} />
        </Suspense>
      </div>
    </div>
  );
}

// 시리즈 데이터를 layout에 전달하기 위한 export
export { aggregateSeries };

import { PostStatus } from '@/domain/post';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import { unstable_cache } from 'next/cache';

const postRepository = new NotionPostRepository();

interface TagCount {
  name: string;
  count: number;
}

interface SeriesCount {
  name: string;
  count: number;
}

interface BlogMetadata {
  tags: TagCount[];
  series: SeriesCount[];
}

/**
 * 태그 집계 함수
 */
function aggregateTags(posts: { tags: string[] }[]): TagCount[] {
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

/**
 * 시리즈 집계 함수
 */
function aggregateSeries(posts: { series: string | null }[]): SeriesCount[] {
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

/**
 * 블로그 메타데이터 캐싱 (5분)
 * 태그와 시리즈 집계를 캐싱하여 매 요청마다 재계산하지 않음
 */
export const getCachedMetadata = unstable_cache(
  async (): Promise<BlogMetadata> => {
    const { results: posts } = await postRepository.findByStatus(PostStatus.Updated, 100);

    // 단일 순회로 태그와 시리즈 모두 집계
    const tags = aggregateTags(posts);
    const series = aggregateSeries(posts);

    return { tags, series };
  },
  ['blog-metadata'],
  {
    revalidate: 300, // 5분 캐시
    tags: ['blog'],
  }
);

/**
 * 캐시된 시리즈 목록만 조회
 */
export const getCachedSeries = unstable_cache(
  async (): Promise<SeriesCount[]> => {
    const metadata = await getCachedMetadata();
    return metadata.series;
  },
  ['blog-series'],
  {
    revalidate: 300,
    tags: ['blog'],
  }
);

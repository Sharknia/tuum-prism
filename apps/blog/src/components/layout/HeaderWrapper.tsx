import { PostStatus } from '@/domain/post';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import { Header } from './Header';

const postRepository = new NotionPostRepository();

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

export async function HeaderWrapper() {
  // 시리즈 데이터 조회
  const posts = await postRepository.findByStatus(PostStatus.Writing, 100);
  const series = aggregateSeries(posts);

  return <Header series={series} />;
}

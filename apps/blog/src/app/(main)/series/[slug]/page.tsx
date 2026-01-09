import { PostList } from '@/components/post/PostList';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

const postRepository = new NotionPostRepository();

export const revalidate = 60;

interface SeriesDetailProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SeriesDetailProps): Promise<Metadata> {
  const { slug } = await params;
  const seriesName = decodeURIComponent(slug);

  return {
    title: `${seriesName} - Tuum Prism`,
    description: `${seriesName} 시리즈의 글 목록입니다.`,
  };
}

export default async function SeriesDetailPage({ params }: SeriesDetailProps) {
  const { slug } = await params;
  const seriesName = decodeURIComponent(slug);

  const { results: posts } = await postRepository.findPosts({
    series: seriesName,
    sortDirection: 'asc',
    limit: 100, // 시리즈 내 포스트는 충분히 많이 가져옴
  });

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="container-blog py-12">
      <div className="mb-12">
        <div className="mb-4 text-(--accent) font-medium">Series</div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          {seriesName}
        </h1>
        <p className="text-(--muted)">
          총 {posts.length}개의 글이 있습니다
        </p>
      </div>

      <PostList posts={posts} />
    </div>
  );
}

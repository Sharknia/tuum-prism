import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import type { MetadataRoute } from 'next';

const postRepository = new NotionPostRepository();

export const revalidate = 3600; // ISR: 1시간마다 갱신

/**
 * 동적 사이트맵 생성
 * Google Search Console 등록용
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tuum.tech';

  // 모든 Published 포스트의 경로 조회
  const posts = await postRepository.getAllPublishedPaths();

  return [
    // 루트 페이지
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // 블로그 포스트들
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.id}`,
      lastModified: new Date(post.lastModified),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}

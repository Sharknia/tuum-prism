import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import type { MetadataRoute } from 'next';

const postRepository = new NotionPostRepository();

export const revalidate = 3600; // ISR: 1시간마다 갱신

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tuum.tech';

  const [posts, aboutPost] = await Promise.all([
    postRepository.getAllPublishedPaths(),
    postRepository.getAboutPost(),
  ]);

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...(aboutPost
      ? [
          {
            url: `${baseUrl}/about`,
            lastModified: aboutPost.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
          },
        ]
      : []),
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.id}`,
      lastModified: new Date(post.lastModified),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}

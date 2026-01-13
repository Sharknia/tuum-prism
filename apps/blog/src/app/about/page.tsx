import { NotionRenderer } from '@/components/notion/NotionRenderer';
import { siteConfig } from '@/config/site.config';
import { createImageService } from '@/infrastructure/image';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import '@/styles/notion-theme.css';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

const postRepository = new NotionPostRepository();
const imageService = createImageService();

export const revalidate = 3600; // ISR: 1시간

export async function generateMetadata(): Promise<Metadata> {
  const post = await postRepository.getAboutPost();

  if (!post) {
    return {
      title: 'About',
      description: '',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tuum.tech';
  const aboutUrl = `${baseUrl}/about`;
  const description =
    post.description ||
    `About ${siteConfig.owner.name} - ${siteConfig.blog.title}`;

  return {
    title: `About | ${siteConfig.blog.title}`,
    description,
    authors: [{ name: siteConfig.owner.name }],
    openGraph: {
      title: `About | ${siteConfig.blog.title}`,
      description,
      type: 'profile',
      url: aboutUrl,
      siteName: siteConfig.blog.title,
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary',
      title: `About | ${siteConfig.blog.title}`,
      description,
    },
    alternates: {
      canonical: aboutUrl,
    },
  };
}

export default async function AboutPage() {
  const post = await postRepository.getAboutPost();

  if (!post) {
    notFound();
  }

  const rawBlocks = await postRepository.getPostContent(post.id);
  const blocks = await imageService.processImages(rawBlocks, post.id);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tuum.tech';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: post.title,
    description: post.description,
    mainEntity: {
      '@type': 'Person',
      name: siteConfig.owner.name,
      description: siteConfig.owner.description,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/about`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container-blog py-8">
        <article className="max-w-3xl mx-auto">
          {/* 제목 */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {post.title}
            </h1>
            {post.description && (
              <p className="text-lg text-muted-foreground">
                {post.description}
              </p>
            )}
          </header>

          {/* 본문 */}
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <NotionRenderer blocks={blocks} />
          </div>
        </article>
      </div>
    </>
  );
}

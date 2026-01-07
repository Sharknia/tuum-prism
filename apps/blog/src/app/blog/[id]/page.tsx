import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import { BlockRenderer } from '@tuum/refract-notion';
import Link from 'next/link';
import { notFound } from 'next/navigation';
// Import local Notion theme (based on examples/demo.css)
import '@/styles/notion-theme.css';

const postRepository = new NotionPostRepository();

// 페이지 파라미터 타입 정의 (Next.js 15+에서 Promise로 변경됨을 고려)
interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 60; // 1분 캐시

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;

  const blocks = await postRepository.getPostContent(id);

  if (!blocks || blocks.length === 0) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <Link
        href="/"
        className="inline-flex items-center text-gray-500 hover:text-black mb-8 text-sm transition-colors"
      >
        ← Back to List
      </Link>
      <article className="prose prose-lg max-w-none">
        <h1 className="text-2xl font-bold mb-4">Block Data Preview</h1>
        <div className="mt-8">
        <BlockRenderer blocks={blocks} />
      </div>
    </article>
    </main>
  );
}

import { PostStatus } from '@/domain/post';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import Link from 'next/link';

// Repository 인스턴스 생성 (DI 컨테이너가 있다면 주입받겠지만, 여기선 직접 생성)
const postRepository = new NotionPostRepository();

export const revalidate = 60; // 1분마다 캐시 갱신 (ISR)

export default async function Home() {
  const posts = await postRepository.findByStatus(PostStatus.Writing, 5);

  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold mb-3 tracking-tight">Tuum Prism</h1>
      <p className="text-gray-500 mb-12 text-lg">
        Notion-powered Blog & Content Engine
      </p>

      <section>
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 block animate-pulse" />
          Writing Queue
        </h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-gray-400">작성 중인 글이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="block group p-6 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
              >
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                    <span>{post.date?.toLocaleDateString()}</span>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

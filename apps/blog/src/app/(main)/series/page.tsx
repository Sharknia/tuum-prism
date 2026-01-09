import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';
import Link from 'next/link';

const postRepository = new NotionPostRepository();

export const revalidate = 3600; // 1시간마다 갱신

export default async function SeriesPage() {
  const seriesList = await postRepository.getSeriesList();

  return (
    <div className="container-blog py-12">
      <div className="mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          시리즈
        </h1>
        <p className="text-(--muted)">
          연재 중인 시리즈 목록입니다
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {seriesList.map((series) => (
          <Link
            key={series}
            href={`/series/${encodeURIComponent(series)}`}
            className="group block p-6 rounded-2xl bg-(--surface) border border-(--border) hover:border-(--accent) transition-all hover:shadow-lg"
          >
            <h2 className="text-xl font-bold mb-2 group-hover:text-(--accent) transition-colors">
              {series}
            </h2>
            <div className="flex items-center text-sm text-(--muted)">
              <span>자세히 보기</span>
              <svg
                className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {seriesList.length === 0 && (
        <div className="text-center py-20 text-(--muted)">
          등록된 시리즈가 없습니다.
        </div>
      )}
    </div>
  );
}

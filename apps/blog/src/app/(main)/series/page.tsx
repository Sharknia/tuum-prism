import { SeriesCard } from '@/components/series/SeriesCard';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';

const postRepository = new NotionPostRepository();

export const revalidate = 3600; // 1시간마다 갱신

export default async function SeriesPage() {
  const seriesStats = await postRepository.getSeriesWithStats();

  return (
    <div className="container-blog py-12">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
          Series
        </h1>
        <p className="text-(--muted)">주제별로 정리된 연재물 목록입니다</p>
      </div>

      <div className="flex flex-col gap-4">
        {seriesStats.map((series) => (
          <SeriesCard key={series.name} series={series} />
        ))}
      </div>

      {seriesStats.length === 0 && (
        <div className="text-center py-32 border border-dashed border-(--border) rounded-2xl bg-(--surface)/50">
          <p className="text-(--muted)">등록된 시리즈가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

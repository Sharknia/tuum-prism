import { getCachedSeries } from '@/lib';
import { Header } from './Header';

export async function HeaderWrapper() {
  // 캐시된 시리즈 데이터 사용
  const series = await getCachedSeries();

  return <Header series={series} />;
}

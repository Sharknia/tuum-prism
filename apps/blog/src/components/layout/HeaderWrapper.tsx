// import { getCachedSeries } from '@/lib';
import { Header } from './Header';

export async function HeaderWrapper() {
  // 캐시된 시리즈 데이터 사용 (더 이상 필요 없음)
  // const series = await getCachedSeries();

  return <Header />;
}

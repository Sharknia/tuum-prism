import { getEnv } from '@/config/env';

/**
 * Next.js Instrumentation
 * 서버 시작 시 환경변수 검증
 * 필수 환경변수가 없으면 서버 시작 실패
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      getEnv();
      console.log('[tuum-prism] 환경변수 검증 완료');
    } catch (error) {
      console.error('[tuum-prism] 환경변수 검증 실패');
      throw error;
    }
  }
}

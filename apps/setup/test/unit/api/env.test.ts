/**
 * 환경변수 API 테스트 (Test 3.2)
 *
 * TDD RED Phase: Vercel 환경변수 설정 API 테스트
 */
import { describe, expect, it } from 'bun:test';

describe('Vercel 환경변수 API', () => {
  it('환경변수를 설정할 수 있어야 함', async () => {
    const { setEnvVariables } = await import('../../../src/api/env');
    
    expect(setEnvVariables).toBeDefined();
    expect(typeof setEnvVariables).toBe('function');
  });

  it('환경변수를 조회할 수 있어야 함', async () => {
    const { getEnvVariables } = await import('../../../src/api/env');
    
    expect(getEnvVariables).toBeDefined();
    expect(typeof getEnvVariables).toBe('function');
  });
});

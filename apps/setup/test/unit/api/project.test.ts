/**
 * 프로젝트 API 테스트 (Test 3.1)
 *
 * TDD RED Phase: Vercel 프로젝트 생성 API 테스트
 */
import { describe, expect, it } from 'bun:test';

describe('Vercel 프로젝트 API', () => {
  it('프로젝트 생성 요청을 보낼 수 있어야 함', async () => {
    const { createProject } = await import('../../../src/api/project');
    
    expect(createProject).toBeDefined();
    expect(typeof createProject).toBe('function');
  });

  it('프로젝트 정보를 조회할 수 있어야 함', async () => {
    const { getProject } = await import('../../../src/api/project');
    
    expect(getProject).toBeDefined();
    expect(typeof getProject).toBe('function');
  });
});

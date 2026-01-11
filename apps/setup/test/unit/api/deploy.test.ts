/**
 * 배포 API 테스트 (Test 3.3)
 *
 * TDD RED Phase: Vercel 배포 API 테스트
 */
import { describe, expect, it } from 'bun:test';

describe('Vercel 배포 API', () => {
  it('배포를 생성할 수 있어야 함', async () => {
    const { createDeployment } = await import('../../../src/api/deploy');
    
    expect(createDeployment).toBeDefined();
    expect(typeof createDeployment).toBe('function');
  });

  it('배포 상태를 조회할 수 있어야 함', async () => {
    const { getDeploymentStatus } = await import('../../../src/api/deploy');
    
    expect(getDeploymentStatus).toBeDefined();
    expect(typeof getDeploymentStatus).toBe('function');
  });

  it('파일을 업로드할 수 있어야 함', async () => {
    const { uploadFiles } = await import('../../../src/api/deploy');
    
    expect(uploadFiles).toBeDefined();
    expect(typeof uploadFiles).toBe('function');
  });
});

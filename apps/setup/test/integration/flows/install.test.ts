/**
 * 설치 흐름 통합 테스트 (Test 5.1)
 *
 * TDD RED Phase: 전체 설치 프로세스 오케스트레이션 테스트
 */
import { describe, expect, it } from 'bun:test';

describe('설치 오케스트레이션', () => {
  it('오케스트레이터가 존재해야 함', async () => {
    const { Orchestrator } = await import('../../../src/orchestrator');
    
    expect(Orchestrator).toBeDefined();
  });

  it('설치 단계들이 정의되어 있어야 함', async () => {
    const { InstallSteps } = await import('../../../src/orchestrator');
    
    expect(InstallSteps).toBeDefined();
    expect(InstallSteps.AUTH).toBeDefined();
    expect(InstallSteps.CONFIG).toBeDefined();
    expect(InstallSteps.PROJECT).toBeDefined();
    expect(InstallSteps.ENV).toBeDefined();
    expect(InstallSteps.DEPLOY).toBeDefined();
  });

  it('진행률 표시 기능이 있어야 함', async () => {
    const { showProgress, hideProgress } = await import('../../../src/ui/progress');
    
    expect(showProgress).toBeDefined();
    expect(hideProgress).toBeDefined();
  });
});

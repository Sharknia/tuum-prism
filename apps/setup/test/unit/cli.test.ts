/**
 * CLI 진입점 테스트 (Test 1.1)
 *
 * TDD RED Phase: 이 테스트는 CLI 모듈이 없으므로 실패해야 함
 */
import { describe, expect, it } from 'bun:test';

describe('CLI 진입점', () => {
  it('CLI 모듈이 존재해야 함', async () => {
    const cli = await import('../../src/cli');
    expect(cli).toBeDefined();
    expect(cli.run).toBeFunction();
  });

  it('--version 플래그가 버전을 출력해야 함', async () => {
    const cli = await import('../../src/cli');
    const result = await cli.run(['--version']);
    expect(result.output).toMatch(/\d+\.\d+\.\d+/);
  });

  it('--help 플래그가 도움말을 출력해야 함', async () => {
    const cli = await import('../../src/cli');
    const result = await cli.run(['--help']);
    expect(result.output).toContain('tuum-setup');
    expect(result.output).toContain('Options');
  });

  it('인자 없이 실행하면 설치 흐름을 시작해야 함', async () => {
    const cli = await import('../../src/cli');
    const result = await cli.run([]);
    expect(result.started).toBe(true);
  });
});

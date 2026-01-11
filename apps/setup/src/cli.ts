/**
 * CLI 진입점
 *
 * 원터치 설치 시스템의 메인 진입점입니다.
 */

import kleur from 'kleur';
import { Orchestrator } from './orchestrator';

const VERSION = '0.1.0';

const HELP_TEXT = `
${kleur.cyan().bold('tuum-setup')} - Tuum Blog 원터치 설치 도구

${kleur.yellow('Usage:')}
  tuum-setup [options]

${kleur.yellow('Options:')}
  --version, -v    버전 정보 출력
  --help, -h       도움말 출력

${kleur.yellow('Examples:')}
  tuum-setup              설치 마법사 시작
  tuum-setup --version    버전 확인
`;

export interface CLIResult {
  output: string;
  started: boolean;
  exitCode: number;
}

/**
 * CLI 실행 함수
 */
export async function run(args: string[]): Promise<CLIResult> {
  // --version 또는 -v
  if (args.includes('--version') || args.includes('-v')) {
    return {
      output: VERSION,
      started: false,
      exitCode: 0,
    };
  }

  // --help 또는 -h
  if (args.includes('--help') || args.includes('-h')) {
    return {
      output: HELP_TEXT,
      started: false,
      exitCode: 0,
    };
  }

  // 인자 없음: 설치 흐름 시작
  return {
    output: '',
    started: true,
    exitCode: 0,
  };
}

/**
 * 메인 실행 (CLI에서 직접 호출 시)
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const result = await run(args);

  if (result.output) {
    console.log(result.output);
  }

  if (result.started) {
    // 오케스트레이터 실행
    const orchestrator = new Orchestrator({
      sourceDir: process.cwd(),
    });

    const installResult = await orchestrator.run();

    if (!installResult.success) {
      process.exit(1);
    }
  }

  process.exit(result.exitCode);
}


/**
 * 진행률 UI
 *
 * 설치 단계별 진행률 표시
 */

import kleur from 'kleur';
import ora, { type Ora } from 'ora';

let currentSpinner: Ora | null = null;

/**
 * 화면 지우기
 */
export function clearScreen(): void {
  console.clear();
}

/**
 * 단계 헤더 표시 (화면 clear 포함)
 */
export function showStepHeader(step: string, title: string): void {
  hideProgress();
  clearScreen();
  console.log(kleur.cyan().bold(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  console.log(kleur.cyan().bold(`  [${step}] ${title}`));
  console.log(kleur.cyan().bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`));
}

/**
 * 현재 단계 표시 (스피너)
 */
export function showProgress(step: string, message: string): void {
  if (currentSpinner) {
    currentSpinner.stop();
  }

  currentSpinner = ora({
    text: `${kleur.cyan(`[${step}]`)} ${message}`,
    spinner: 'dots',
  }).start();
}

/**
 * 진행률 숨기기
 */
export function hideProgress(): void {
  if (currentSpinner) {
    currentSpinner.stop();
    currentSpinner = null;
  }
}

/**
 * 성공 표시
 */
export function showSuccess(step: string, message: string): void {
  if (currentSpinner) {
    currentSpinner.succeed(`${kleur.cyan(`[${step}]`)} ${kleur.green(message)}`);
    currentSpinner = null;
  } else {
    console.log(`${kleur.green('✓')} ${kleur.cyan(`[${step}]`)} ${message}`);
  }
}

/**
 * 실패 표시
 */
export function showError(step: string, message: string): void {
  if (currentSpinner) {
    currentSpinner.fail(`${kleur.cyan(`[${step}]`)} ${kleur.red(message)}`);
    currentSpinner = null;
  } else {
    console.log(`${kleur.red('✗')} ${kleur.cyan(`[${step}]`)} ${message}`);
  }
}

/**
 * 정보 메시지 표시
 */
export function showInfo(message: string): void {
  console.log(`${kleur.dim('ℹ')} ${kleur.dim(message)}`);
}

/**
 * 단계 완료 후 잠시 대기
 */
export async function pauseBeforeNext(ms: number = 1000): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

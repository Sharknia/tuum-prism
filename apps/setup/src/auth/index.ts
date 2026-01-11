/**
 * PAT 인증 모듈
 *
 * Personal Access Token 직접 입력 방식
 */

import kleur from 'kleur';
import prompts from 'prompts';
import { validateTokenFormat, verifyToken } from './token';

export interface AuthResult {
  accessToken: string;
  userId: string;
  email: string;
  username: string;
}

/**
 * Vercel 인증 수행
 *
 * 1. 사용자에게 토큰 입력 요청
 * 2. API 호출로 토큰 유효성 검증
 * 3. 사용자 정보 반환
 */
export async function authenticate(): Promise<AuthResult> {
  console.log(kleur.white('Vercel Access Token이 필요합니다.\n'));

  console.log(kleur.yellow('📋 토큰 발급 방법:'));
  console.log(kleur.dim('   1. https://vercel.com/account/tokens 접속'));
  console.log(kleur.dim('   2. "Create Token" 클릭'));
  console.log(kleur.dim('   3. 이름 입력 (예: tuum-setup)'));
  console.log(kleur.dim('   4. "Create" 클릭 후 토큰 복사\n'));

  const response = await prompts({
    type: 'password',
    name: 'token',
    message: 'Vercel Access Token',
    validate: (value) => {
      if (!value) return '토큰을 입력하세요';
      if (!validateTokenFormat(value)) return '유효한 토큰 형식이 아닙니다';
      return true;
    },
  });

  if (!response.token) {
    throw new Error('토큰 입력이 취소되었습니다');
  }

  console.log(kleur.dim('   토큰 검증 중...'));

  const user = await verifyToken(response.token);

  console.log(kleur.green(`   ✅ 인증 완료: ${user.email}\n`));

  return {
    accessToken: response.token,
    userId: user.id,
    email: user.email,
    username: user.username,
  };
}

// Re-export
export { validateTokenFormat, verifyToken, type User } from './token';


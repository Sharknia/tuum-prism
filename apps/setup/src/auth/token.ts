/**
 * Vercel 토큰 검증
 *
 * Personal Access Token 유효성 검증
 */

export interface User {
  id: string;
  email: string;
  name: string | null;
  username: string;
}

/**
 * 토큰으로 사용자 정보 조회 (토큰 유효성 검증)
 */
export async function verifyToken(token: string): Promise<User> {
  const response = await fetch('https://api.vercel.com/v2/user', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('유효하지 않은 토큰입니다. 토큰을 다시 확인해주세요.');
    }
    throw new Error(`API 오류: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    username: data.user.username,
  };
}

/**
 * 토큰 형식 유효성 검증 (빠른 검사)
 */
export function validateTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Vercel 토큰은 보통 길이가 꽤 김
  if (token.length < 20) {
    return false;
  }

  return true;
}

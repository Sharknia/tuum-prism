/**
 * 설정 유효성 검증
 *
 * 사용자 입력값 검증 함수들
 */

/**
 * Notion API Key 검증
 * 형식: secret_xxx 또는 ntn_xxx
 */
export function validateNotionApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Notion API Key 접두사 확인
  return key.startsWith('secret_') || key.startsWith('ntn_');
}

/**
 * Notion Database ID 검증
 * 형식: UUID (8-4-4-4-12) 또는 하이픈 없는 32자
 */
export function validateDatabaseId(id: string): boolean {
  if (!id || typeof id !== 'string') {
    return false;
  }

  // UUID 형식 (하이픈 포함)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // 하이픈 없는 32자 형식
  const compactRegex = /^[0-9a-f]{32}$/i;

  return uuidRegex.test(id) || compactRegex.test(id);
}

/**
 * URL 검증
 * 빈 문자열은 선택 필드이므로 허용
 */
export function validateUrl(url: string): boolean {
  if (!url) {
    return true; // 선택 필드
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 이메일 검증
 * 빈 문자열은 선택 필드이므로 허용
 */
export function validateEmail(email: string): boolean {
  if (!email) {
    return true; // 선택 필드
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

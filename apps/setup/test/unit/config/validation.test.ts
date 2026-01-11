/**
 * 설정 유효성 검증 테스트 (Test 4.1)
 *
 * TDD RED Phase: 사용자 입력 유효성 검증 테스트
 */
import { describe, expect, it } from 'bun:test';

describe('설정 유효성 검증', () => {
  it('Notion API Key 형식을 검증해야 함', async () => {
    const { validateNotionApiKey } = await import('../../../src/config/validation');
    
    expect(validateNotionApiKey('secret_abc123')).toBe(true);
    expect(validateNotionApiKey('ntn_abc123')).toBe(true);
    expect(validateNotionApiKey('invalid_key')).toBe(false);
    expect(validateNotionApiKey('')).toBe(false);
  });

  it('Notion Database ID 형식을 검증해야 함', async () => {
    const { validateDatabaseId } = await import('../../../src/config/validation');
    
    // 유효한 UUID 형식
    expect(validateDatabaseId('12345678-1234-1234-1234-123456789012')).toBe(true);
    // 하이픈 없는 형식도 허용
    expect(validateDatabaseId('12345678123412341234123456789012')).toBe(true);
    // 잘못된 형식
    expect(validateDatabaseId('invalid')).toBe(false);
    expect(validateDatabaseId('')).toBe(false);
  });

  it('URL 형식을 검증해야 함', async () => {
    const { validateUrl } = await import('../../../src/config/validation');
    
    expect(validateUrl('https://github.com/user')).toBe(true);
    expect(validateUrl('https://example.com')).toBe(true);
    expect(validateUrl('not-a-url')).toBe(false);
    expect(validateUrl('')).toBe(true); // 빈 문자열은 선택 필드이므로 허용
  });

  it('이메일 형식을 검증해야 함', async () => {
    const { validateEmail } = await import('../../../src/config/validation');
    
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('')).toBe(true); // 선택 필드
  });
});

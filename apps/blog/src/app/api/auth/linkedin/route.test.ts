import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('GET /api/auth/linkedin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      LINKEDIN_CLIENT_ID: 'test-client-id',
      NEXT_PUBLIC_BASE_URL: 'https://example.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('LinkedIn OAuth URL로 리다이렉트해야 한다', async () => {
    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(307);
    expect(response.headers.get('Location')).toContain(
      'https://www.linkedin.com/oauth/v2/authorization'
    );
  });

  it('필수 OAuth 파라미터를 포함해야 한다', async () => {
    const { GET } = await import('./route');
    const response = await GET();
    const location = response.headers.get('Location') ?? '';

    expect(location).toContain('response_type=code');
    expect(location).toContain('client_id=test-client-id');
    expect(location).toContain('scope=openid');
    expect(location).toContain('w_member_social');
    expect(location).toContain('redirect_uri=');
  });

  it('LINKEDIN_CLIENT_ID가 없으면 500을 반환해야 한다', async () => {
    delete process.env.LINKEDIN_CLIENT_ID;

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(500);
  });

  it('NEXT_PUBLIC_BASE_URL이 없으면 500을 반환해야 한다', async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;

    const { GET } = await import('./route');
    const response = await GET();

    expect(response.status).toBe(500);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();
const mockCookiesGet = vi.fn();
const mockCookiesDelete = vi.fn();
const mockCookies = {
  get: mockCookiesGet,
  delete: mockCookiesDelete,
  set: vi.fn(),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}));

describe('GET /api/auth/linkedin/callback', () => {
  const originalEnv = process.env;
  const validState = 'valid-state-uuid';

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    global.fetch = mockFetch;

    mockCookiesGet.mockReturnValue({ value: validState });

    process.env = {
      ...originalEnv,
      LINKEDIN_CLIENT_ID: 'test-client-id',
      LINKEDIN_CLIENT_SECRET: 'test-client-secret',
      NEXT_PUBLIC_BASE_URL: 'https://example.com',
      VERCEL_TOKEN: 'test-vercel-token',
      EDGE_CONFIG_ID: 'ecfg_test123',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('코드를 토큰으로 교환하고 Edge Config를 업데이트해야 한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'new-access-token',
            refresh_token: 'new-refresh-token',
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });

    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com/api/auth/linkedin/callback?code=auth-code&state=${validState}`
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://www.linkedin.com/oauth/v2/accessToken',
      expect.objectContaining({ method: 'POST' })
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.vercel.com'),
      expect.objectContaining({ method: 'PATCH' })
    );
  });

  it('code가 없으면 400을 반환해야 한다', async () => {
    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com/api/auth/linkedin/callback?state=${validState}`
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('토큰 교환 실패 시 500을 반환해야 한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid_grant' }),
    });

    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com/api/auth/linkedin/callback?code=invalid&state=${validState}`
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('Edge Config 업데이트 실패 시 500을 반환해야 한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'token',
            refresh_token: 'refresh',
          }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com?code=valid&state=${validState}`
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('환경변수가 없으면 500을 반환해야 한다', async () => {
    delete process.env.LINKEDIN_CLIENT_ID;

    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com?code=valid&state=${validState}`
    );
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('state 일치 시 정상적으로 진행해야 한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ access_token: 'token', refresh_token: 'refresh' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });

    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com/callback?code=auth-code&state=${validState}`
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('state 불일치 시 400을 반환해야 한다', async () => {
    const { GET } = await import('./route');
    const request = new Request(
      'https://example.com/callback?code=auth-code&state=wrong-state'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('URL에 state 파라미터가 없으면 400을 반환해야 한다', async () => {
    const { GET } = await import('./route');
    const request = new Request('https://example.com/callback?code=auth-code');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('쿠키에 state가 없으면 400을 반환해야 한다', async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com/callback?code=auth-code&state=${validState}`
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('state 검증 후 쿠키가 삭제되어야 한다', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ access_token: 'token', refresh_token: 'refresh' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });

    const { GET } = await import('./route');
    const request = new Request(
      `https://example.com/callback?code=auth-code&state=${validState}`
    );
    await GET(request);

    expect(mockCookiesDelete).toHaveBeenCalledWith('linkedin_oauth_state');
  });
});

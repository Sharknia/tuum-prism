import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// EdgeConfigClient를 동적 import하여 테스트 (모듈 미존재 시 실패 확인)
describe('EdgeConfigClient', () => {
  const mockEdgeConfigId = 'ecfg_test123';
  const mockVercelToken = 'test-vercel-token';

  // fetch 모킹
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getLinkedInTokens', () => {
    it('토큰이 존재할 때 올바르게 반환해야 한다', async () => {
      // Arrange: Edge Config API 응답 모킹
      const mockTokens = {
        LINKEDIN_ACCESS_TOKEN: 'access-token-123',
        LINKEDIN_REFRESH_TOKEN: 'refresh-token-456',
        LINKEDIN_TOKEN_ISSUED_AT: 1704067200000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTokens),
      });

      // Act
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);
      const result = await client.getLinkedInTokens();

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
        issuedAt: 1704067200000,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(mockEdgeConfigId),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockVercelToken}`,
          }),
        })
      );
    });

    it('토큰이 존재하지 않을 때 null을 반환해야 한다', async () => {
      // Arrange: 빈 응답
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      // Act
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);
      const result = await client.getLinkedInTokens();

      // Assert
      expect(result).toBeNull();
    });

    it('네트워크 에러 시 예외를 던져야 한다', async () => {
      // Arrange: 네트워크 실패
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);

      await expect(client.getLinkedInTokens()).rejects.toThrow('Network error');
    });

    it('API 에러 응답 시 예외를 던져야 한다', async () => {
      // Arrange: 401 Unauthorized
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      // Act & Assert
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);

      await expect(client.getLinkedInTokens()).rejects.toThrow();
    });
  });

  describe('updateLinkedInTokens', () => {
    it('토큰을 성공적으로 업데이트해야 한다', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });

      // Act
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);

      await client.updateLinkedInTokens({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        issuedAt: Date.now(),
      });

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`${mockEdgeConfigId}/items`),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockVercelToken}`,
            'Content-Type': 'application/json',
          }),
        })
      );

      // 요청 body 검증
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.items).toHaveLength(3);
      expect(body.items[0]).toMatchObject({
        operation: 'upsert',
        key: 'LINKEDIN_ACCESS_TOKEN',
      });
    });

    it('부분 업데이트를 지원해야 한다 (accessToken만)', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });

      // Act
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);

      await client.updateLinkedInTokens({
        accessToken: 'only-access-token',
      });

      // Assert: 하나의 아이템만 업데이트
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].key).toBe('LINKEDIN_ACCESS_TOKEN');
      expect(body.items[0].value).toBe('only-access-token');
    });

    it('API 에러 시 예외를 던져야 한다', async () => {
      // Arrange: 403 Forbidden
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ error: { message: 'Access denied' } }),
      });

      // Act & Assert
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);

      await expect(
        client.updateLinkedInTokens({ accessToken: 'test' })
      ).rejects.toThrow();
    });

    it('빈 토큰 객체로 호출 시 요청을 보내지 않아야 한다', async () => {
      // Act
      const { EdgeConfigClient } = await import('./edge-config.client');
      const client = new EdgeConfigClient(mockEdgeConfigId, mockVercelToken);

      await client.updateLinkedInTokens({});

      // Assert: fetch가 호출되지 않음
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});

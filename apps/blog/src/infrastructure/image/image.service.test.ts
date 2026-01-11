import type { NotionBlock } from '@tuum/refract-notion';
import { describe, expect, it, vi } from 'vitest';
import type { ImageStorageAdapter } from './image.types';

// Mock the env check
vi.mock('@/config/env', () => ({
  isImageStorageConfigured: vi.fn(() => true),
}));

describe('ImageService', () => {
  describe('graceful fallback', () => {
    it('should return original blocks when storage not configured', async () => {
      // Re-mock for this test
      const { isImageStorageConfigured } = await import('@/config/env');
      vi.mocked(isImageStorageConfigured).mockReturnValue(false);

      const { ImageServiceImpl } = await import('./image.service');
      const mockStorage: ImageStorageAdapter = {
        upload: vi.fn(),
        exists: vi.fn(),
        delete: vi.fn(),
      };

      const service = new ImageServiceImpl(mockStorage);
      const blocks = [{ id: '1', type: 'paragraph' as const, children: [] }];

      const result = await service.processImages(
        blocks as unknown as NotionBlock[],
        'post-1'
      );

      expect(result).toBe(blocks); // Same reference, not processed
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });
  });

  describe('image extraction', () => {
    it('should extract nested image blocks', async () => {
      const { isImageStorageConfigured } = await import('@/config/env');
      vi.mocked(isImageStorageConfigured).mockReturnValue(true);

      const { ImageServiceImpl } = await import('./image.service');
      const mockStorage: ImageStorageAdapter = {
        upload: vi
          .fn()
          .mockResolvedValue('https://blob.vercel-storage.com/test.jpg'),
        exists: vi.fn().mockResolvedValue(false),
        delete: vi.fn(),
      };

      // Mock fetch for image download
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10)),
      });

      const service = new ImageServiceImpl(mockStorage);
      const blocks = [
        {
          id: 'parent',
          type: 'paragraph' as const,
          children: [
            {
              id: 'img-1',
              type: 'image' as const,
              image: {
                type: 'file',
                file: { url: 'https://notion.so/signed-url.jpg' },
                caption: [],
              },
              children: [],
            },
          ],
        },
      ];

      const result = await service.processImages(
        blocks as unknown as NotionBlock[],
        'post-1'
      );

      expect(mockStorage.upload).toHaveBeenCalled();
      // The nested image URL should be replaced
      expect(
        (
          result[0].children?.[0] as unknown as {
            image: { external: { url: string } };
          }
        ).image.external.url
      ).toBe('https://blob.vercel-storage.com/test.jpg');
    });
  });
});

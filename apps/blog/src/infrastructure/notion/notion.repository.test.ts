import { PostStatus } from '@/domain/post';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getNotionClient } from './notion.client';
import { NotionPostRepository } from './notion.repository';

// Notion Client Mocking
vi.mock('./notion.client', () => ({
  getNotionClient: vi.fn(),
  getNotionDatabaseId: vi.fn().mockReturnValue('mock-db-id'),
}));

describe('NotionPostRepository', () => {
  let repository: NotionPostRepository;
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (getNotionClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      databases: {
        retrieve: vi.fn().mockResolvedValue({
          data_sources: [{ id: 'mock-source-id' }],
        }),
      },
      dataSources: {
        query: mockQuery,
      },
    });
    repository = new NotionPostRepository();
  });

  describe('getAdjacentPosts', () => {
    const currentPostId = 'current-id';
    const currentPostDate = new Date('2026-01-10T10:00:00Z');

    it('should return previous and next posts correctly', async () => {
      // Previous Post (Older) Response
      const prevPostPage = {
        object: 'page',
        id: 'prev-id',
        url: 'https://notion.so/prev-id',
        created_time: '2026-01-09T10:00:00Z',
        last_edited_time: '2026-01-09T10:00:00Z',
        properties: {
          title: { type: 'title', title: [{ plain_text: 'Previous Post' }] },
          description: {
            type: 'rich_text',
            rich_text: [{ plain_text: 'Desc' }],
          },
          date: { type: 'date', date: { start: '2026-01-09' } },
          tags: { type: 'multi_select', multi_select: [] },
          series: { type: 'select', select: null },
          상태: { type: 'select', select: { name: PostStatus.Updated } },
          Slug: { type: 'rich_text', rich_text: [{ plain_text: 'prev-post' }] },
          IDX: { type: 'unique_id', unique_id: { number: 10 } },
        },
      };

      // Next Post (Newer) Response
      const nextPostPage = {
        object: 'page',
        id: 'next-id',
        url: 'https://notion.so/next-id',
        created_time: '2026-01-11T10:00:00Z',
        last_edited_time: '2026-01-11T10:00:00Z',
        properties: {
          title: { type: 'title', title: [{ plain_text: 'Next Post' }] },
          description: {
            type: 'rich_text',
            rich_text: [{ plain_text: 'Desc' }],
          },
          date: { type: 'date', date: { start: '2026-01-11' } },
          tags: { type: 'multi_select', multi_select: [] },
          series: { type: 'select', select: null },
          상태: { type: 'select', select: { name: PostStatus.Updated } },
          Slug: { type: 'rich_text', rich_text: [{ plain_text: 'next-post' }] },
          IDX: { type: 'unique_id', unique_id: { number: 12 } },
        },
      };

      // Mock implementation for two sequential calls (Promise.all order checks)
      mockQuery
        // First call: Previous (Older) -> date < current, desc sort
        .mockResolvedValueOnce({
          results: [prevPostPage],
          has_more: false,
        })
        // Second call: Next (Newer) -> date > current, asc sort
        .mockResolvedValueOnce({
          results: [nextPostPage],
          has_more: false,
        });

      const result = await repository.getAdjacentPosts(
        currentPostId,
        currentPostDate
      );

      expect(result.prev).toBeDefined();
      expect(result.prev?.id).toBe('prev-id');
      expect(result.prev?.title).toBe('Previous Post');

      expect(result.next).toBeDefined();
      expect(result.next?.id).toBe('next-id');
      expect(result.next?.title).toBe('Next Post');

      // Check Filter Logic
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('should handle edge cases (no previous or no next post)', async () => {
      mockQuery
        .mockResolvedValueOnce({ results: [], has_more: false }) // No prev
        .mockResolvedValueOnce({ results: [], has_more: false }); // No next

      const result = await repository.getAdjacentPosts(
        currentPostId,
        currentPostDate
      );

      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });
  });
});

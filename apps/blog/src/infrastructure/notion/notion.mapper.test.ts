import { PostStatus } from '@/domain/post';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { describe, expect, it } from 'vitest';
import { formatLogTimestamp, mapNotionPageToPost } from './notion.mapper';

describe('Notion Mapper', () => {
  describe('formatLogTimestamp', () => {
    it('returns timestamp in YYYY-MM-DD HH:mm format', () => {
      const timestamp = formatLogTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    });
  });

  describe('mapNotionPageToPost', () => {
    const mockPage: PageObjectResponse = {
      id: 'test-id',
      object: 'page',
      created_time: '2024-01-01T00:00:00.000Z',
      last_edited_time: '2024-01-02T00:00:00.000Z',
      created_by: { object: 'user', id: 'user-id' },
      last_edited_by: { object: 'user', id: 'user-id' },
      cover: null,
      icon: null,
      parent: { type: 'database_id', database_id: 'db-id' },
      archived: false,
      is_locked: false, // Added missing property
      properties: {
        IDX: {
          type: 'unique_id',
          unique_id: { prefix: null, number: 123 },
          id: 'idx-id',
        },
        title: {
          type: 'title',
          title: [
            {
              type: 'text',
              text: { content: 'Test Title', link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              plain_text: 'Test Title',
              href: null,
            },
          ],
          id: 'title-id',
        },
        description: {
          type: 'rich_text',
          rich_text: [
            {
              type: 'text',
              text: { content: 'Test Description', link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              plain_text: 'Test Description',
              href: null,
            },
          ],
          id: 'desc-id',
        },
        tags: {
          type: 'multi_select',
          multi_select: [
            { id: 'tag1', name: 'Tag1', color: 'blue' },
            { id: 'tag2', name: 'Tag2', color: 'red' },
          ],
          id: 'tags-id',
        },
        series: {
          type: 'select',
          select: { id: 'series1', name: 'Series 1', color: 'green' },
          id: 'series-id',
        },
        date: {
          type: 'date',
          date: { start: '2024-01-01', end: null, time_zone: null },
          id: 'date-id',
        },
        상태: {
          type: 'select',
          select: { id: 'status1', name: 'Ready', color: 'yellow' },
          id: 'status-id',
        },
        systemLog: {
          type: 'rich_text',
          rich_text: [
            {
              type: 'text',
              text: { content: 'Log message', link: null },
              annotations: {
                bold: false,
                italic: false,
                strikethrough: false,
                underline: false,
                code: false,
                color: 'default',
              },
              plain_text: 'Log message',
              href: null,
            },
          ],
          id: 'log-id',
        },
      },
      url: 'https://notion.so/test-id',
      public_url: null,
      in_trash: false,
    };

    it('maps all properties correctly', () => {
      const post = mapNotionPageToPost(mockPage);

      expect(post).toEqual({
        id: 'test-id',
        idx: 123,
        title: 'Test Title',
        description: 'Test Description',
        tags: ['Tag1', 'Tag2'],
        series: 'Series 1',
        date: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02T00:00:00.000Z'),
        status: PostStatus.Ready,
        systemLog: 'Log message',
      });
    });

    it('handles null optional properties', () => {
      const pageWithNulls = {
        ...mockPage,
        properties: {
          ...mockPage.properties,
          series: { type: 'select', select: null, id: 'series-id' } as unknown,
          date: { type: 'date', date: null, id: 'date-id' } as unknown,
          상태: { type: 'select', select: null, id: 'status-id' } as unknown,
          systemLog: {
            type: 'rich_text',
            rich_text: [],
            id: 'log-id',
          } as unknown,
        },
      } as PageObjectResponse;

      const post = mapNotionPageToPost(pageWithNulls);

      expect(post.series).toBeNull();
      expect(post.date).toBeNull();
      expect(post.status).toBe(PostStatus.Writing); // Default status
      expect(post.systemLog).toBe('');
    });

    it('maps unknown status to Writing', () => {
      const pageWithUnknownStatus = {
        ...mockPage,
        properties: {
          ...mockPage.properties,
          상태: {
            type: 'select',
            select: { name: 'UnknownValue' },
            id: 'status-id',
          } as unknown,
        },
      } as PageObjectResponse;

      const post = mapNotionPageToPost(pageWithUnknownStatus);

      expect(post.status).toBe(PostStatus.Writing);
    });
  });
});

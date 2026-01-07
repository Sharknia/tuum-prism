import type { PostRepository } from '@/application/post';
import type { Post, PostStatus } from '@/domain/post';
import { isFullPage } from '@notionhq/client';
import { getBlocks, type NotionBlock } from '@tuum/refract-notion';
import {
    getNotionClient,
    getNotionDatabaseId,
} from './notion.client';
import { formatLogTimestamp, mapNotionPageToPost } from './notion.mapper';

/**
 * Notion Post Repository 구현체
 * Official SDK를 사용
 */
export class NotionPostRepository implements PostRepository {
  private readonly notion;
  private readonly databaseId;
  private dataSourceId: string | null = null;

  constructor() {
    this.notion = getNotionClient();
    this.databaseId = getNotionDatabaseId();
  }

  /**
   * data_source_id 조회 (캐싱)
   */
  private async getDataSourceId(): Promise<string> {
    if (this.dataSourceId) return this.dataSourceId;

    const database = await this.notion.databases.retrieve({
      database_id: this.databaseId,
    });

    if (!('data_sources' in database) || database.data_sources.length === 0) {
      throw new Error('No data sources found in database');
    }

    this.dataSourceId = database.data_sources[0].id;
    return this.dataSourceId;
  }

  /**
   * 특정 상태의 포스트 목록 조회
   */
  async findByStatus(status: PostStatus, limit: number = 100): Promise<Post[]> {
    try {
      const dataSourceId = await this.getDataSourceId();

      const response = await this.notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: limit,
        filter: {
          property: '상태',
          select: {
            equals: status,
          },
        },
        sorts: [
          {
            timestamp: 'last_edited_time',
            direction: 'descending',
          },
        ],
      });

      return response.results.filter(isFullPage).map(mapNotionPageToPost);
    } catch (error) {
      console.error('Failed to find posts by status:', error);
      return [];
    }
  }

  /**
   * 포스트 본문 조회 (Notion Block 데이터)
   * Official SDK + refract-notion 사용
   */
  async getPostContent(id: string): Promise<NotionBlock[]> {
    // Config Injection: Repository가 Client를 주입
    const blocks = await getBlocks(this.notion, id);
    return blocks;
  }

  /**
   * 포스트 상태 변경 (systemLog에 자동 기록)
   */
  async updateStatus(id: string, status: PostStatus): Promise<void> {
    // 현재 상태 조회
    const page = await this.notion.pages.retrieve({ page_id: id });
    let currentStatus = 'Unknown';
    if (isFullPage(page) && page.properties['상태']?.type === 'select') {
      currentStatus = page.properties['상태'].select?.name ?? 'Unknown';
    }

    // 상태 업데이트
    await this.notion.pages.update({
      page_id: id,
      properties: {
        상태: {
          select: { name: status },
        },
      },
    });

    // 로그 기록
    await this.appendLog(id, `${currentStatus} → ${status}`);
  }

  /**
   * systemLog에 메시지 append
   */
  async appendLog(id: string, message: string): Promise<void> {
    // 기존 로그 조회
    const page = await this.notion.pages.retrieve({ page_id: id });
    let existingLog = '';
    if (
      isFullPage(page) &&
      page.properties['systemLog']?.type === 'rich_text'
    ) {
      existingLog = page.properties['systemLog'].rich_text
        .map((t) => t.plain_text)
        .join('');
    }

    // 새 로그 append
    const timestamp = formatLogTimestamp();
    const newLog = existingLog
      ? `${existingLog}\n[${timestamp}] ${message}`
      : `[${timestamp}] ${message}`;

    await this.notion.pages.update({
      page_id: id,
      properties: {
        systemLog: {
          rich_text: [{ text: { content: newLog } }],
        },
      },
    });
  }
}

import type { PostRepository } from '@/application/post';
import type { Post, PostStatus } from '@/domain/post';
import { isFullPage } from '@notionhq/client';
import { getNotionClient, getNotionDatabaseId } from './notion.client';
import { formatLogTimestamp, mapNotionPageToPost } from './notion.mapper';

/**
 * Notion 기반 PostRepository 구현체
 * 클린 아키텍처 Adapter
 */
export class NotionPostRepository implements PostRepository {
  private dataSourceId: string | null = null;

  /**
   * data_source_id 조회 (캐싱)
   */
  private async getDataSourceId(): Promise<string> {
    if (this.dataSourceId) return this.dataSourceId;

    const notion = getNotionClient();
    const databaseId = getNotionDatabaseId();

    const database = await notion.databases.retrieve({
      database_id: databaseId,
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
  async findByStatus(status: PostStatus): Promise<Post[]> {
    const notion = getNotionClient();
    const dataSourceId = await this.getDataSourceId();

    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        property: '상태',
        select: {
          equals: status,
        },
      },
    });

    return response.results.filter(isFullPage).map(mapNotionPageToPost);
  }

  /**
   * 포스트 상태 변경 (systemLog에 자동 기록)
   */
  async updateStatus(id: string, status: PostStatus): Promise<void> {
    const notion = getNotionClient();

    // 현재 상태 조회
    const page = await notion.pages.retrieve({ page_id: id });
    let currentStatus = 'Unknown';
    if (isFullPage(page) && page.properties['상태']?.type === 'select') {
      currentStatus = page.properties['상태'].select?.name ?? 'Unknown';
    }

    // 상태 업데이트
    await notion.pages.update({
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
    const notion = getNotionClient();

    // 기존 로그 조회
    const page = await notion.pages.retrieve({ page_id: id });
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

    await notion.pages.update({
      page_id: id,
      properties: {
        systemLog: {
          rich_text: [{ text: { content: newLog } }],
        },
      },
    });
  }
}

import type { PostRepository } from '@/application/post';
import { AppError, ErrorCode } from '@/domain/errors';
import type { Post, PostStatus } from '@/domain/post';
import { fail, ok, type Result } from '@/domain/result';
import type { APIErrorCode } from '@notionhq/client';
import { isFullPage } from '@notionhq/client';
import { getBlocks, type NotionBlock } from '@tuum/refract-notion';
import { getNotionClient, getNotionDatabaseId } from './notion.client';
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
   * 단일 포스트 조회 (ID로)
   * Result 패턴으로 404 vs 서버 에러 구분
   */
  async findById(id: string): Promise<Result<Post>> {
    // UUID 형식 검증 (Notion API 호출 전에 먼저 체크)
    if (!this.isValidUuid(id)) {
      return fail(AppError.notFound('포스트'));
    }

    try {
      const page = await this.notion.pages.retrieve({ page_id: id });
      if (!isFullPage(page)) {
        return fail(AppError.notFound('포스트'));
      }
      return ok(mapNotionPageToPost(page));
    } catch (error) {
      // Notion API 에러 분기
      if (this.isNotionApiError(error)) {
        if (error.code === 'object_not_found') {
          return fail(AppError.notFound('포스트'));
        }
        // validation_error도 404로 처리 (잘못된 ID 형식)
        if (error.code === 'validation_error') {
          return fail(AppError.notFound('포스트'));
        }
        if (error.code === 'unauthorized') {
          return fail(
            new AppError('인증 오류', ErrorCode.UNAUTHORIZED, 401, error)
          );
        }
      }

      console.error('Failed to find post by id:', error);
      return fail(AppError.internal('서버 오류가 발생했습니다', error));
    }
  }

  /**
   * UUID 형식 검증
   */
  private isValidUuid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // Notion은 하이픈 없는 32자리 형식도 허용
    const noHyphenRegex = /^[0-9a-f]{32}$/i;
    return uuidRegex.test(id) || noHyphenRegex.test(id);
  }

  /**
   * Notion API 에러인지 확인
   */
  private isNotionApiError(
    error: unknown
  ): error is { code: APIErrorCode; message: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as Record<string, unknown>).code === 'string'
    );
  }

  /**
   * 태그로 포스트 필터링 조회
   */
  async findByTag(
    status: PostStatus,
    tag: string,
    limit: number = 100
  ): Promise<Post[]> {
    try {
      const dataSourceId = await this.getDataSourceId();

      const response = await this.notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: limit,
        filter: {
          and: [
            { property: '상태', select: { equals: status } },
            { property: 'tags', multi_select: { contains: tag } },
          ],
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
      console.error('Failed to find posts by tag:', error);
      return [];
    }
  }

  /**
   * 시리즈로 포스트 필터링 조회
   */
  async findBySeries(
    status: PostStatus,
    series: string,
    limit: number = 100
  ): Promise<Post[]> {
    try {
      const dataSourceId = await this.getDataSourceId();

      const response = await this.notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: limit,
        filter: {
          and: [
            { property: '상태', select: { equals: status } },
            { property: 'series', select: { equals: series } },
          ],
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
      console.error('Failed to find posts by series:', error);
      return [];
    }
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

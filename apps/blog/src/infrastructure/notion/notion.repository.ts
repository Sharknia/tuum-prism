import type {
  FindPostsOptions,
  PaginatedResult,
  PostPath,
  PostRepository,
} from '@/application/post';
import { AppError, ErrorCode } from '@/domain/errors';
import type { Post } from '@/domain/post';
import { PostStatus } from '@/domain/post';
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
   * 포스트 목록 조회 (통합 검색)
   * 기본적으로 Published(Updated) 상태만 조회
   */
  async findPosts(
    options: FindPostsOptions = {}
  ): Promise<PaginatedResult<Post>> {
    const { tag, series, limit = 20, cursor } = options;

    try {
      const dataSourceId = await this.getDataSourceId();

      // 필터 조건 구성
      const baseFilter = {
        property: '상태',
        select: { equals: PostStatus.Updated },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let filter: any = baseFilter;

      if (tag && series) {
        filter = {
          and: [
            baseFilter,
            { property: 'tags', multi_select: { contains: tag } },
            { property: 'series', select: { equals: series } },
          ],
        };
      } else if (tag) {
        filter = {
          and: [
            baseFilter,
            { property: 'tags', multi_select: { contains: tag } },
          ],
        };
      } else if (series) {
        filter = {
          and: [baseFilter, { property: 'series', select: { equals: series } }],
        };
      }

      const response = await this.notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: limit,
        start_cursor: cursor,
        filter,
        sorts: [
          {
            property: 'date',
            direction: 'descending',
          },
        ],
      });

      return {
        results: response.results.filter(isFullPage).map(mapNotionPageToPost),
        nextCursor: response.has_more ? (response.next_cursor ?? null) : null,
      };
    } catch (error) {
      console.error('Failed to find posts:', error);
      return { results: [], nextCursor: null };
    }
  }

  /**
   * 단일 포스트 조회
   * Published(Updated) 상태가 아니면 NotFound 반환
   */
  async getPost(id: string): Promise<Result<Post>> {
    // UUID 형식 검증
    if (!this.isValidUuid(id)) {
      return fail(AppError.notFound('포스트'));
    }

    try {
      const page = await this.notion.pages.retrieve({ page_id: id });
      if (!isFullPage(page)) {
        return fail(AppError.notFound('포스트'));
      }

      const post = mapNotionPageToPost(page);

      // Published(Updated) 상태 체크 - 보안 강화
      if (post.status !== PostStatus.Updated) {
        return fail(AppError.notFound('포스트'));
      }

      return ok(post);
    } catch (error) {
      // Notion API 에러 분기
      if (this.isNotionApiError(error)) {
        if (error.code === 'object_not_found') {
          return fail(AppError.notFound('포스트'));
        }
        if (error.code === 'validation_error') {
          return fail(AppError.notFound('포스트'));
        }
        if (error.code === 'unauthorized') {
          return fail(
            new AppError('인증 오류', ErrorCode.UNAUTHORIZED, 401, error)
          );
        }
      }

      console.error('Failed to get post:', error);
      return fail(AppError.internal('서버 오류가 발생했습니다', error));
    }
  }

  /**
   * 사이트맵용 전체 Published 포스트 경로 조회
   * 페이지네이션을 내부적으로 처리
   */
  async getAllPublishedPaths(): Promise<PostPath[]> {
    const paths: PostPath[] = [];
    let cursor: string | undefined;

    try {
      const dataSourceId = await this.getDataSourceId();

      do {
        const response = await this.notion.dataSources.query({
          data_source_id: dataSourceId,
          page_size: 100, // 최대치로 조회
          start_cursor: cursor,
          filter: {
            property: '상태',
            select: { equals: PostStatus.Updated },
          },
          sorts: [
            {
              property: 'date',
              direction: 'descending',
            },
          ],
        });

        for (const page of response.results) {
          if (isFullPage(page)) {
            const post = mapNotionPageToPost(page);
            paths.push({
              id: post.id,
              lastModified:
                post.date?.toISOString() || new Date().toISOString(),
            });
          }
        }

        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);

      return paths;
    } catch (error) {
      console.error('Failed to get all published paths:', error);
      return [];
    }
  }

  /**
   * 포스트 본문 조회 (Notion Block 데이터)
   */
  async getPostContent(id: string): Promise<NotionBlock[]> {
    const blocks = await getBlocks(this.notion, id);
    return blocks;
  }

  /**
   * UUID 형식 검증
   */
  private isValidUuid(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
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
   * 포스트 상태 변경 (systemLog에 자동 기록)
   */
  async updateStatus(id: string, status: PostStatus): Promise<void> {
    const page = await this.notion.pages.retrieve({ page_id: id });
    let currentStatus = 'Unknown';
    if (isFullPage(page) && page.properties['상태']?.type === 'select') {
      currentStatus = page.properties['상태'].select?.name ?? 'Unknown';
    }

    await this.notion.pages.update({
      page_id: id,
      properties: {
        상태: {
          select: { name: status },
        },
      },
    });

    await this.appendLog(id, `${currentStatus} → ${status}`);
  }

  /**
   * systemLog에 메시지 append
   */
  async appendLog(id: string, message: string): Promise<void> {
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

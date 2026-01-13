import type {
  FindPostsOptions,
  PaginatedResult,
  PostMetadataForAggregation,
  PostPath,
  PostRepository,
  SeriesStats,
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
    const { tag, series, limit = 20, cursor, sortDirection = 'desc' } = options;

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
            direction: sortDirection === 'asc' ? 'ascending' : 'descending',
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
   * 시리즈 통계 및 미리보기 조회
   * 각 시리즈별 포스트 개수, 마지막 업데이트일, 미리보기 포스트(최신순 5개) 반환
   */
  async getSeriesWithStats(): Promise<SeriesStats[]> {
    const seriesMap = new Map<string, { posts: Post[]; lastUpdated: Date }>();
    let cursor: string | undefined;

    try {
      const dataSourceId = await this.getDataSourceId();

      do {
        // 모든 Published 포스트 조회
        const response = await this.notion.dataSources.query({
          data_source_id: dataSourceId,
          page_size: 100,
          start_cursor: cursor,
          filter: {
            property: '상태',
            select: { equals: PostStatus.Updated },
          },
          sorts: [
            {
              property: 'date',
              direction: 'descending', // 최신순 정렬
            },
          ],
        });

        for (const page of response.results) {
          if (isFullPage(page)) {
            const post = mapNotionPageToPost(page);
            if (post.series) {
              const current = seriesMap.get(post.series) || {
                posts: [],
                lastUpdated: new Date(0), // 초기값: 아주 먼 과거
              };

              current.posts.push(post);

              // 시리즈의 마지막 업데이트일은 가장 최근 포스트의 날짜로 갱신
              const postDate = post.date || post.updatedAt;
              if (postDate > current.lastUpdated) {
                current.lastUpdated = postDate;
              }

              seriesMap.set(post.series, current);
            }
          }
        }

        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);

      // 통계 정보로 변환
      return Array.from(seriesMap.entries())
        .map(([name, data]) => {
          // 포스트는 이미 조회 시 날짜 내림차순(최신순)으로 정렬되어 있음
          // 시리즈 상세 페이지는 "오래된 순"이지만, 미리보기는 "최신글"이나 "1장부터" 중 선택 필요.
          // "책" 컨셉이므로 "1장(오래된 순)"부터 보여주는 것이 목차 느낌에 더 적합함.
          const sortedPosts = data.posts.sort((a, b) => {
            const dateA = a.date?.getTime() || 0;
            const dateB = b.date?.getTime() || 0;
            return dateA - dateB; // 오래된 순 정렬
          });

          return {
            name,
            count: data.posts.length,
            lastUpdated: data.lastUpdated,
            previewPosts: sortedPosts.slice(0, 5), // 첫 5개 챕터 미리보기
          };
        })
        .sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()); // 최근 업데이트 순
    } catch (error) {
      console.error('Failed to get series stats:', error);
      return [];
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
   * 전체 Published 포스트의 메타데이터 조회 (태그/시리즈 집계용)
   * 페이지네이션을 내부적으로 처리
   */
  async getAllPublishedMetadata(): Promise<PostMetadataForAggregation[]> {
    const metadata: PostMetadataForAggregation[] = [];
    let cursor: string | undefined;

    try {
      const dataSourceId = await this.getDataSourceId();

      do {
        const response = await this.notion.dataSources.query({
          data_source_id: dataSourceId,
          page_size: 100,
          start_cursor: cursor,
          filter: {
            property: '상태',
            select: { equals: PostStatus.Updated },
          },
        });

        for (const page of response.results) {
          if (isFullPage(page)) {
            const post = mapNotionPageToPost(page);
            metadata.push({
              tags: post.tags,
              series: post.series,
            });
          }
        }

        cursor = response.has_more
          ? (response.next_cursor ?? undefined)
          : undefined;
      } while (cursor);

      return metadata;
    } catch (error) {
      console.error('Failed to get all published metadata:', error);
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

  /**
   * 인접한 포스트(이전/다음 글) 조회
   */
  async getAdjacentPosts(
    id: string,
    date: Date
  ): Promise<{ prev: Post | null; next: Post | null }> {
    try {
      const dataSourceId = await this.getDataSourceId();
      const baseFilter = {
        property: '상태',
        select: { equals: PostStatus.Updated },
      };

      // 병렬 요청: 이전 글(Older) & 다음 글(Newer)
      const [prevResult, nextResult] = await Promise.all([
        // 이전 글: 현재 날짜보다 작은 것 중 내림차순 정렬 첫 번째
        this.notion.dataSources.query({
          data_source_id: dataSourceId,
          page_size: 1,
          filter: {
            and: [
              baseFilter,
              {
                property: 'date',
                date: { before: date.toISOString() },
              },
            ],
          },
          sorts: [{ property: 'date', direction: 'descending' }],
        }),
        // 다음 글: 현재 날짜보다 큰 것 중 오름차순 정렬 첫 번째
        this.notion.dataSources.query({
          data_source_id: dataSourceId,
          page_size: 1,
          filter: {
            and: [
              baseFilter,
              {
                property: 'date',
                date: { after: date.toISOString() },
              },
            ],
          },
          sorts: [{ property: 'date', direction: 'ascending' }],
        }),
      ]);

      const prev =
        prevResult.results.length > 0 && isFullPage(prevResult.results[0])
          ? mapNotionPageToPost(prevResult.results[0])
          : null;

      const next =
        nextResult.results.length > 0 && isFullPage(nextResult.results[0])
          ? mapNotionPageToPost(nextResult.results[0])
          : null;

      return { prev, next };
    } catch (error) {
      console.error('Failed to get adjacent posts:', error);
      return { prev: null, next: null };
    }
  }

  async getAboutPost(): Promise<Post | null> {
    try {
      const dataSourceId = await this.getDataSourceId();

      const response = await this.notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 1, // 최신 1개만 조회하면 됨 (상태 기반이라 명확)
        filter: {
          property: '상태',
          select: { equals: PostStatus.About },
        },
        sorts: [{ property: 'date', direction: 'descending' }],
      });

      if (response.results.length > 0 && isFullPage(response.results[0])) {
        return mapNotionPageToPost(response.results[0]);
      }

      return null;
    } catch (error) {
      console.error('Failed to get about post:', error);
      return null;
    }
  }
}

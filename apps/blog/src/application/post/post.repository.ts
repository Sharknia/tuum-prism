import type { Post, PostStatus } from '@/domain/post';
import type { Result } from '@/domain/result';
import type { NotionBlock } from '@tuum/refract-notion';

/**
 * 페이지네이션 결과
 */
export interface PaginatedResult<T> {
  results: T[];
  nextCursor: string | null;
}

/**
 * 포스트 검색 옵션
 * status 기본값: Updated (Published)
 */
export interface FindPostsOptions {
  tag?: string;
  series?: string;
  limit?: number;
  cursor?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * 사이트맵용 경로 정보
 */
export interface PostPath {
  id: string;
  lastModified: string;
}

export interface SeriesStats {
  name: string;
  count: number;
  lastUpdated: Date;
  previewPosts: Post[];
}

/**
 * 메타데이터 집계용 최소 정보
 */
export interface PostMetadataForAggregation {
  tags: string[];
  series: string | null;
}

/**
 * Post Repository 인터페이스
 * 클린 아키텍처 Port
 *
 * 모든 조회 메서드는 기본적으로 Published(Updated) 상태만 반환합니다.
 */
export interface PostRepository {
  /**
   * 포스트 목록 조회 (통합 검색)
   * 기본적으로 Published(Updated) 상태만 조회
   *
   * @param options - 검색 옵션 (tag, series, limit, cursor)
   */
  findPosts(options?: FindPostsOptions): Promise<PaginatedResult<Post>>;

  /**
   * 단일 포스트 조회
   * Published(Updated) 상태가 아니면 NotFound 반환
   *
   * @param id - 포스트 ID
   */
  getPost(id: string): Promise<Result<Post>>;

  /**
   * 시리즈 통계 및 미리보기 조회
   */
  getSeriesWithStats(): Promise<SeriesStats[]>;

  /**
   * 사이트맵용 전체 Published 포스트 경로 조회
   * 페이지네이션을 내부적으로 처리하여 모든 포스트의 ID와 수정일 반환
   */
  getAllPublishedPaths(): Promise<PostPath[]>;

  /**
   * 전체 Published 포스트의 메타데이터 조회 (태그/시리즈 집계용)
   * 페이지네이션을 내부적으로 처리하여 모든 포스트의 태그/시리즈 반환
   */
  getAllPublishedMetadata(): Promise<PostMetadataForAggregation[]>;

  /**
   * 포스트 본문 조회 (Notion Block 데이터)
   */
  getPostContent(id: string): Promise<NotionBlock[]>;

  /**
   * 포스트 상태 변경 (systemLog에 자동 기록)
   */
  updateStatus(id: string, status: PostStatus): Promise<void>;

  /**
   * systemLog에 메시지 append
   */
  /**
   * systemLog에 메시지 append
   */
  appendLog(id: string, message: string): Promise<void>;

  /**
   * 인접한 포스트(이전/다음 글) 조회
   * 날짜 기준 정렬
   */
  getAdjacentPosts(
    id: string,
    date: Date
  ): Promise<{ prev: Post | null; next: Post | null }>;

  /**
   * About 태그가 있는 최신 Published 포스트 조회
   * - 태그 비교: 소문자 + trim 변환 (대소문자 무관)
   * - 상태: Updated만 대상
   * - 정렬: date 내림차순 (최신 우선)
   *
   * @returns About 포스트 또는 null (없는 경우)
   */
  getAboutPost(): Promise<Post | null>;
}

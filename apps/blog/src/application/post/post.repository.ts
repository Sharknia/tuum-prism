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
   * 시리즈 목록 조회
   * Notion 데이터베이스의 'series' 속성 옵션을 알파벳순으로 반환
   */
  getSeriesList(): Promise<string[]>;

  /**
   * 사이트맵용 전체 Published 포스트 경로 조회
   * 페이지네이션을 내부적으로 처리하여 모든 포스트의 ID와 수정일 반환
   */
  getAllPublishedPaths(): Promise<PostPath[]>;

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
  appendLog(id: string, message: string): Promise<void>;
}

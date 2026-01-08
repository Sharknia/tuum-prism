import type { Post, PostStatus } from '@/domain/post';
import type { Result } from '@/domain/result';
import type { NotionBlock } from '@tuum/refract-notion';

/**
 * Post Repository 인터페이스
 * 클린 아키텍처 Port
 */
export interface PostRepository {
  /**
  /**
   * 특정 상태의 포스트 목록 조회
   * @param status 포스트 상태
   * @param limit 조회할 최대 개수 (기본값: 100)
   * @param cursor 페이지네이션 커서
   */
  findByStatus(
    status: PostStatus,
    limit?: number,
    cursor?: string
  ): Promise<{ results: Post[]; nextCursor: string | null }>;

  /**
   * 단일 포스트 조회 (ID로)
   * Result 패턴으로 404 vs 서버 에러 구분
   */
  findById(id: string): Promise<Result<Post>>;

  /**
   * 태그로 포스트 필터링 조회
   */
  findByTag(status: PostStatus, tag: string, limit?: number): Promise<Post[]>;

  /**
   * 시리즈로 포스트 필터링 조회
   */
  findBySeries(
    status: PostStatus,
    series: string,
    limit?: number
  ): Promise<Post[]>;

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

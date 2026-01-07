import type { Post, PostStatus } from '@/domain/post';
import type { NotionBlock } from '@tuum/refract-notion';

/**
 * Post Repository 인터페이스
 * 클린 아키텍처 Port
 */
export interface PostRepository {
  /**
   * 특정 상태의 포스트 목록 조회
   * @param status 포스트 상태
   * @param limit 조회할 최대 개수 (기본값: 100)
   */
  findByStatus(status: PostStatus, limit?: number): Promise<Post[]>;

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

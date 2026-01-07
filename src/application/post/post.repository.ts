import type { Post, PostStatus } from '@/domain/post';

/**
 * Post Repository 인터페이스
 * 클린 아키텍처 Port
 */
export interface PostRepository {
  /**
   * 특정 상태의 포스트 목록 조회
   */
  findByStatus(status: PostStatus): Promise<Post[]>;

  /**
   * 포스트 상태 변경 (systemLog에 자동 기록)
   */
  updateStatus(id: string, status: PostStatus): Promise<void>;

  /**
   * systemLog에 메시지 append
   */
  appendLog(id: string, message: string): Promise<void>;
}

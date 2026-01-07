import type { PostStatus } from './post-status.enum';

export interface Post {
  id: string; // Notion 페이지 ID
  idx: number; // unique_id (IDX)
  title: string;
  description: string;
  tags: string[];
  series: string | null;
  date: Date | null;
  updatedAt: Date;
  status: PostStatus;
  systemLog: string | null; // 시스템 로그 (append 방식)
}

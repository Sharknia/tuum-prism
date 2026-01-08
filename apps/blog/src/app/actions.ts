'use server';

import { PostStatus } from '@/domain/post';
import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';

const postRepository = new NotionPostRepository();

export async function getMorePosts(cursor: string, status: PostStatus = PostStatus.Updated) {
  return postRepository.findByStatus(status, 20, cursor);
}

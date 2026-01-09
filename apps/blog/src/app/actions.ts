'use server';

import { NotionPostRepository } from '@/infrastructure/notion/notion.repository';

const postRepository = new NotionPostRepository();

export async function getMorePosts(cursor: string) {
  return postRepository.findPosts({ limit: 20, cursor });
}

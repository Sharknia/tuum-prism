import { Client } from '@notionhq/client';
import { BlockObjectResponse, ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionBlock } from '../types';

/**
 * 특정 페이지(또는 블록)의 자식 블록들을 재귀적으로 모두 조회합니다.
 * @param client Notion Client 인스턴스
 * @param blockId 조회할 블록 ID
 */
export async function getBlocks(client: Client, blockId: string): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | undefined = undefined;

  while (true) {
    const response: ListBlockChildrenResponse = await client.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
    });
    
    const { results, next_cursor, has_more } = response;

    // PartialBlockObjectResponse 필터링 및 타입 단언
    const validBlocks = results.filter((block): block is BlockObjectResponse => 'type' in block);

    // 하위 블록 재귀 조회 (has_children이 true인 경우)
    const blocksWithChildren = await Promise.all(
      validBlocks.map(async (block) => {
        const extendedBlock = { ...block } as NotionBlock;
        
        if (block.has_children) {
          extendedBlock.children = await getBlocks(client, block.id);
        }
        
        return extendedBlock;
      })
    );

    blocks.push(...blocksWithChildren);

    if (!has_more) {
      break;
    }
    cursor = next_cursor ?? undefined;
  }

  return blocks;
}

import type { NotionBlock } from '@tuum/refract-notion';
import type { ImageService } from './image.types';

/**
 * Passthrough 이미지 서비스
 *
 * 스토리지가 설정되지 않은 환경에서 사용.
 * 이미지 처리 없이 원본 블록을 그대로 반환한다.
 */
export class PassthroughImageService implements ImageService {
  async processImages(
    blocks: NotionBlock[],
    _postId: string
  ): Promise<NotionBlock[]> {
    console.log(
      '[Image] Service disabled (storage not configured), using original URLs'
    );
    return blocks;
  }
}

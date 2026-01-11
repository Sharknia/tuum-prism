/**
 * 이미지 인프라 모듈
 *
 * 사용법:
 * ```typescript
 * import { createImageService } from '@/infrastructure/image';
 *
 * const imageService = createImageService();
 * const processedBlocks = await imageService.processImages(blocks, postId);
 * ```
 */

export { BlobStorageAdapter } from './blob-storage';
export { ImageServiceImpl } from './image.service';
export type {
    ImageMetadata,
    ImageProcessResult,
    ImageService,
    ImageStorageAdapter
} from './image.types';

import { BlobStorageAdapter } from './blob-storage';
import { ImageServiceImpl } from './image.service';
import type { ImageService } from './image.types';
import { PassthroughImageService } from './passthrough-image.service';

/**
 * ImageService 팩토리 함수
 *
 * 환경변수 체크를 중앙화하여 적절한 서비스 구현체를 반환한다.
 * - BLOB_READ_WRITE_TOKEN 있음 → ImageServiceImpl (실제 업로드)
 * - BLOB_READ_WRITE_TOKEN 없음 → PassthroughImageService (원본 반환)
 */
export function createImageService(): ImageService {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.log('[Image] BLOB_READ_WRITE_TOKEN not found, using passthrough service');
    return new PassthroughImageService();
  }

  return new ImageServiceImpl(new BlobStorageAdapter());
}

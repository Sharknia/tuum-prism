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

/**
 * ImageService 팩토리 함수
 * 환경에 따라 적절한 스토리지 어댑터 선택
 */
export function createImageService(): ImageService {
  // 현재는 Vercel Blob만 지원
  // 추후 Cloudinary 등 추가 가능
  const storage = new BlobStorageAdapter();
  return new ImageServiceImpl(storage);
}

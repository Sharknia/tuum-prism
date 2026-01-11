import type { NotionBlock } from '@tuum/refract-notion';
import type { ImageService, ImageStorageAdapter } from './image.types';

/**
 * Content-Type 매핑
 */
const CONTENT_TYPE_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
};

/**
 * 이미지 처리 서비스
 *
 * 기능:
 * - Notion 블록에서 이미지 추출
 * - Notion signed URL → Blob 영구 URL 변환
 *
 * 환경변수 없는 경우 폴백은 createImageService() 팩토리에서
 * PassthroughImageService를 반환하여 처리한다.
 */
export class ImageServiceImpl implements ImageService {
  constructor(private storage: ImageStorageAdapter) {}

  /**
   * Notion 블록 배열의 이미지 URL을 영구 URL로 변환
   */
  async processImages(
    blocks: NotionBlock[],
    postId: string
  ): Promise<NotionBlock[]> {
    // 이미지 블록 추출 (중첩 포함)
    const imageBlocks = this.extractImageBlocks(blocks);

    if (imageBlocks.length === 0) {
      return blocks;
    }

    console.log(`[Image] Processing ${imageBlocks.length} images for post ${postId}`);

    // 병렬로 영구 URL 확보
    const urlMap = new Map<string, string>();
    await Promise.all(
      imageBlocks.map(async (block) => {
        const originalUrl = this.getImageUrl(block);
        if (!originalUrl) return;

        try {
          const permanentUrl = await this.ensurePermanentUrl(
            originalUrl,
            postId,
            block.id
          );
          urlMap.set(block.id, permanentUrl);
        } catch (error) {
          console.error(`[Image] Failed to process image ${block.id}:`, error);
          // 실패 시 원본 URL 유지
        }
      })
    );

    // 블록 데이터 immutable 변환
    return this.replaceImageUrls(blocks, urlMap);
  }

  /**
   * 단일 이미지 영구 URL 확보
   */
  private async ensurePermanentUrl(
    notionUrl: string,
    postId: string,
    blockId: string
  ): Promise<string> {
    const ext = this.extractExtension(notionUrl);
    const path = `images/${postId}/${blockId}.${ext}`;

    // 예상 URL 생성 (Vercel Blob URL 패턴)
    // 실제로는 upload 후의 URL을 사용해야 하지만, 
    // exists 체크를 위해 path 기반으로 확인
    const expectedUrl = await this.tryGetExistingUrl(path);
    
    if (expectedUrl) {
      console.log(`[Image] Cache hit: ${blockId}`);
      return expectedUrl;
    }

    // 다운로드 후 업로드
    console.log(`[Image] Uploading: ${blockId}`);
    const buffer = await this.downloadImage(notionUrl);
    const contentType = CONTENT_TYPE_MAP[ext] || 'application/octet-stream';
    
    return this.storage.upload(buffer, path, contentType);
  }

  /**
   * 기존 업로드된 이미지 URL 확인
   * path로 업로드된 이미지가 있으면 해당 URL 반환
   */
  private async tryGetExistingUrl(path: string): Promise<string | null> {
    // Vercel Blob은 동일 path로 업로드 시 동일 URL 반환
    // 하지만 exists 체크를 위해서는 전체 URL이 필요
    // 여기서는 간단히 upload를 시도하고 이미 존재하면 해당 URL 사용
    // 실제로는 list API나 메타데이터 저장이 필요할 수 있음
    return null; // 항상 업로드 시도 (Blob이 자동으로 중복 처리)
  }

  /**
   * 이미지 다운로드
   */
  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * URL에서 확장자 추출
   */
  private extractExtension(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
      return match ? match[1].toLowerCase() : 'png';
    } catch {
      return 'png';
    }
  }

  /**
   * 이미지 블록에서 URL 추출
   */
  private getImageUrl(block: NotionBlock): string | null {
    if (block.type !== 'image') return null;
    
    const image = (block as any).image;
    if (!image) return null;

    if (image.type === 'file' && image.file?.url) {
      return image.file.url;
    }
    if (image.type === 'external' && image.external?.url) {
      return image.external.url;
    }
    return null;
  }

  /**
   * 블록 트리에서 모든 이미지 블록 추출 (중첩 포함)
   */
  private extractImageBlocks(blocks: NotionBlock[]): NotionBlock[] {
    const result: NotionBlock[] = [];

    const traverse = (blockList: NotionBlock[]) => {
      for (const block of blockList) {
        if (block.type === 'image') {
          result.push(block);
        }
        if (block.children && block.children.length > 0) {
          traverse(block.children);
        }
      }
    };

    traverse(blocks);
    return result;
  }

  /**
   * 블록 트리의 이미지 URL 교체 (immutable)
   */
  private replaceImageUrls(
    blocks: NotionBlock[],
    urlMap: Map<string, string>
  ): NotionBlock[] {
    const transform = (blockList: NotionBlock[]): NotionBlock[] => {
      return blockList.map((block) => {
        let newBlock = block;

        // 이미지 블록이면 URL 교체
        if (block.type === 'image' && urlMap.has(block.id)) {
          const newUrl = urlMap.get(block.id)!;
          const image = (block as any).image;
          
          newBlock = {
            ...block,
            image: {
              ...image,
              // 영구 URL은 external 타입으로 변환
              type: 'external',
              external: { url: newUrl },
              // file 속성 제거
              file: undefined,
            },
          } as NotionBlock;
        }

        // 자식 블록 재귀 처리
        if (block.children && block.children.length > 0) {
          newBlock = {
            ...newBlock,
            children: transform(block.children),
          };
        }

        return newBlock;
      });
    };

    return transform(blocks);
  }
}

import type { NotionBlock } from '@tuum/refract-notion';

/**
 * 이미지 스토리지 추상화 인터페이스 (Strategy Pattern)
 * Vercel Blob, Cloudinary 등 다양한 스토리지 지원 가능
 */
export interface ImageStorageAdapter {
  /**
   * 이미지 업로드
   * @param buffer 이미지 바이너리
   * @param path 저장 경로 (예: images/{postId}/{blockId}.jpg)
   * @param contentType MIME 타입 (예: image/jpeg)
   * @returns 공개 URL
   */
  upload(buffer: Buffer, path: string, contentType: string): Promise<string>;

  /**
   * 이미지 존재 여부 확인
   * @param url 공개 URL
   */
  exists(url: string): Promise<boolean>;

  /**
   * 이미지 삭제
   * @param url 공개 URL
   */
  delete(url: string): Promise<void>;
}

/**
 * 이미지 처리 결과
 */
export interface ImageProcessResult {
  /** 원본 Notion URL */
  originalUrl: string;
  /** 영구 URL (Blob) 또는 원본 URL (fallback) */
  permanentUrl: string;
  /** 처리 방식 */
  method: 'uploaded' | 'cached' | 'fallback';
}

/**
 * 이미지 서비스 인터페이스
 */
export interface ImageService {
  /**
   * Notion 블록 배열의 이미지 URL을 영구 URL로 변환
   * @param blocks Notion 블록 배열
   * @param postId 포스트 ID (경로 생성용)
   * @returns 변환된 블록 배열 (immutable)
   */
  processImages(blocks: NotionBlock[], postId: string): Promise<NotionBlock[]>;
}

/**
 * 이미지 메타데이터 (SNS 업로드용)
 */
export interface ImageMetadata {
  url: string;
  blockId: string;
  postId: string;
  contentType: string;
}

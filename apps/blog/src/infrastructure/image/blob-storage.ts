import { del, head, put } from '@vercel/blob';
import type { ImageStorageAdapter } from './image.types';

/**
 * Vercel Blob 기반 이미지 스토리지 어댑터
 *
 * 특징:
 * - 공개 URL 자동 생성 (CDN 포함)
 * - head() API로 존재 여부 확인 (추가 비용 없음)
 * - BLOB_READ_WRITE_TOKEN 환경변수 자동 사용
 */
export class BlobStorageAdapter implements ImageStorageAdapter {
  /**
   * 이미지 업로드
   */
  async upload(
    buffer: Buffer,
    path: string,
    contentType: string
  ): Promise<string> {
    const blob = await put(path, buffer, {
      access: 'public',
      contentType,
      // 동일 경로 덮어쓰기 허용 (재업로드 시)
      addRandomSuffix: false,
    });

    console.log(`[Image] Uploaded: ${path} → ${blob.url}`);
    return blob.url;
  }

  /**
   * 이미지 존재 여부 확인
   * head() API는 메타데이터만 조회하므로 가벼움
   */
  async exists(url: string): Promise<boolean> {
    try {
      await head(url);
      return true;
    } catch (error) {
      // BlobNotFoundError 또는 네트워크 에러
      return false;
    }
  }

  /**
   * 이미지 삭제
   */
  async delete(url: string): Promise<void> {
    await del(url);
    console.log(`[Image] Deleted: ${url}`);
  }
}

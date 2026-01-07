import { z } from 'zod';

/**
 * 환경변수 스키마 정의
 * 런타임에서 환경변수 타입 안전성 보장
 */
const envSchema = z.object({
  // [필수] Notion API
  NOTION_API_KEY: z.string().min(1, 'NOTION_API_KEY is required'),
  NOTION_DATABASE_ID: z.string().min(1, 'NOTION_DATABASE_ID is required'),

  // [선택] LinkedIn API
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_ACCESS_TOKEN: z.string().optional(),

  // [선택] X (Twitter) API
  X_API_KEY: z.string().optional(),
  X_API_SECRET: z.string().optional(),
  X_ACCESS_TOKEN: z.string().optional(),
  X_ACCESS_TOKEN_SECRET: z.string().optional(),

  // [선택] Threads API
  THREADS_ACCESS_TOKEN: z.string().optional(),

  // [선택] 이미지 스토리지
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * 환경변수 파싱 및 검증
 * 서버 사이드에서만 호출해야 함
 */
export function getEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

/**
 * 선택적 환경변수 체크 유틸리티
 */
export function isLinkedInConfigured(): boolean {
  return !!(
    process.env.LINKEDIN_CLIENT_ID &&
    process.env.LINKEDIN_CLIENT_SECRET &&
    process.env.LINKEDIN_ACCESS_TOKEN
  );
}

export function isXConfigured(): boolean {
  return !!(
    process.env.X_API_KEY &&
    process.env.X_API_SECRET &&
    process.env.X_ACCESS_TOKEN &&
    process.env.X_ACCESS_TOKEN_SECRET
  );
}

export function isThreadsConfigured(): boolean {
  return !!process.env.THREADS_ACCESS_TOKEN;
}

export function isImageStorageConfigured(): boolean {
  const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
  const hasCloudinary = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  return hasVercelBlob || hasCloudinary;
}

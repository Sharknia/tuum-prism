import { getEnv } from '@/config/env';
import { Client } from '@notionhq/client';

let client: Client | null = null;

/**
 * Notion 클라이언트 싱글톤
 * 서버 사이드에서만 호출
 */
export function getNotionClient(): Client {
  if (!client) {
    const env = getEnv();
    client = new Client({ auth: env.NOTION_API_KEY });
  }
  return client;
}

/**
 * 데이터베이스 ID 반환
 */
export function getNotionDatabaseId(): string {
  const env = getEnv();
  return env.NOTION_DATABASE_ID;
}

import type { Post, PostStatus } from '@/domain/post';
import { PostStatus as PostStatusEnum } from '@/domain/post';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

type PropertyValue = PageObjectResponse['properties'][string];

/**
 * Notion 속성값에서 텍스트 추출
 */
/**
 * Notion 속성값에서 텍스트 추출
 */
function extractText(prop: PropertyValue | undefined): string {
  if (!prop) return '';
  if (prop.type === 'title' && prop.title.length > 0) {
    return prop.title.map((t) => t.plain_text).join('');
  }
  if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
    return prop.rich_text.map((t) => t.plain_text).join('');
  }
  return '';
}

/**
 * Notion 속성값에서 select 값 추출
 */
function extractSelect(prop: PropertyValue | undefined): string | null {
  if (!prop) return null;
  if (prop.type === 'select' && prop.select) {
    return prop.select.name;
  }
  return null;
}

/**
 * Notion 속성값에서 multi_select 값 추출
 */
function extractMultiSelect(prop: PropertyValue | undefined): string[] {
  if (!prop) return [];
  if (prop.type === 'multi_select') {
    return prop.multi_select.map((s) => s.name);
  }
  return [];
}

/**
 * Notion 속성값에서 unique_id 추출
 */
function extractUniqueId(prop: PropertyValue | undefined): number {
  if (!prop) return 0;
  if (prop.type === 'unique_id' && prop.unique_id.number !== null) {
    return prop.unique_id.number;
  }
  return 0;
}

/**
 * Notion 속성값에서 date 추출
 */
function extractDate(prop: PropertyValue | undefined): Date | null {
  if (!prop) return null;
  if (prop.type === 'date' && prop.date?.start) {
    return new Date(prop.date.start);
  }
  if (prop.type === 'last_edited_time') {
    return new Date(prop.last_edited_time);
  }
  return null;
}

/**
 * PostStatus 문자열을 enum으로 변환
 */
function mapStatus(statusName: string | null): PostStatus {
  if (!statusName) return PostStatusEnum.Writing;

  const statusMap: Record<string, PostStatus> = {
    Writing: PostStatusEnum.Writing,
    Ready: PostStatusEnum.Ready,
    Updated: PostStatusEnum.Updated,
    About: PostStatusEnum.About,
    ToBeDeleted: PostStatusEnum.ToBeDeleted,
    Deleted: PostStatusEnum.Deleted,
    Error: PostStatusEnum.Error,
  };

  return statusMap[statusName] ?? PostStatusEnum.Writing;
}

/**
 * Notion PageObjectResponse → Post 엔티티 변환
 */
export function mapNotionPageToPost(page: PageObjectResponse): Post {
  const props = page.properties;

  return {
    id: page.id,
    idx: extractUniqueId(props['IDX']),
    title: extractText(props['title']),
    description: extractText(props['description']),
    tags: extractMultiSelect(props['tags']),
    series: extractSelect(props['series']),
    date: extractDate(props['date']),
    updatedAt: new Date(page.last_edited_time),
    status: mapStatus(extractSelect(props['상태'])),
    systemLog: extractText(props['systemLog']),
  };
}

/**
 * 현재 시각을 로그 포맷으로 반환
 */
export function formatLogTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

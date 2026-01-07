import type { NotionBlock } from '@tuum/refract-notion';

export interface TocItem {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

/**
 * 문자열을 URL-safe slug로 변환
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\uAC00-\uD7A3-]/g, '') // 한글, 영숫자, 하이픈만 허용
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Heading 블록에서 텍스트 추출
 */
function extractHeadingText(block: NotionBlock): string {
  const blockAny = block as Record<string, unknown>;
  const blockType = block.type;
  const blockData = blockAny[blockType] as Record<string, unknown> | undefined;

  if (!blockData) return '';

  const richText = blockData.rich_text as
    | Array<{ plain_text: string }>
    | undefined;
  if (richText && Array.isArray(richText)) {
    return richText.map((t) => t.plain_text).join('');
  }

  return '';
}

/**
 * 고유한 ID 생성 (중복 방지)
 */
function generateUniqueId(text: string, existingIds: Set<string>): string {
  const baseSlug = slugify(text) || 'heading';
  let slug = baseSlug;
  let counter = 1;

  while (existingIds.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingIds.add(slug);
  return slug;
}

/**
 * Notion 블록 배열에서 목차 추출
 */
export function extractTableOfContents(blocks: NotionBlock[]): TocItem[] {
  const toc: TocItem[] = [];
  const existingIds = new Set<string>();

  function processBlocks(blockList: NotionBlock[]) {
    for (const block of blockList) {
      // Heading 블록 처리
      if (
        block.type === 'heading_1' ||
        block.type === 'heading_2' ||
        block.type === 'heading_3'
      ) {
        const text = extractHeadingText(block);
        if (text.trim()) {
          const level = parseInt(block.type.replace('heading_', ''), 10) as
            | 1
            | 2
            | 3;
          const id = generateUniqueId(text, existingIds);

          toc.push({ id, text: text.trim(), level });
        }
      }

      // 자식 블록 재귀 처리
      if (block.children && block.children.length > 0) {
        processBlocks(block.children);
      }
    }
  }

  processBlocks(blocks);
  return toc;
}

/**
 * 목차가 의미있는지 확인 (최소 2개 이상의 항목)
 */
export function hasMeaningfulToc(blocks: NotionBlock[]): boolean {
  const toc = extractTableOfContents(blocks);
  return toc.length >= 2;
}

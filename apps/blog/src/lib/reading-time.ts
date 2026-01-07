import type { NotionBlock } from '@tuum/refract-notion';

// 한국어 평균 읽기 속도: 분당 약 500자
const CHARS_PER_MINUTE = 500;

/**
 * Notion 블록에서 텍스트 콘텐츠 추출
 */
function extractTextFromBlock(block: NotionBlock): string {
  const blockAny = block as Record<string, unknown>;

  // 블록 타입에 따른 텍스트 추출
  const blockType = block.type;
  const blockData = blockAny[blockType] as Record<string, unknown> | undefined;

  if (!blockData) return '';

  // rich_text 배열이 있는 블록 타입들
  const richText = blockData.rich_text as
    | Array<{ plain_text: string }>
    | undefined;
  if (richText && Array.isArray(richText)) {
    return richText.map((t) => t.plain_text).join('');
  }

  // caption이 있는 블록 (이미지, 비디오 등)
  const caption = blockData.caption as
    | Array<{ plain_text: string }>
    | undefined;
  if (caption && Array.isArray(caption)) {
    return caption.map((t) => t.plain_text).join('');
  }

  return '';
}

/**
 * Notion 블록 배열에서 총 텍스트 길이 계산
 */
export function countCharacters(blocks: NotionBlock[]): number {
  let totalChars = 0;

  for (const block of blocks) {
    // 현재 블록의 텍스트
    const text = extractTextFromBlock(block);
    // 공백 제외한 문자 수
    totalChars += text.replace(/\s/g, '').length;

    // 자식 블록이 있으면 재귀적으로 계산
    if (block.children && block.children.length > 0) {
      totalChars += countCharacters(block.children);
    }
  }

  return totalChars;
}

/**
 * 읽기 시간 계산 (분 단위)
 * @returns 읽기 시간 (분), 최소 1분
 */
export function calculateReadingTime(blocks: NotionBlock[]): number {
  const totalChars = countCharacters(blocks);
  const minutes = Math.ceil(totalChars / CHARS_PER_MINUTE);
  return Math.max(1, minutes);
}

/**
 * 읽기 시간을 포맷팅된 문자열로 반환
 */
export function formatReadingTime(blocks: NotionBlock[]): string {
  const minutes = calculateReadingTime(blocks);
  return `${minutes}분 읽기`;
}

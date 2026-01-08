/**
 * Heading 관련 유틸리티 함수
 * TOC(Table of Contents)와 앵커 링크를 위한 ID 생성에 사용
 */

/**
 * 문자열을 URL-safe slug로 변환
 * @param text - 변환할 문자열
 * @returns 슬러그화된 문자열
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\uAC00-\uD7A3-]/g, '') // 한글, 영숫자, 하이픈만 허용
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * RichText 배열에서 plain text 추출
 * @param richText - Notion RichText 배열
 * @returns 결합된 텍스트
 */
export function getPlainText(
  richText: Array<{ plain_text: string }>
): string {
  return richText.map((t) => t.plain_text).join('');
}

import type { NotionBlock } from '@tuum/refract-notion';
import { describe, expect, it } from 'vitest';
import { extractTableOfContents, hasMeaningfulToc } from './toc-extractor';

// 테스트용 heading 블록 생성 헬퍼
function createHeadingBlock(text: string, level: 1 | 2 | 3): NotionBlock {
  const type = `heading_${level}` as const;
  return {
    id: `block-${Math.random()}`,
    type,
    [type]: {
      rich_text: [{ plain_text: text }],
    },
  } as unknown as NotionBlock;
}

function createParagraphBlock(text: string): NotionBlock {
  return {
    id: `block-${Math.random()}`,
    type: 'paragraph',
    paragraph: {
      rich_text: [{ plain_text: text }],
    },
  } as unknown as NotionBlock;
}

describe('toc-extractor', () => {
  describe('extractTableOfContents', () => {
    it('빈 블록 배열은 빈 목차 반환', () => {
      expect(extractTableOfContents([])).toEqual([]);
    });

    it('heading 블록이 없으면 빈 목차 반환', () => {
      const blocks = [
        createParagraphBlock('본문 내용'),
        createParagraphBlock('더 많은 본문'),
      ];
      expect(extractTableOfContents(blocks)).toEqual([]);
    });

    it('단일 heading 블록 추출', () => {
      const blocks = [createHeadingBlock('소개', 1)];
      const toc = extractTableOfContents(blocks);

      expect(toc).toHaveLength(1);
      expect(toc[0]).toEqual({
        id: '소개',
        text: '소개',
        level: 1,
      });
    });

    it('여러 레벨의 heading 추출', () => {
      const blocks = [
        createHeadingBlock('챕터 1', 1),
        createHeadingBlock('섹션 1.1', 2),
        createHeadingBlock('서브섹션 1.1.1', 3),
        createHeadingBlock('챕터 2', 1),
      ];
      const toc = extractTableOfContents(blocks);

      expect(toc).toHaveLength(4);
      expect(toc.map((t) => t.level)).toEqual([1, 2, 3, 1]);
    });

    it('중복 제목에 고유 ID 생성', () => {
      const blocks = [
        createHeadingBlock('개요', 1),
        createHeadingBlock('개요', 2),
        createHeadingBlock('개요', 2),
      ];
      const toc = extractTableOfContents(blocks);

      expect(toc.map((t) => t.id)).toEqual(['개요', '개요-1', '개요-2']);
    });

    it('특수문자가 포함된 제목 처리', () => {
      const blocks = [
        createHeadingBlock('Hello, World!', 1),
        createHeadingBlock('React & Next.js', 2),
      ];
      const toc = extractTableOfContents(blocks);

      expect(toc[0].id).toBe('hello-world');
      expect(toc[1].id).toBe('react-nextjs');
    });

    it('공백만 있는 heading은 무시', () => {
      const blocks = [
        createHeadingBlock('유효한 제목', 1),
        createHeadingBlock('   ', 2),
        createHeadingBlock('', 2),
      ];
      const toc = extractTableOfContents(blocks);

      expect(toc).toHaveLength(1);
    });

    it('한글 제목 슬러그 생성', () => {
      const blocks = [createHeadingBlock('가나다 라마바', 1)];
      const toc = extractTableOfContents(blocks);

      expect(toc[0].id).toBe('가나다-라마바');
    });
  });

  describe('hasMeaningfulToc', () => {
    it('heading이 없으면 false', () => {
      const blocks = [createParagraphBlock('본문')];
      expect(hasMeaningfulToc(blocks)).toBe(false);
    });

    it('heading이 1개면 false', () => {
      const blocks = [createHeadingBlock('제목', 1)];
      expect(hasMeaningfulToc(blocks)).toBe(false);
    });

    it('heading이 2개 이상이면 true', () => {
      const blocks = [
        createHeadingBlock('제목 1', 1),
        createHeadingBlock('제목 2', 2),
      ];
      expect(hasMeaningfulToc(blocks)).toBe(true);
    });
  });
});

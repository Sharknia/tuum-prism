import type { NotionBlock } from '@tuum/refract-notion';
import { describe, expect, it } from 'vitest';
import {
  calculateReadingTime,
  countCharacters,
  formatReadingTime,
} from './reading-time';

// 테스트용 mock 블록 생성 헬퍼
function createTextBlock(
  text: string,
  type: string = 'paragraph'
): NotionBlock {
  return {
    id: `block-${Math.random()}`,
    type,
    [type]: {
      rich_text: [{ plain_text: text }],
    },
  } as unknown as NotionBlock;
}

function createBlockWithChildren(
  text: string,
  children: NotionBlock[]
): NotionBlock {
  return {
    id: `block-${Math.random()}`,
    type: 'paragraph',
    paragraph: {
      rich_text: [{ plain_text: text }],
    },
    children,
  } as unknown as NotionBlock;
}

describe('reading-time', () => {
  describe('countCharacters', () => {
    it('빈 블록 배열은 0을 반환', () => {
      expect(countCharacters([])).toBe(0);
    });

    it('단일 텍스트 블록의 문자 수 계산', () => {
      const blocks = [createTextBlock('안녕하세요')];
      expect(countCharacters(blocks)).toBe(5);
    });

    it('공백은 문자 수에서 제외', () => {
      const blocks = [createTextBlock('안녕 하세요')];
      expect(countCharacters(blocks)).toBe(5);
    });

    it('여러 블록의 문자 수 합산', () => {
      const blocks = [createTextBlock('가나다'), createTextBlock('라마바')];
      expect(countCharacters(blocks)).toBe(6);
    });

    it('자식 블록의 문자 수도 포함', () => {
      const childBlock = createTextBlock('자식');
      const parentBlock = createBlockWithChildren('부모', [childBlock]);
      expect(countCharacters([parentBlock])).toBe(4); // 부모(2) + 자식(2)
    });

    it('다양한 블록 타입 지원 (heading, quote 등)', () => {
      const blocks = [
        createTextBlock('제목', 'heading_1'),
        createTextBlock('인용', 'quote'),
        createTextBlock('본문', 'paragraph'),
      ];
      expect(countCharacters(blocks)).toBe(6);
    });
  });

  describe('calculateReadingTime', () => {
    it('빈 블록은 최소 1분 반환', () => {
      expect(calculateReadingTime([])).toBe(1);
    });

    it('500자 미만은 1분', () => {
      const blocks = [createTextBlock('가'.repeat(400))];
      expect(calculateReadingTime(blocks)).toBe(1);
    });

    it('500자는 1분', () => {
      const blocks = [createTextBlock('가'.repeat(500))];
      expect(calculateReadingTime(blocks)).toBe(1);
    });

    it('501자는 2분 (올림)', () => {
      const blocks = [createTextBlock('가'.repeat(501))];
      expect(calculateReadingTime(blocks)).toBe(2);
    });

    it('1000자는 2분', () => {
      const blocks = [createTextBlock('가'.repeat(1000))];
      expect(calculateReadingTime(blocks)).toBe(2);
    });

    it('2500자는 5분', () => {
      const blocks = [createTextBlock('가'.repeat(2500))];
      expect(calculateReadingTime(blocks)).toBe(5);
    });
  });

  describe('formatReadingTime', () => {
    it('포맷팅된 문자열 반환', () => {
      const blocks = [createTextBlock('가'.repeat(1500))];
      expect(formatReadingTime(blocks)).toBe('3분 읽기');
    });

    it('빈 블록은 "1분 읽기" 반환', () => {
      expect(formatReadingTime([])).toBe('1분 읽기');
    });
  });
});

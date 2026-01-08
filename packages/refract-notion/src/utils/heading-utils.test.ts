import { describe, expect, it } from 'vitest';
import { getPlainText, slugify } from './heading-utils';

describe('slugify', () => {
  it('공백을 하이픈으로 변환', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('특수문자 제거', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('React & Next.js')).toBe('react-nextjs');
  });

  it('한글 유지', () => {
    expect(slugify('가나다 라마바')).toBe('가나다-라마바');
    expect(slugify('한글과 English')).toBe('한글과-english');
  });

  it('연속된 하이픈 정리', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('앞뒤 하이픈 제거', () => {
    expect(slugify('-hello-world-')).toBe('hello-world');
  });

  it('빈 문자열 처리', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
  });

  it('대문자를 소문자로 변환', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  it('숫자 포함 텍스트 처리', () => {
    expect(slugify('Chapter 1: Introduction')).toBe('chapter-1-introduction');
  });

  it('한글과 영어 혼합 처리', () => {
    expect(slugify('React로 시작하는 웹 개발')).toBe('react로-시작하는-웹-개발');
  });
});

describe('getPlainText', () => {
  it('빈 배열은 빈 문자열 반환', () => {
    expect(getPlainText([])).toBe('');
  });

  it('단일 텍스트 추출', () => {
    expect(getPlainText([{ plain_text: 'Hello' }])).toBe('Hello');
  });

  it('여러 텍스트 결합', () => {
    const richText = [
      { plain_text: 'Hello' },
      { plain_text: ' ' },
      { plain_text: 'World' },
    ];
    expect(getPlainText(richText)).toBe('Hello World');
  });

  it('다양한 서식의 텍스트 결합', () => {
    const richText = [
      { plain_text: 'Bold' },
      { plain_text: ' and ' },
      { plain_text: 'italic' },
      { plain_text: ' text' },
    ];
    expect(getPlainText(richText)).toBe('Bold and italic text');
  });
});

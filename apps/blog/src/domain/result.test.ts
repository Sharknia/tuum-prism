import { AppError, ErrorCode } from '@/domain/errors';
import { describe, expect, it } from 'vitest';
import { fail, isFail, isOk, ok, type Result } from './result';

describe('Result', () => {
  describe('ok()', () => {
    it('success: true와 data를 포함', () => {
      const result = ok({ id: 1, name: 'test' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, name: 'test' });
    });

    it('primitive 타입도 지원', () => {
      const stringResult = ok('hello');
      const numberResult = ok(42);
      const boolResult = ok(true);

      expect(stringResult.data).toBe('hello');
      expect(numberResult.data).toBe(42);
      expect(boolResult.data).toBe(true);
    });

    it('null/undefined도 지원', () => {
      const nullResult = ok(null);
      const undefinedResult = ok(undefined);

      expect(nullResult.success).toBe(true);
      expect(nullResult.data).toBeNull();
      expect(undefinedResult.data).toBeUndefined();
    });
  });

  describe('fail()', () => {
    it('success: false와 error를 포함', () => {
      const error = AppError.notFound('포스트');
      const result = fail(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });

    it('일반 Error도 지원', () => {
      const error = new Error('일반 에러');
      const result = fail(error);

      expect(result.success).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe('isOk()', () => {
    it('성공 결과는 true 반환', () => {
      const result = ok('data');
      expect(isOk(result)).toBe(true);
    });

    it('실패 결과는 false 반환', () => {
      const result = fail(new Error('error'));
      expect(isOk(result)).toBe(false);
    });
  });

  describe('isFail()', () => {
    it('실패 결과는 true 반환', () => {
      const result = fail(new Error('error'));
      expect(isFail(result)).toBe(true);
    });

    it('성공 결과는 false 반환', () => {
      const result = ok('data');
      expect(isFail(result)).toBe(false);
    });
  });

  describe('타입 안전성', () => {
    it('ok 결과에서 data 접근 가능', () => {
      const result: Result<string> = ok('hello');

      if (result.success) {
        // TypeScript가 result.data의 타입을 string으로 추론
        const data: string = result.data;
        expect(data).toBe('hello');
      }
    });

    it('fail 결과에서 error 접근 가능', () => {
      const result: Result<string, AppError> = fail(
        AppError.notFound('리소스')
      );

      if (!result.success) {
        // TypeScript가 result.error의 타입을 AppError로 추론
        const error: AppError = result.error;
        expect(error.code).toBe(ErrorCode.NOT_FOUND);
      }
    });
  });
});

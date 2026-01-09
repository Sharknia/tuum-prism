import { describe, expect, it } from 'vitest';
import { AppError, ErrorCode } from './app-error';

describe('AppError', () => {
  describe('constructor', () => {
    it('메시지, 코드, 상태코드를 올바르게 설정', () => {
      const error = new AppError('테스트 에러', ErrorCode.NOT_FOUND, 404);

      expect(error.message).toBe('테스트 에러');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('AppError');
    });

    it('originalError를 보존', () => {
      const originalError = new Error('원본 에러');
      const error = new AppError(
        '래핑된 에러',
        ErrorCode.INTERNAL_ERROR,
        500,
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });

    it('Error를 상속', () => {
      const error = new AppError('테스트', ErrorCode.NOT_FOUND, 404);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('notFound 팩토리', () => {
    it('NOT_FOUND 코드와 404 상태코드 반환', () => {
      const error = AppError.notFound('포스트');

      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('포스트을(를) 찾을 수 없습니다');
    });
  });

  describe('internal 팩토리', () => {
    it('INTERNAL_ERROR 코드와 500 상태코드 반환', () => {
      const error = AppError.internal('서버 오류');

      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('서버 오류');
    });

    it('originalError 보존', () => {
      const originalError = new Error('DB 연결 실패');
      const error = AppError.internal('서버 오류', originalError);

      expect(error.originalError).toBe(originalError);
    });
  });
});

describe('ErrorCode', () => {
  it('모든 에러 코드가 정의됨', () => {
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });
});

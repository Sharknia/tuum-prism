/**
 * 애플리케이션 에러 코드
 */
export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * 애플리케이션 커스텀 에러 클래스
 * 에러 유형을 구분하여 적절한 처리를 가능하게 함
 */
export class AppError extends Error {
  readonly name = 'AppError';

  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    public readonly originalError?: unknown
  ) {
    super(message);

    // Error 클래스 상속 시 prototype chain 보존
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 리소스를 찾을 수 없음 (404)
   */
  static notFound(resource: string): AppError {
    return new AppError(
      `${resource}을(를) 찾을 수 없습니다`,
      ErrorCode.NOT_FOUND,
      404
    );
  }

  /**
   * 서버 내부 오류 (500)
   */
  static internal(message: string, originalError?: unknown): AppError {
    return new AppError(message, ErrorCode.INTERNAL_ERROR, 500, originalError);
  }
}

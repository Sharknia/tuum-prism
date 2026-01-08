import type { AppError } from '@/domain/errors';

/**
 * 성공 결과 타입
 */
export interface Success<T> {
  success: true;
  data: T;
}

/**
 * 실패 결과 타입
 */
export interface Failure<E> {
  success: false;
  error: E;
}

/**
 * Result 타입: 성공 또는 실패를 표현
 * 에러를 예외가 아닌 값으로 처리하여 타입 안전한 에러 핸들링 제공
 */
export type Result<T, E = AppError> = Success<T> | Failure<E>;

/**
 * 성공 결과 생성
 */
export function ok<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * 실패 결과 생성
 */
export function fail<E>(error: E): Failure<E> {
  return { success: false, error };
}

/**
 * 결과가 성공인지 확인 (타입 가드)
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * 결과가 실패인지 확인 (타입 가드)
 */
export function isFail<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * className 병합 유틸리티
 * Tailwind CSS 클래스 충돌을 해결하면서 조건부 클래스를 적용
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

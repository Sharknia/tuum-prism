/**
 * LinkedIn 토큰 만료일 계산 유틸리티
 *
 * LinkedIn OAuth 토큰의 수명 정책:
 * - Access Token: 60일 (자동 갱신 가능)
 * - Refresh Token: 365일 (재인증 필요, 연장 불가)
 */

export const ACCESS_TOKEN_LIFETIME_DAYS = 60;
export const REFRESH_TOKEN_LIFETIME_DAYS = 365;
export const ACCESS_TOKEN_REFRESH_THRESHOLD_DAYS = 7;
export const REFRESH_TOKEN_ALERT_THRESHOLD_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calculateDaysRemaining(
  issuedAt: number,
  lifetimeDays: number
): number {
  const now = Date.now();
  const expiresAt = issuedAt + lifetimeDays * MS_PER_DAY;
  return Math.floor((expiresAt - now) / MS_PER_DAY);
}

export function calculateAccessTokenDaysRemaining(issuedAt: number): number {
  return calculateDaysRemaining(issuedAt, ACCESS_TOKEN_LIFETIME_DAYS);
}

export function calculateRefreshTokenDaysRemaining(issuedAt: number): number {
  return calculateDaysRemaining(issuedAt, REFRESH_TOKEN_LIFETIME_DAYS);
}

export function needsAccessTokenRefresh(issuedAt: number): boolean {
  const daysRemaining = calculateAccessTokenDaysRemaining(issuedAt);
  return daysRemaining <= ACCESS_TOKEN_REFRESH_THRESHOLD_DAYS;
}

export function needsReauthAlert(issuedAt: number): boolean {
  const daysRemaining = calculateRefreshTokenDaysRemaining(issuedAt);
  return daysRemaining <= REFRESH_TOKEN_ALERT_THRESHOLD_DAYS;
}

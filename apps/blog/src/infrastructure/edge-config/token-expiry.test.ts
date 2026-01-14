import { describe, expect, it } from 'vitest';
import {
  ACCESS_TOKEN_LIFETIME_DAYS,
  ACCESS_TOKEN_REFRESH_THRESHOLD_DAYS,
  REFRESH_TOKEN_ALERT_THRESHOLD_DAYS,
  REFRESH_TOKEN_LIFETIME_DAYS,
  calculateAccessTokenDaysRemaining,
  calculateRefreshTokenDaysRemaining,
  needsAccessTokenRefresh,
  needsReauthAlert,
} from './token-expiry';

// 테스트용 헬퍼: 특정 일수 전의 timestamp 생성
// Date.now()는 밀리초 단위이며, issuedAt도 밀리초 단위로 저장됨
function daysAgo(days: number): number {
  const now = Date.now();
  return now - days * 24 * 60 * 60 * 1000;
}

describe('Token Expiry Constants', () => {
  it('Access Token 수명은 60일이어야 한다', () => {
    expect(ACCESS_TOKEN_LIFETIME_DAYS).toBe(60);
  });

  it('Refresh Token 수명은 365일이어야 한다', () => {
    expect(REFRESH_TOKEN_LIFETIME_DAYS).toBe(365);
  });

  it('Access Token 갱신 임계값은 7일이어야 한다', () => {
    expect(ACCESS_TOKEN_REFRESH_THRESHOLD_DAYS).toBe(7);
  });

  it('Refresh Token 알림 임계값은 30일이어야 한다', () => {
    expect(REFRESH_TOKEN_ALERT_THRESHOLD_DAYS).toBe(30);
  });
});

describe('calculateAccessTokenDaysRemaining', () => {
  it('발급 직후 토큰은 60일이 남아있어야 한다', () => {
    // Arrange: 방금 발급된 토큰
    const issuedAt = Date.now();

    // Act
    const daysRemaining = calculateAccessTokenDaysRemaining(issuedAt);

    // Assert: 60일 (또는 반올림으로 59-60일)
    expect(daysRemaining).toBeGreaterThanOrEqual(59);
    expect(daysRemaining).toBeLessThanOrEqual(60);
  });

  it('30일 전에 발급된 토큰은 약 30일이 남아있어야 한다', () => {
    // Arrange: 30일 전 발급
    const issuedAt = daysAgo(30);

    // Act
    const daysRemaining = calculateAccessTokenDaysRemaining(issuedAt);

    // Assert
    expect(daysRemaining).toBeGreaterThanOrEqual(29);
    expect(daysRemaining).toBeLessThanOrEqual(31);
  });

  it('60일 전에 발급된 토큰은 0일이 남아있어야 한다', () => {
    // Arrange: 정확히 60일 전 발급
    const issuedAt = daysAgo(60);

    // Act
    const daysRemaining = calculateAccessTokenDaysRemaining(issuedAt);

    // Assert
    expect(daysRemaining).toBeGreaterThanOrEqual(-1);
    expect(daysRemaining).toBeLessThanOrEqual(1);
  });

  it('70일 전에 발급된 토큰은 음수 일수를 반환해야 한다 (이미 만료)', () => {
    // Arrange: 70일 전 발급 (만료됨)
    const issuedAt = daysAgo(70);

    // Act
    const daysRemaining = calculateAccessTokenDaysRemaining(issuedAt);

    // Assert: 약 -10일
    expect(daysRemaining).toBeLessThan(0);
    expect(daysRemaining).toBeGreaterThanOrEqual(-11);
    expect(daysRemaining).toBeLessThanOrEqual(-9);
  });

  it('issuedAt이 0이면 이미 오래 전에 만료된 것으로 처리한다', () => {
    // Arrange
    const issuedAt = 0;

    // Act
    const daysRemaining = calculateAccessTokenDaysRemaining(issuedAt);

    // Assert: 매우 큰 음수 (1970년 이후 경과일)
    expect(daysRemaining).toBeLessThan(-10000);
  });
});

describe('calculateRefreshTokenDaysRemaining', () => {
  it('발급 직후 토큰은 365일이 남아있어야 한다', () => {
    // Arrange
    const issuedAt = Date.now();

    // Act
    const daysRemaining = calculateRefreshTokenDaysRemaining(issuedAt);

    // Assert
    expect(daysRemaining).toBeGreaterThanOrEqual(364);
    expect(daysRemaining).toBeLessThanOrEqual(365);
  });

  it('300일 전에 발급된 토큰은 약 65일이 남아있어야 한다', () => {
    // Arrange: 300일 전 발급
    const issuedAt = daysAgo(300);

    // Act
    const daysRemaining = calculateRefreshTokenDaysRemaining(issuedAt);

    // Assert: 365 - 300 = 65일
    expect(daysRemaining).toBeGreaterThanOrEqual(64);
    expect(daysRemaining).toBeLessThanOrEqual(66);
  });

  it('365일 전에 발급된 토큰은 0일이 남아있어야 한다', () => {
    // Arrange
    const issuedAt = daysAgo(365);

    // Act
    const daysRemaining = calculateRefreshTokenDaysRemaining(issuedAt);

    // Assert
    expect(daysRemaining).toBeGreaterThanOrEqual(-1);
    expect(daysRemaining).toBeLessThanOrEqual(1);
  });

  it('400일 전에 발급된 토큰은 음수 일수를 반환해야 한다', () => {
    // Arrange
    const issuedAt = daysAgo(400);

    // Act
    const daysRemaining = calculateRefreshTokenDaysRemaining(issuedAt);

    // Assert: 약 -35일
    expect(daysRemaining).toBeLessThan(0);
  });
});

describe('needsAccessTokenRefresh', () => {
  it('53일 전에 발급된 토큰은 갱신이 필요하다 (7일 이하 남음)', () => {
    // Arrange: 53일 전 발급 → 7일 남음
    const issuedAt = daysAgo(53);

    // Act
    const needsRefresh = needsAccessTokenRefresh(issuedAt);

    // Assert
    expect(needsRefresh).toBe(true);
  });

  it('55일 전에 발급된 토큰은 갱신이 필요하다 (5일 남음)', () => {
    // Arrange: 55일 전 발급 → 5일 남음
    const issuedAt = daysAgo(55);

    // Act
    const needsRefresh = needsAccessTokenRefresh(issuedAt);

    // Assert
    expect(needsRefresh).toBe(true);
  });

  it('50일 전에 발급된 토큰은 갱신이 필요하지 않다 (10일 남음)', () => {
    // Arrange: 50일 전 발급 → 10일 남음
    const issuedAt = daysAgo(50);

    // Act
    const needsRefresh = needsAccessTokenRefresh(issuedAt);

    // Assert
    expect(needsRefresh).toBe(false);
  });

  it('이미 만료된 토큰(65일 전)은 갱신이 필요하다', () => {
    // Arrange: 65일 전 발급 → 이미 만료
    const issuedAt = daysAgo(65);

    // Act
    const needsRefresh = needsAccessTokenRefresh(issuedAt);

    // Assert: 만료된 토큰도 갱신 대상
    expect(needsRefresh).toBe(true);
  });

  it('방금 발급된 토큰은 갱신이 필요하지 않다', () => {
    // Arrange
    const issuedAt = Date.now();

    // Act
    const needsRefresh = needsAccessTokenRefresh(issuedAt);

    // Assert
    expect(needsRefresh).toBe(false);
  });
});

describe('needsReauthAlert', () => {
  it('335일 전에 발급된 토큰은 재인증 알림이 필요하다 (30일 이하 남음)', () => {
    // Arrange: 335일 전 발급 → 30일 남음
    const issuedAt = daysAgo(335);

    // Act
    const needsAlert = needsReauthAlert(issuedAt);

    // Assert
    expect(needsAlert).toBe(true);
  });

  it('340일 전에 발급된 토큰은 재인증 알림이 필요하다 (25일 남음)', () => {
    // Arrange: 340일 전 발급 → 25일 남음
    const issuedAt = daysAgo(340);

    // Act
    const needsAlert = needsReauthAlert(issuedAt);

    // Assert
    expect(needsAlert).toBe(true);
  });

  it('300일 전에 발급된 토큰은 재인증 알림이 필요하지 않다 (65일 남음)', () => {
    // Arrange: 300일 전 발급 → 65일 남음
    const issuedAt = daysAgo(300);

    // Act
    const needsAlert = needsReauthAlert(issuedAt);

    // Assert
    expect(needsAlert).toBe(false);
  });

  it('이미 만료된 토큰(370일 전)은 재인증 알림이 필요하다', () => {
    // Arrange: 370일 전 발급 → 이미 만료
    const issuedAt = daysAgo(370);

    // Act
    const needsAlert = needsReauthAlert(issuedAt);

    // Assert
    expect(needsAlert).toBe(true);
  });

  it('방금 발급된 토큰은 재인증 알림이 필요하지 않다', () => {
    // Arrange
    const issuedAt = Date.now();

    // Act
    const needsAlert = needsReauthAlert(issuedAt);

    // Assert
    expect(needsAlert).toBe(false);
  });
});

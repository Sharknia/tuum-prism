'use client';

import { AppProgressBar } from 'next-nprogress-bar';

/**
 * 글로벌 페이지 전환 Progress Bar
 * 모든 Link 네비게이션에 자동으로 로딩 표시
 */
export function ProgressBar() {
  return (
    <AppProgressBar
      color="var(--accent)"
      height="3px"
      options={{ showSpinner: false }}
    />
  );
}

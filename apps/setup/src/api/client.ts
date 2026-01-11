/**
 * Vercel API 공통 클라이언트
 *
 * 인증 및 공통 HTTP 요청 처리
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

export interface ApiClient {
  accessToken: string;
  teamId?: string;
}

let currentClient: ApiClient | null = null;

/**
 * API 클라이언트 초기화
 */
export function initClient(accessToken: string, teamId?: string): void {
  currentClient = { accessToken, teamId };
}

/**
 * 현재 클라이언트 가져오기
 */
export function getClient(): ApiClient {
  if (!currentClient) {
    throw new Error('API 클라이언트가 초기화되지 않았습니다. initClient()를 먼저 호출하세요.');
  }
  return currentClient;
}

/**
 * 인증 헤더 생성
 */
export function getAuthHeaders(): HeadersInit {
  const client = getClient();
  return {
    Authorization: `Bearer ${client.accessToken}`,
    'Content-Type': 'application/json',
  };
}

/**
 * API 요청 수행
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const client = getClient();
  const url = new URL(endpoint, VERCEL_API_BASE);

  // 팀 ID가 있으면 쿼리에 추가
  if (client.teamId) {
    url.searchParams.set('teamId', client.teamId);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `API 요청 실패: ${response.status} - ${errorData.error?.message || response.statusText}`
    );
  }

  return response.json();
}

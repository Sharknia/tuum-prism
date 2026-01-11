/**
 * Vercel 도메인 API
 *
 * 프로젝트 도메인 관리
 */

import { apiRequest } from './client';

export interface Domain {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  createdAt: number;
}

export interface DomainCheckResult {
  available: boolean;
  price?: number;
}

/**
 * 프로젝트에 도메인 추가
 */
export async function addDomain(
  projectId: string,
  domain: string
): Promise<Domain> {
  return apiRequest<Domain>(`/v10/projects/${projectId}/domains`, {
    method: 'POST',
    body: JSON.stringify({ name: domain }),
  });
}

/**
 * 프로젝트의 도메인 목록 조회
 */
export async function getDomains(projectId: string): Promise<{ domains: Domain[] }> {
  return apiRequest<{ domains: Domain[] }>(`/v9/projects/${projectId}/domains`);
}

/**
 * 도메인 삭제
 */
export async function removeDomain(
  projectId: string,
  domain: string
): Promise<void> {
  await apiRequest(`/v9/projects/${projectId}/domains/${domain}`, {
    method: 'DELETE',
  });
}

/**
 * .vercel.app 서브도메인 가용성 확인
 *
 * 실제로 도메인을 추가하지 않고 가용성만 체크
 * Note: Vercel API에 직접적인 가용성 체크 엔드포인트가 없어서
 *       도메인 조회를 시도하는 방식 사용
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<boolean> {
  const domain = `${subdomain}.vercel.app`;

  try {
    // HEAD 요청으로 도메인 존재 여부 확인
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      redirect: 'manual',
    });

    // 404면 사용 가능, 그 외는 이미 사용 중
    return response.status === 404;
  } catch {
    // 네트워크 에러 시 사용 가능으로 간주
    return true;
  }
}

/**
 * 도메인 유효성 검증
 */
export function validateDomainName(name: string): boolean {
  // 소문자, 숫자, 하이픈만 허용
  const pattern = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  
  if (!pattern.test(name)) return false;
  if (name.length < 1 || name.length > 63) return false;
  
  return true;
}

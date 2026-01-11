/**
 * Vercel 환경변수 API
 *
 * 환경변수 설정 및 조회
 */

import { apiRequest } from './client';

export interface EnvVariable {
  key: string;
  value: string;
  target: ('production' | 'preview' | 'development')[];
  type?: 'plain' | 'secret' | 'encrypted';
}

export interface EnvVariableResponse {
  id: string;
  key: string;
  value: string;
  target: string[];
  type: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * 환경변수 설정 (여러 개)
 */
export async function setEnvVariables(
  projectId: string,
  variables: EnvVariable[]
): Promise<EnvVariableResponse[]> {
  const results: EnvVariableResponse[] = [];

  for (const variable of variables) {
    const result = await apiRequest<EnvVariableResponse>(
      `/v10/projects/${projectId}/env`,
      {
        method: 'POST',
        body: JSON.stringify({
          key: variable.key,
          value: variable.value,
          target: variable.target,
          type: variable.type || 'plain',
        }),
      }
    );
    results.push(result);
  }

  return results;
}

/**
 * 환경변수 조회
 */
export async function getEnvVariables(
  projectId: string
): Promise<{ envs: EnvVariableResponse[] }> {
  return apiRequest<{ envs: EnvVariableResponse[] }>(
    `/v10/projects/${projectId}/env`
  );
}

/**
 * 환경변수 삭제
 */
export async function deleteEnvVariable(
  projectId: string,
  envId: string
): Promise<void> {
  await apiRequest(`/v10/projects/${projectId}/env/${envId}`, {
    method: 'DELETE',
  });
}

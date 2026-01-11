/**
 * Vercel 프로젝트 API
 *
 * 프로젝트 생성 및 관리
 */

import { apiRequest } from './client';

export interface CreateProjectOptions {
  name: string;
  framework: string;
  gitRepository?: {
    type: 'github';
    repo: string;
  };
}

export interface Project {
  id: string;
  name: string;
  framework: string;
  nodeVersion: string;
  accountId: string;
  updatedAt: number;
  createdAt: number;
}

/**
 * 프로젝트 생성
 */
export async function createProject(
  options: CreateProjectOptions
): Promise<Project> {
  return apiRequest<Project>('/v9/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: options.name,
      framework: options.framework,
      gitRepository: options.gitRepository,
    }),
  });
}

/**
 * 프로젝트 조회
 */
export async function getProject(projectId: string): Promise<Project> {
  return apiRequest<Project>(`/v9/projects/${projectId}`);
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(projectId: string): Promise<void> {
  await apiRequest(`/v9/projects/${projectId}`, {
    method: 'DELETE',
  });
}

/**
 * 프로젝트 목록 조회
 */
export async function listProjects(): Promise<{ projects: Project[] }> {
  return apiRequest<{ projects: Project[] }>('/v9/projects');
}

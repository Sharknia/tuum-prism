/**
 * Vercel 프로젝트 API
 *
 * 프로젝트 생성 및 조회
 */

import { apiRequest } from './client';

export interface CreateProjectOptions {
  name: string;
  framework?: string;
  gitRepository?: {
    type: 'github' | 'gitlab' | 'bitbucket';
    repo: string;
  };
}

export interface Project {
  id: string;
  name: string;
  accountId: string;
  framework: string | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * 새 프로젝트 생성
 */
export async function createProject(options: CreateProjectOptions): Promise<Project> {
  return apiRequest<Project>('/v9/projects', {
    method: 'POST',
    body: JSON.stringify({
      name: options.name,
      framework: options.framework || 'nextjs',
      ...(options.gitRepository && { gitRepository: options.gitRepository }),
    }),
  });
}

/**
 * 프로젝트 정보 조회
 */
export async function getProject(projectId: string): Promise<Project> {
  return apiRequest<Project>(`/v9/projects/${projectId}`);
}

/**
 * 프로젝트 목록 조회
 */
export async function listProjects(): Promise<{ projects: Project[] }> {
  return apiRequest<{ projects: Project[] }>('/v9/projects');
}

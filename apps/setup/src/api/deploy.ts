/**
 * Vercel 배포 API
 *
 * 파일 업로드 및 배포
 */

import { createHash } from 'crypto';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';
import { apiRequest, getAuthHeaders } from './client';

export interface DeploymentFile {
  file: string;
  sha: string;
  size: number;
  content?: Buffer;
}

export interface DeploymentOptions {
  name: string;
  files: DeploymentFile[];
  projectId?: string;
  target?: 'production' | 'preview';
  projectSettings?: {
    framework?: string;
    buildCommand?: string;
    outputDirectory?: string;
    installCommand?: string;
  };
}

export interface Deployment {
  id: string;
  url: string;
  name: string;
  state: 'READY' | 'BUILDING' | 'ERROR' | 'QUEUED' | 'CANCELED';
  readyState: string;
  createdAt: number;
}

export interface DeploymentStatus {
  id: string;
  state: string;
  readyState: string;
  url: string;
  alias?: string[];
}

// 무시할 파일/폴더 패턴
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
];

/**
 * 파일이 무시 대상인지 확인
 */
function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  
  for (const part of parts) {
    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.startsWith('*')) {
        // 와일드카드 패턴 (*.log)
        const ext = pattern.slice(1);
        if (part.endsWith(ext)) return true;
      } else {
        // 정확한 매치
        if (part === pattern || part.startsWith(pattern)) return true;
      }
    }
  }
  
  return false;
}

/**
 * 파일의 SHA1 해시 계산
 */
function calculateSha(content: Buffer): string {
  return createHash('sha1').update(content).digest('hex');
}

/**
 * 디렉토리의 모든 파일 목록 조회 (재귀)
 */
async function* walkDirectory(dir: string, baseDir: string): AsyncGenerator<{
  path: string;
  relativePath: string;
}> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    // 무시할 파일/폴더
    if (shouldIgnore(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      yield* walkDirectory(fullPath, baseDir);
    } else {
      yield { path: fullPath, relativePath };
    }
  }
}

/**
 * 배포할 파일 목록 생성
 */
export async function prepareFiles(
  sourceDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<DeploymentFile[]> {
  const files: DeploymentFile[] = [];
  
  // 먼저 파일 개수 파악
  const allPaths: { path: string; relativePath: string }[] = [];
  for await (const file of walkDirectory(sourceDir, sourceDir)) {
    allPaths.push(file);
  }

  let current = 0;
  for (const { path, relativePath } of allPaths) {
    const content = await readFile(path);
    const fileStat = await stat(path);

    files.push({
      file: relativePath,
      sha: calculateSha(content),
      size: fileStat.size,
      content,
    });

    current++;
    if (onProgress) {
      onProgress(current, allPaths.length);
    }
  }

  return files;
}

/**
 * 파일 업로드 (배치 처리)
 */
export async function uploadFiles(
  files: DeploymentFile[],
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const BATCH_SIZE = 10; // 동시 업로드 수

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        if (!file.content) return;

        const response = await fetch('https://api.vercel.com/v2/files', {
          method: 'POST',
          headers: {
            ...getAuthHeaders(),
            'x-vercel-digest': file.sha,
            'Content-Type': 'application/octet-stream',
          },
          body: file.content,
        });

        if (!response.ok && response.status !== 409) {
          // 409는 이미 존재하는 파일 (정상)
          throw new Error(`파일 업로드 실패: ${file.file}`);
        }
      })
    );

    if (onProgress) {
      onProgress(Math.min(i + BATCH_SIZE, files.length), files.length);
    }
  }
}

/**
 * 배포 생성
 */
export async function createDeployment(
  options: DeploymentOptions
): Promise<Deployment> {
  return apiRequest<Deployment>('/v13/deployments', {
    method: 'POST',
    body: JSON.stringify({
      name: options.name,
      files: options.files.map((f) => ({
        file: f.file,
        sha: f.sha,
        size: f.size,
      })),
      projectId: options.projectId,
      target: options.target || 'production',
      projectSettings: options.projectSettings || {
        framework: 'nextjs',
        buildCommand: 'cd ../.. && pnpm build --filter @tuum/blog',
        outputDirectory: '.next',
        installCommand: 'cd ../.. && pnpm install',
      },
    }),
  });
}

/**
 * 배포 상태 조회
 */
export async function getDeploymentStatus(
  deploymentId: string
): Promise<DeploymentStatus> {
  return apiRequest<DeploymentStatus>(`/v13/deployments/${deploymentId}`);
}

/**
 * 배포 완료 대기 (폴링)
 */
export async function waitForDeployment(
  deploymentId: string,
  onStatusChange?: (status: string) => void,
  timeoutMs: number = 10 * 60 * 1000 // 10분
): Promise<DeploymentStatus> {
  const startTime = Date.now();
  let lastStatus = '';

  while (Date.now() - startTime < timeoutMs) {
    const status = await getDeploymentStatus(deploymentId);

    if (status.readyState !== lastStatus) {
      lastStatus = status.readyState;
      if (onStatusChange) {
        onStatusChange(status.readyState);
      }
    }

    if (status.readyState === 'READY') {
      return status;
    }

    if (status.readyState === 'ERROR' || status.readyState === 'CANCELED') {
      throw new Error(`배포 실패: ${status.readyState}`);
    }

    // 3초 대기 후 재시도
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error('배포 타임아웃 (10분 초과)');
}

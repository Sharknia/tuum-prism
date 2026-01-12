/**
 * GitHub 소스 다운로드 API
 *
 * GitHub Archive를 다운로드하고 압축 해제
 */

import { createHash } from 'crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, relative } from 'path';
import type { DeploymentFile } from './deploy';

const REPO_URL = 'https://github.com/Sharknia/tuum-prism/archive/refs/heads/main.zip';

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
  'apps/setup',
  'apps/mobile',
  '.turbo',
  'coverage',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

/**
 * 파일이 무시 대상인지 확인
 */
function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');

  for (const part of parts) {
    for (const pattern of IGNORE_PATTERNS) {
      if (pattern.startsWith('*')) {
        const ext = pattern.slice(1);
        if (part.endsWith(ext)) return true;
      } else {
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
async function* walkDirectory(
  dir: string,
  baseDir: string
): AsyncGenerator<{ path: string; relativePath: string }> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);

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
 * GitHub Archive 다운로드 및 압축 해제
 */
export async function downloadSource(
  onProgress?: (message: string) => void
): Promise<string> {
  const tempDir = join(tmpdir(), `tuum-${Date.now()}`);
  await mkdir(tempDir, { recursive: true });

  onProgress?.('GitHub에서 소스 다운로드 중...');

  // ZIP 다운로드
  const response = await fetch(REPO_URL);
  if (!response.ok) {
    throw new Error(`GitHub 다운로드 실패: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  const zipPath = join(tempDir, 'source.zip');
  await writeFile(zipPath, Buffer.from(buffer));

  onProgress?.('압축 해제 중...');

  // Bun 내장 unzip 사용
  const proc = Bun.spawn(['unzip', '-q', zipPath, '-d', tempDir]);
  await proc.exited;

  // 압축 해제된 폴더명: tuum-prism-main
  const extractedDir = join(tempDir, 'tuum-prism-main');

  onProgress?.('소스 준비 완료');

  return extractedDir;
}

/**
 * 다운로드된 소스에서 배포 파일 목록 생성
 */
export async function prepareSourceFiles(
  sourceDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<DeploymentFile[]> {
  const files: DeploymentFile[] = [];

  // 파일 목록 수집
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
    onProgress?.(current, allPaths.length);
  }

  return files;
}

/**
 * 임시 폴더 정리
 */
export async function cleanupSource(sourceDir: string): Promise<void> {
  try {
    // sourceDir의 부모 폴더 삭제 (tuum-xxxx)
    const parentDir = join(sourceDir, '..');
    await rm(parentDir, { recursive: true, force: true });
  } catch {
    // 정리 실패해도 무시
  }
}

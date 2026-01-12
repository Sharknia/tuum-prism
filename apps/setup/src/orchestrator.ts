/**
 * 설치 오케스트레이터
 *
 * 전체 설치 프로세스를 조율합니다.
 */

import kleur from 'kleur';
import {
    createDeployment,
    createProject,
    deleteProject,
    initClient,
    setEnvVariables,
    uploadFiles,
    waitForDeployment,
    type EnvVariable
} from './api';
import { cleanupSource, downloadSource, prepareSourceFiles } from './api/source';
import { authenticate, type AuthResult } from './auth';
import { askForDomain, collectConfig, type SetupConfig } from './config';
import {
    clearScreen,
    hideProgress,
    pauseBeforeNext,
    showError,
    showInfo,
    showProgress,
    showStepHeader,
    showSuccess,
} from './ui/progress';

/**
 * 설치 단계 정의
 */
export const InstallSteps = {
  AUTH: '1/6',
  CONFIG: '2/6',
  PROJECT: '3/6',
  ENV: '4/6',
  DEPLOY: '5/6',
  COMPLETE: '6/6',
} as const;

export interface OrchestratorOptions {
  // GitHub에서 자동으로 소스를 다운로드하므로 옵션 필요 없음
}

export interface OrchestratorResult {
  success: boolean;
  blogUrl?: string;
  dashboardUrl?: string;
  error?: string;
}

/**
 * 설치 오케스트레이터 클래스
 */
export class Orchestrator {
  private authResult: AuthResult | null = null;
  private config: SetupConfig | null = null;
  private projectId: string | null = null;
  private projectName: string | null = null;
  private domainName: string | null = null;
  private sourceDir: string | null = null;

  constructor() {
    // GitHub에서 자동으로 소스를 다운로드
  }

  /**
   * 전체 설치 프로세스 실행
   */
  async run(): Promise<OrchestratorResult> {
    clearScreen();
    console.log(kleur.cyan().bold('\n🚀 Tuum Blog 설치를 시작합니다!\n'));
    await pauseBeforeNext(500);

    try {
      // 1. 인증
      await this.authenticateUser();
      await pauseBeforeNext(800);

      // 2. 설정 수집
      await this.collectConfiguration();
      await pauseBeforeNext(800);

      // 3. 프로젝트 생성 (도메인 재시도 루프 포함)
      await this.createVercelProject();
      await pauseBeforeNext(800);

      // 4. 환경변수 설정
      await this.setEnvironmentVariables();
      await pauseBeforeNext(800);

      // 5. 배포
      await this.deployToVercel();
      await pauseBeforeNext(800);

      // 6. 완료
      await this.showComplete();

      const domain = this.domainName || '';
      return {
        success: true,
        blogUrl: `https://${domain}.vercel.app`,
        dashboardUrl: `https://vercel.com/${this.authResult?.username}/${this.projectName}`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      hideProgress();
      showError('Error', errorMessage);

      // 배포 실패 시 생성된 프로젝트 삭제
      if (this.projectId) {
        try {
          showInfo('프로젝트 정리 중...');
          await deleteProject(this.projectId);
          showInfo('실패한 프로젝트가 삭제되었습니다.');
        } catch {
          // 삭제 실패 시 무시
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 1. Vercel 인증 (PAT 방식)
   */
  private async authenticateUser(): Promise<void> {
    showStepHeader(InstallSteps.AUTH, 'Vercel 인증');

    this.authResult = await authenticate();
    initClient(this.authResult.accessToken);

    showSuccess(InstallSteps.AUTH, `Vercel 인증 완료 (${this.authResult.email})`);
  }

  /**
   * 2. 설정 수집 (Notion, 블로그, 도메인, 소셜)
   */
  private async collectConfiguration(): Promise<void> {
    showStepHeader(InstallSteps.CONFIG, '설정 정보 수집');

    this.config = await collectConfig();

    showSuccess(InstallSteps.CONFIG, '설정 정보 수집 완료');
  }

  /**
   * 3. Vercel 프로젝트 생성 + 도메인 설정 (재시도 로직)
   */
  /**
   * 3. Vercel 프로젝트 생성 (도메인 재시도 로직)
   */
  private async createVercelProject(): Promise<void> {
    if (!this.config) throw new Error('설정이 필요합니다');

    let defaultDomain = this.config.blog.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);

    let retryMessage: string | undefined;

    // 도메인 충돌 시 재시도 루프
    while (true) {
      showStepHeader(InstallSteps.PROJECT, 'Vercel 프로젝트 생성');

      // 도메인 입력 요청 (이것이 프로젝트 이름이 됩니다)
      const domain = await askForDomain(retryMessage ? undefined : defaultDomain, retryMessage);
      this.projectName = domain;
      this.domainName = domain;

      try {
        // 프로젝트 생성 시도
        showProgress(InstallSteps.PROJECT, `${domain} 프로젝트 생성 중...`);
        const project = await createProject({
          name: this.projectName,
          framework: 'nextjs',
        });
        
        // 성공 시: Vercel이 자동으로 {name}.vercel.app 할당했음
        this.projectId = project.id;
        
        showSuccess(InstallSteps.PROJECT, `프로젝트 생성 완료: ${this.projectName}`);
        break; // 성공 시 루프 탈출

      } catch (error: any) {
        hideProgress();
        const msg = String(error?.message || '');

        // 이름 충돌 (409) 핸들링
        if (msg.includes('409') || msg.includes('App name') || msg.includes('already used')) {
          retryMessage = `⚠️ 이름 '${this.projectName}'(은)는 이미 사용 중입니다. 다른 이름을 입력해주세요.`;
          await pauseBeforeNext(1000);
        } else {
          // 그 외 에러는 throw
          throw error;
        }
      }
    }
  }

  /**
   * 4. 환경변수 설정
   */
  private async setEnvironmentVariables(): Promise<void> {
    if (!this.config || !this.projectId) throw new Error('설정과 프로젝트 ID가 필요합니다');

    showStepHeader(InstallSteps.ENV, '환경변수 설정');
    showProgress(InstallSteps.ENV, '환경변수 설정 중...');

    const envVars: EnvVariable[] = [
      // Notion
      { key: 'NOTION_API_KEY', value: this.config.notion.apiKey, target: ['production', 'preview'] },
      { key: 'NOTION_DATABASE_ID', value: this.config.notion.databaseId, target: ['production', 'preview'] },

      // Blog
      { key: 'NEXT_PUBLIC_BASE_URL', value: `https://${this.projectName}.vercel.app`, target: ['production', 'preview'] },
      { key: 'ENABLE_EXPERIMENTAL_COREPACK', value: '1', target: ['production', 'preview'] },
      { key: 'NEXT_PUBLIC_SITE_TITLE', value: this.config.blog.title, target: ['production', 'preview'] },
      { key: 'NEXT_PUBLIC_OWNER_NAME', value: this.config.blog.ownerName, target: ['production', 'preview'] },
    ];

    // 선택 필드 추가
    if (this.config.blog.ownerDesc) {
      envVars.push({ key: 'NEXT_PUBLIC_OWNER_DESC', value: this.config.blog.ownerDesc, target: ['production', 'preview'] });
    }

    // 소셜 링크
    if (this.config.social.github) {
      envVars.push({ key: 'NEXT_PUBLIC_SOCIAL_GITHUB', value: this.config.social.github, target: ['production', 'preview'] });
    }
    if (this.config.social.linkedin) {
      envVars.push({ key: 'NEXT_PUBLIC_SOCIAL_LINKEDIN', value: this.config.social.linkedin, target: ['production', 'preview'] });
    }
    if (this.config.social.threads) {
      envVars.push({ key: 'NEXT_PUBLIC_SOCIAL_THREADS', value: this.config.social.threads, target: ['production', 'preview'] });
    }
    if (this.config.social.x) {
      envVars.push({ key: 'NEXT_PUBLIC_SOCIAL_X', value: this.config.social.x, target: ['production', 'preview'] });
    }
    if (this.config.social.email) {
      envVars.push({ key: 'NEXT_PUBLIC_SOCIAL_EMAIL', value: this.config.social.email, target: ['production', 'preview'] });
    }

    await setEnvVariables(this.projectId, envVars);

    showSuccess(InstallSteps.ENV, `환경변수 ${envVars.length}개 설정 완료`);
  }

  /**
   * 5. Vercel에 직접 배포
   */
  private async deployToVercel(): Promise<void> {
    if (!this.config || !this.projectId) throw new Error('설정과 프로젝트 ID가 필요합니다');

    showStepHeader(InstallSteps.DEPLOY, 'Vercel 배포');

    // GitHub에서 소스 다운로드
    showProgress(InstallSteps.DEPLOY, 'GitHub에서 소스 다운로드 중...');
    this.sourceDir = await downloadSource((message) => {
      showProgress(InstallSteps.DEPLOY, message);
    });

    // 파일 준비
    showProgress(InstallSteps.DEPLOY, '파일 준비 중...');
    const files = await prepareSourceFiles(this.sourceDir, (current, total) => {
      showProgress(InstallSteps.DEPLOY, `파일 준비 중... (${current}/${total})`);
    });

    showInfo(`${files.length}개 파일 준비 완료`);

    // 파일 업로드
    showProgress(InstallSteps.DEPLOY, '파일 업로드 중...');
    await uploadFiles(files, (current, total) => {
      showProgress(InstallSteps.DEPLOY, `파일 업로드 중... (${current}/${total})`);
    });

    // 배포 생성
    showProgress(InstallSteps.DEPLOY, '배포 생성 중...');
    const deployment = await createDeployment({
      name: this.projectName!,
      files: files.map(f => ({ file: f.file, sha: f.sha, size: f.size })),
      projectId: this.projectId,
      target: 'production',
    });

    // 배포 완료 대기
    showProgress(InstallSteps.DEPLOY, '빌드 중... (최대 10분 소요)');
    await waitForDeployment(deployment.id, (status) => {
      const statusMap: Record<string, string> = {
        QUEUED: '대기 중...',
        BUILDING: '빌드 중...',
        READY: '완료!',
        ERROR: '오류 발생',
        CANCELED: '취소됨',
      };
      showProgress(InstallSteps.DEPLOY, statusMap[status] || status);
    });

    // 임시 폴더 정리
    if (this.sourceDir) {
      await cleanupSource(this.sourceDir);
    }

    showSuccess(InstallSteps.DEPLOY, '배포 완료!');
  }

  /**
   * 6. 완료 화면
   */
  private async showComplete(): Promise<void> {
    showStepHeader(InstallSteps.COMPLETE, '설치 완료');

    console.log(kleur.green().bold('🎉 Tuum Blog 설치가 완료되었습니다!\n'));

    const domain = this.domainName || '';
    const blogUrl = `https://${domain}.vercel.app`;
    const dashboardUrl = `https://vercel.com/${this.authResult?.username}/${this.projectName}`;

    console.log(kleur.white('🌐 블로그 URL:'));
    console.log(kleur.cyan().bold(`   ${blogUrl}\n`));

    console.log(kleur.white('📊 Vercel 대시보드:'));
    console.log(kleur.dim(`   ${dashboardUrl}\n`));

    console.log(kleur.white('📋 다음 단계:'));
    console.log(kleur.dim('   1. 블로그에 접속하여 확인'));
    console.log(kleur.dim('   2. Notion에 글 작성'));
    console.log(kleur.dim('   3. 블로그에서 글 확인!\n'));

    showSuccess(InstallSteps.COMPLETE, '모든 설정 완료');
  }
}

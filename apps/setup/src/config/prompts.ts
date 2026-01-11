/**
 * 대화형 프롬프트
 *
 * 사용자로부터 설정값을 수집합니다.
 */

import kleur from 'kleur';
import prompts from 'prompts';
import { checkSubdomainAvailability, validateDomainName } from '../api/domain';
import type { BlogConfig, NotionConfig, SetupConfig, SocialConfig } from './types';
import {
    validateDatabaseId,
    validateEmail,
    validateNotionApiKey,
    validateUrl,
} from './validation';

/**
 * Notion 설정 수집
 */
export async function collectNotionConfig(): Promise<NotionConfig> {
  console.log(kleur.cyan().bold('📚 Notion 설정\n'));

  console.log(kleur.white('Notion API Key와 Database ID가 필요합니다.\n'));

  console.log(kleur.yellow('📋 API Key 발급 방법:'));
  console.log(kleur.dim('   1. https://www.notion.so/my-integrations 접속'));
  console.log(kleur.dim('   2. "+ New integration" 클릭'));
  console.log(kleur.dim('   3. 이름 입력 (예: tuum-blog)'));
  console.log(kleur.dim('   4. 생성 후 "Internal Integration Secret" 복사\n'));

  console.log(kleur.yellow('📋 Database ID 확인 방법:'));
  console.log(kleur.dim('   Notion 페이지 URL에서 추출:'));
  console.log(kleur.dim('   https://notion.so/[DATABASE_ID]?v=...\n'));

  console.log(kleur.white('📖 상세 가이드:'));
  console.log(kleur.cyan('   https://github.com/sharknia/tuum-prism/blob/main/docs/NOTION_SETUP.md\n'));

  const response = await prompts([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Notion API Key',
      validate: (value) =>
        validateNotionApiKey(value) ? true : 'secret_ 또는 ntn_ 로 시작하는 키를 입력하세요',
    },
    {
      type: 'text',
      name: 'databaseId',
      message: 'Notion Database ID',
      validate: (value) =>
        validateDatabaseId(value) ? true : '유효한 Database ID를 입력하세요 (UUID 형식)',
    },
  ]);

  if (!response.apiKey || !response.databaseId) {
    throw new Error('Notion 설정이 취소되었습니다');
  }

  return {
    apiKey: response.apiKey,
    databaseId: response.databaseId,
  };
}

/**
 * 블로그 설정 수집 (도메인 포함)
 */
export async function collectBlogConfig(): Promise<{ blog: BlogConfig; domain: string }> {
  console.log(kleur.cyan().bold('\n📝 블로그 설정\n'));

  console.log(kleur.dim('블로그의 기본 정보를 설정합니다.'));
  console.log(kleur.dim('나중에 site.config.ts 에서 수정할 수 있습니다.\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'title',
      message: '블로그 제목',
      initial: 'My Tech Blog',
    },
    {
      type: 'text',
      name: 'ownerName',
      message: '작성자 이름 (닉네임)',
      initial: '@developer',
    },
    {
      type: 'text',
      name: 'ownerDesc',
      message: '작성자 한 줄 소개 (선택, Enter로 건너뛰기)',
    },
    {
      type: 'text',
      name: 'domain',
      message: 'Vercel 도메인 (예: my-blog)',
      hint: '→ my-blog.vercel.app',
      validate: async (value) => {
        if (!value) return '도메인을 입력하세요';
        if (!validateDomainName(value)) {
          return '소문자, 숫자, 하이픈만 사용 가능합니다';
        }
        const available = await checkSubdomainAvailability(value);
        return available ? true : '이미 사용 중인 도메인입니다';
      },
    },
  ]);

  if (!response.title || !response.ownerName || !response.domain) {
    throw new Error('블로그 설정이 취소되었습니다');
  }

  return {
    blog: {
      title: response.title,
      ownerName: response.ownerName,
      ownerDesc: response.ownerDesc || undefined,
    },
    domain: response.domain,
  };
}

/**
 * 소셜 링크 수집
 */
export async function collectSocialConfig(): Promise<SocialConfig> {
  console.log(kleur.cyan().bold('\n🔗 소셜 링크 (선택)\n'));

  console.log(kleur.dim('비워두면 해당 아이콘이 블로그에 표시되지 않습니다.'));
  console.log(kleur.dim('모두 건너뛰려면 Enter만 누르세요.\n'));

  const response = await prompts([
    {
      type: 'text',
      name: 'github',
      message: 'GitHub 프로필 URL',
      hint: 'https://github.com/username',
      validate: (value) => (validateUrl(value) ? true : '유효한 URL을 입력하세요'),
    },
    {
      type: 'text',
      name: 'linkedin',
      message: 'LinkedIn 프로필 URL',
      hint: 'https://linkedin.com/in/username',
      validate: (value) => (validateUrl(value) ? true : '유효한 URL을 입력하세요'),
    },
    {
      type: 'text',
      name: 'threads',
      message: 'Threads 프로필 URL',
      hint: 'https://threads.net/@username',
      validate: (value) => (validateUrl(value) ? true : '유효한 URL을 입력하세요'),
    },
    {
      type: 'text',
      name: 'x',
      message: 'X (Twitter) 프로필 URL',
      hint: 'https://x.com/username',
      validate: (value) => (validateUrl(value) ? true : '유효한 URL을 입력하세요'),
    },
    {
      type: 'text',
      name: 'email',
      message: '이메일 주소',
      hint: 'you@example.com',
      validate: (value) => (validateEmail(value) ? true : '유효한 이메일을 입력하세요'),
    },
  ]);

  return {
    github: response.github || undefined,
    linkedin: response.linkedin || undefined,
    threads: response.threads || undefined,
    x: response.x || undefined,
    email: response.email || undefined,
  };
}

/**
 * 전체 설정 수집
 */
export async function collectConfig(): Promise<SetupConfig> {
  const notion = await collectNotionConfig();
  const { blog, domain } = await collectBlogConfig();
  const social = await collectSocialConfig();

  return { notion, blog, social, domain };
}

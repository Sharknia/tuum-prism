/**
 * 설정 타입 정의
 */

export interface NotionConfig {
  apiKey: string;
  databaseId: string;
}

export interface BlogConfig {
  title: string;
  description?: string;
  ownerName: string;
  ownerDesc?: string;
  ownerAvatar?: string;
}

export interface SocialConfig {
  github?: string;
  email?: string;
  linkedin?: string;
  x?: string;
  threads?: string;
}

export interface SetupConfig {
  notion: NotionConfig;
  blog: BlogConfig;
  social: SocialConfig;
  domain: string;
  siteUrl?: string;
}

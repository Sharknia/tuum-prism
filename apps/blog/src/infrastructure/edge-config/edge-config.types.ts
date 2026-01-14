export interface LinkedInTokens {
  accessToken: string;
  refreshToken: string;
  issuedAt: number;
}

export interface EdgeConfigUpdateItem {
  operation: 'upsert' | 'delete';
  key: string;
  value?: string | number;
}

export interface EdgeConfigUpdateRequest {
  items: EdgeConfigUpdateItem[];
}

export interface EdgeConfigReadResponse {
  LINKEDIN_ACCESS_TOKEN?: string;
  LINKEDIN_REFRESH_TOKEN?: string;
  LINKEDIN_TOKEN_ISSUED_AT?: number;
}

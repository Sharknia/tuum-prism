import type {
  EdgeConfigReadResponse,
  EdgeConfigUpdateItem,
  LinkedInTokens,
} from './edge-config.types';

const VERCEL_API_BASE = 'https://api.vercel.com/v1/edge-config';

export class EdgeConfigClient {
  private readonly apiUrl: string;

  constructor(
    private readonly edgeConfigId: string,
    private readonly vercelToken: string
  ) {
    this.apiUrl = `${VERCEL_API_BASE}/${edgeConfigId}`;
  }

  async getLinkedInTokens(): Promise<LinkedInTokens | null> {
    const response = await fetch(`${this.apiUrl}/items`, {
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Edge Config 읽기 실패: ${response.status} ${response.statusText}`
      );
    }

    const data: EdgeConfigReadResponse = await response.json();

    if (!data.LINKEDIN_ACCESS_TOKEN || !data.LINKEDIN_REFRESH_TOKEN) {
      return null;
    }

    return {
      accessToken: data.LINKEDIN_ACCESS_TOKEN,
      refreshToken: data.LINKEDIN_REFRESH_TOKEN,
      issuedAt: data.LINKEDIN_TOKEN_ISSUED_AT ?? Date.now(),
    };
  }

  async updateLinkedInTokens(tokens: Partial<LinkedInTokens>): Promise<void> {
    const items: EdgeConfigUpdateItem[] = [];

    if (tokens.accessToken !== undefined) {
      items.push({
        operation: 'upsert',
        key: 'LINKEDIN_ACCESS_TOKEN',
        value: tokens.accessToken,
      });
    }

    if (tokens.refreshToken !== undefined) {
      items.push({
        operation: 'upsert',
        key: 'LINKEDIN_REFRESH_TOKEN',
        value: tokens.refreshToken,
      });
    }

    if (tokens.issuedAt !== undefined) {
      items.push({
        operation: 'upsert',
        key: 'LINKEDIN_TOKEN_ISSUED_AT',
        value: tokens.issuedAt,
      });
    }

    if (items.length === 0) {
      return;
    }

    const response = await fetch(`${this.apiUrl}/items`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${this.vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error(
        `Edge Config 업데이트 실패: ${response.status} ${response.statusText}`
      );
    }
  }
}

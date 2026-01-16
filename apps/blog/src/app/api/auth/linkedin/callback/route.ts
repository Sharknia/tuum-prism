import { cookies } from 'next/headers';

import { EdgeConfigClient } from '@/infrastructure/edge-config';

const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const STATE_COOKIE_NAME = 'linkedin_oauth_state';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE_NAME)?.value;

  cookieStore.delete(STATE_COOKIE_NAME);

  if (!state || !savedState || state !== savedState) {
    console.error('OAuth state 불일치 - CSRF 공격 가능성');
    return new Response('잘못된 요청입니다', { status: 400 });
  }

  if (!code) {
    return new Response('Authorization code가 누락되었습니다', { status: 400 });
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const vercelToken = process.env.VERCEL_TOKEN;
  const edgeConfigId = process.env.EDGE_CONFIG_ID;

  if (!clientId || !clientSecret || !baseUrl || !vercelToken || !edgeConfigId) {
    console.error('LinkedIn OAuth 환경변수가 설정되지 않았습니다');
    return new Response('서버 설정 오류', { status: 500 });
  }

  try {
    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${baseUrl}/api/auth/linkedin/callback`,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('LinkedIn 토큰 교환 실패:', error);
      return new Response('토큰 교환에 실패했습니다', { status: 500 });
    }

    const { access_token, refresh_token } = await tokenResponse.json();

    const edgeConfig = new EdgeConfigClient(edgeConfigId, vercelToken);

    await edgeConfig.updateLinkedInTokens({
      accessToken: access_token,
      refreshToken: refresh_token,
      issuedAt: Date.now(),
    });

    return new Response(
      `<!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>LinkedIn 연동 완료</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #0a66c2; margin-bottom: 1rem; }
            p { color: #666; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✅ LinkedIn 연동 완료!</h1>
            <p>토큰이 성공적으로 저장되었습니다.<br>이 창을 닫으셔도 됩니다.</p>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error) {
    console.error('OAuth Callback 오류:', error);
    return new Response('내부 서버 오류', { status: 500 });
  }
}

import { NextResponse } from 'next/server';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_SCOPES = 'openid profile w_member_social';

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!clientId || !baseUrl) {
    return NextResponse.json(
      { error: 'LinkedIn OAuth가 설정되지 않았습니다' },
      { status: 500 }
    );
  }

  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: LINKEDIN_SCOPES,
  });

  return NextResponse.redirect(`${LINKEDIN_AUTH_URL}?${params}`);
}

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_SCOPES = 'openid profile w_member_social';
const STATE_COOKIE_NAME = 'linkedin_oauth_state';
const STATE_COOKIE_MAX_AGE = 300;

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!clientId || !baseUrl) {
    return NextResponse.json(
      { error: 'LinkedIn OAuth가 설정되지 않았습니다' },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_COOKIE_MAX_AGE,
    path: '/',
  });

  const redirectUri = `${baseUrl}/api/auth/linkedin/callback`;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: LINKEDIN_SCOPES,
    state,
  });

  return NextResponse.redirect(`${LINKEDIN_AUTH_URL}?${params}`);
}

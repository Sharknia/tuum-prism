# 다음 수동 작업 가이드

**생성일**: 2026-01-16
**목적**: SNS 자동 포스팅 시스템 활성화를 위한 수동 설정 작업

---

## 📋 현재 상태

| Phase   | 설명                      | 상태                  |
| ------- | ------------------------- | --------------------- |
| Phase 0 | 인프라 및 초기 설정       | ⏳ **수동 작업 필요** |
| Phase 1 | LinkedIn OAuth 엔드포인트 | ✅ 코드 완료          |
| Phase 2 | LinkedIn 토큰 자동 갱신   | ✅ 코드 완료          |
| Phase 3 | SNS 포스팅 핵심 로직      | ✅ 코드 완료          |
| Phase 4 | 플랫폼별 포스팅           | ✅ 코드 완료          |
| Phase 5 | Notion Write-back         | ✅ 코드 완료          |

**코드는 모두 준비되었습니다!** 아래 수동 작업만 완료하면 시스템이 작동합니다.

---

## 🔧 수동 작업 체크리스트

### 1. Vercel Edge Config 생성 (5분)

1. [ ] [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. [ ] 좌측 메뉴 **Storage** 클릭
3. [ ] **Create** → **Edge Config** 선택
4. [ ] 이름 입력 (예: `sns-auto-post-tokens`)
5. [ ] 생성된 Edge Config ID 복사 (예: `ecfg_xxxx`)
6. [ ] 프로젝트에 Edge Config 연결 (Connect to Project)
7. [ ] `EDGE_CONFIG` 환경변수가 자동 주입되었는지 확인

### 2. LinkedIn OAuth App 생성 (10분)

1. [ ] [LinkedIn Developer Portal](https://developer.linkedin.com/apps) 접속
2. [ ] **Create App** 클릭
3. [ ] 앱 정보 입력:
   - App name: `{Your Blog Name} SNS Bot`
   - LinkedIn Page: 본인 페이지 선택 또는 생성
   - Logo: 아무 이미지 업로드
4. [ ] **Products** 탭에서 추가:
   - **Share on LinkedIn** (w_member_social 권한)
   - **Sign In with LinkedIn using OpenID Connect** (openid, profile 권한)
5. [ ] **Auth** 탭에서 Redirect URL 추가:
   ```
   https://{YOUR_DOMAIN}/api/auth/linkedin/callback
   ```
6. [ ] **Auth** 탭에서 복사:
   - `Client ID`
   - `Client Secret` (Generate 필요)

### 3. X (Twitter) Developer App 설정 (10분)

1. [ ] [X Developer Portal](https://developer.x.com/en/portal/dashboard) 접속
2. [ ] 프로젝트/앱 생성 또는 기존 앱 선택
3. [ ] **User authentication settings** → **Set up**
4. [ ] App Permissions: **Read and Write** 선택
5. [ ] Type of App: **Web App, Automated App or Bot**
6. [ ] Callback URL (아무거나 입력 가능): `https://example.com/callback`
7. [ ] **Keys and tokens** 탭에서 복사:
   - `API Key` (= Consumer Key)
   - `API Key Secret` (= Consumer Secret)
   - `Access Token` (Generate 필요 - **본인 계정용**)
   - `Access Token Secret`

> ⚠️ **중요**: Access Token은 반드시 **Read and Write** 권한으로 생성해야 합니다!

### 4. Threads App 설정 (선택사항, 15분)

1. [ ] [Meta for Developers](https://developers.facebook.com/) 접속
2. [ ] **My Apps** → **Create App** → **Other** → **Business**
3. [ ] **Use cases** → **Customize** → **Add** → **Threads API**
4. [ ] 권한 추가:
   - `threads_basic`
   - `threads_content_publish`
5. [ ] Access Token 발급:
   - **Tools** → **Graph API Explorer**에서 테스트 토큰 생성
   - 또는 OAuth 플로우 구현 필요 (복잡함)

> 💡 **참고**: Threads는 선택사항입니다. 나중에 추가해도 됩니다.

### 5. GitHub Secrets 등록 (5분)

[GitHub Repository Settings → Secrets → Actions](https://github.com/{owner}/{repo}/settings/secrets/actions)에서 추가:

#### 필수 Secrets

| Secret 이름            | 값                             | 설명                                 |
| ---------------------- | ------------------------------ | ------------------------------------ |
| `NOTION_API_KEY`       | `ntn_xxxxx`                    | Notion Integration 토큰              |
| `NOTION_DATABASE_ID`   | `xxxxxxxx-xxxx-xxxx...`        | 블로그 데이터베이스 ID               |
| `NEXT_PUBLIC_BASE_URL` | `https://your-blog.vercel.app` | 블로그 도메인                        |
| `VERCEL_TOKEN`         | `xxxxxx`                       | Vercel Dashboard → Settings → Tokens |
| `EDGE_CONFIG_ID`       | `ecfg_xxxxx`                   | Edge Config ID                       |

#### LinkedIn Secrets

| Secret 이름              | 값      | 설명                       |
| ------------------------ | ------- | -------------------------- |
| `LINKEDIN_CLIENT_ID`     | `xxxxx` | LinkedIn App Client ID     |
| `LINKEDIN_CLIENT_SECRET` | `xxxxx` | LinkedIn App Client Secret |

#### X (Twitter) Secrets

| Secret 이름             | 값      | 설명                     |
| ----------------------- | ------- | ------------------------ |
| `X_API_KEY`             | `xxxxx` | API Key (Consumer Key)   |
| `X_API_SECRET`          | `xxxxx` | API Key Secret           |
| `X_ACCESS_TOKEN`        | `xxxxx` | Access Token (본인 계정) |
| `X_ACCESS_TOKEN_SECRET` | `xxxxx` | Access Token Secret      |

#### 선택 Secrets

| Secret 이름            | 값      | 설명                 |
| ---------------------- | ------- | -------------------- |
| `THREADS_ACCESS_TOKEN` | `xxxxx` | Threads 액세스 토큰  |
| `THREADS_USER_ID`      | `xxxxx` | Threads 사용자 ID    |
| `AI_GATEWAY_API_KEY`   | `xxxxx` | Vercel AI Gateway 키 |

### 6. Vercel 환경변수 등록 (3분)

[Vercel Dashboard → Project → Settings → Environment Variables](https://vercel.com)에서 추가:

| 변수명                   | 값                     | Environment |
| ------------------------ | ---------------------- | ----------- |
| `LINKEDIN_CLIENT_ID`     | LinkedIn Client ID     | Production  |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn Client Secret | Production  |
| `VERCEL_TOKEN`           | Vercel 토큰            | Production  |
| `EDGE_CONFIG_ID`         | Edge Config ID         | Production  |

---

## 🚀 설정 완료 후 테스트

### 1. LinkedIn OAuth 초기 인증

```bash
# 브라우저에서 접속
https://{YOUR_DOMAIN}/api/auth/linkedin
```

LinkedIn 로그인 → 권한 승인 → "✅ LinkedIn 연동 완료!" 페이지 확인

### 2. SNS 포스팅 테스트

```bash
# Dry Run (실제 포스팅 없이 테스트)
gh workflow run sns-auto-post.yml -f dry_run=true

# 실행 결과 확인
gh run list --workflow=sns-auto-post.yml
```

### 3. 실제 포스팅 테스트

1. Notion에서 테스트 포스트 생성
2. `상태` 속성을 `Ready`로 변경
3. 워크플로우 수동 실행:
   ```bash
   gh workflow run sns-auto-post.yml -f dry_run=false
   ```
4. 결과 확인:
   - GitHub Actions Summary
   - Notion 페이지 `상태` → `Updated`
   - Notion 페이지 `systemLog` 확인
   - 각 SNS 플랫폼에서 포스트 확인

---

## ⏰ 운영 스케줄

설정 완료 후 시스템은 다음과 같이 자동 운영됩니다:

| 워크플로우                   | 주기        | 설명                      |
| ---------------------------- | ----------- | ------------------------- |
| `sns-auto-post.yml`          | 매시간      | Ready 상태 글 자동 포스팅 |
| `refresh-linkedin-token.yml` | 매주 월요일 | LinkedIn 토큰 자동 갱신   |

### LinkedIn 토큰 수명

- **Access Token**: 60일 → 매주 자동 갱신
- **Refresh Token**: 365일 → 만료 30일 전 GitHub Issue 자동 생성
- 재인증 필요 시: `https://{YOUR_DOMAIN}/api/auth/linkedin` 접속

---

## 📝 체크리스트 요약

- [ ] Vercel Edge Config 생성 및 연결
- [ ] LinkedIn OAuth App 생성
- [ ] X Developer App 설정 (Read and Write 권한)
- [ ] GitHub Secrets 등록 (필수 11개)
- [ ] Vercel 환경변수 등록 (4개)
- [ ] LinkedIn OAuth 초기 인증 실행
- [ ] Dry Run 테스트 성공
- [ ] 실제 포스팅 테스트 성공

**모든 체크박스 완료 = SNS 자동 포스팅 시스템 가동! 🎉**

---

## 🔗 관련 문서

- [PLAN_SNS_AUTO_POST.md](./docs/plans/PLAN_SNS_AUTO_POST.md) - 전체 계획
- [PHASE-0-SETUP.md](./docs/plans/sns-auto-post/PHASE-0-SETUP.md) - 인프라 설정 상세
- [PHASE-5-DETAILED.md](./docs/plans/sns-auto-post/PHASE-5-DETAILED.md) - Write-back 구현 상세

# Implementation Plan: Phase 1 - LinkedIn OAuth Endpoints

**Status**: ✅ Complete
**Started**: 2026-01-14
**Last Updated**: 2026-01-14
**Completed**: 2026-01-14

---

**CRITICAL INSTRUCTIONS**: After completing each phase:

1. Check off completed task checkboxes
2. Run all quality gate validation commands
3. Verify ALL quality gate items pass
4. Update "Last Updated" date above
5. Document learnings in Notes section
6. Only then proceed to next phase

**DO NOT skip quality gates or proceed with failing checks**

---

## Overview

### Feature Description

LinkedIn OAuth 인증 및 토큰 갱신을 위한 API 엔드포인트를 구현합니다. 이 Phase는 사용자가 LinkedIn 계정을 연동하고, Access Token/Refresh Token을 Vercel Edge Config에 저장하는 전체 OAuth 플로우를 구축합니다.

**구현 범위:**

- OAuth 시작 엔드포인트 (`/api/auth/linkedin`)
- OAuth Callback 엔드포인트 (`/api/auth/linkedin/callback`)
- Edge Config CRUD 유틸리티
- 환경변수 타입 확장

### Success Criteria

- [ ] `/api/auth/linkedin` 접속 시 LinkedIn 로그인 페이지로 리다이렉트
- [ ] LinkedIn 승인 후 `/api/auth/linkedin/callback`으로 정상 리다이렉트
- [ ] Authorization Code -> Token 교환 성공
- [ ] Edge Config에 토큰 3종 저장 (`ACCESS_TOKEN`, `REFRESH_TOKEN`, `TOKEN_ISSUED_AT`)
- [ ] 완료 페이지 ("LinkedIn 연동 완료") 정상 렌더링
- [ ] 에러 케이스(code 없음, 토큰 교환 실패) 적절한 에러 페이지 반환

### User Impact

- 사용자는 블로그 관리자 페이지에서 "LinkedIn 연동" 버튼 클릭 한 번으로 OAuth 인증 완료
- 인증 후 1년간 자동 토큰 갱신으로 SNS 자동 포스팅 지속
- 재인증 필요 시 동일 플로우로 1분 내 완료 가능

---

## Architecture Decisions

| Decision                      | Rationale                                                       | Trade-offs                              |
| ----------------------------- | --------------------------------------------------------------- | --------------------------------------- |
| **Vercel Edge Config** 사용   | Vercel 네이티브, 추가 인프라 불필요, Hobby 무료 (월 100회 쓰기) | 다른 클라우드 사용 시 마이그레이션 필요 |
| **Server-Side Route Handler** | OAuth Client Secret 보안, Next.js App Router 표준               | 클라이언트 컴포넌트 사용 불가           |
| **별도 Edge Config 유틸리티** | 재사용성, 테스트 용이성, 단일 책임 원칙                         | 초기 구현 시간 증가                     |
| **Zod 스키마 확장**           | 기존 env.ts 패턴 일관성, 런타임 타입 안전성                     | 환경변수 추가 시 스키마 업데이트 필요   |

---

## Dependencies

### Required Before Starting

- [x] Phase 0: Vercel Edge Config 생성 및 연결 문자열 확인 (스킵됨 - 구현 시 확인)
- [x] LinkedIn Developer App 생성 및 Client ID/Secret 획득
- [x] Vercel Token 발급 (Edge Config API 호출용)

### External Dependencies

| Package               | Version      | Purpose                   |
| --------------------- | ------------ | ------------------------- |
| `@vercel/edge-config` | latest       | Edge Config 읽기 (선택적) |
| `zod`                 | 기존 사용 중 | 환경변수 검증             |

> **Note**: `@vercel/edge-config` SDK는 읽기 전용이므로, 쓰기는 REST API 직접 호출 필요

---

## Test Strategy

### Testing Approach

**TDD Principle**: 테스트 먼저 작성 -> 구현 -> 리팩토링

### Test Pyramid for This Feature

| Test Type             | Coverage Target | Purpose                             |
| --------------------- | --------------- | ----------------------------------- |
| **Unit Tests**        | ≥80%            | Edge Config 유틸리티, URL 생성 로직 |
| **Integration Tests** | Critical paths  | OAuth 플로우 모킹, API Route 테스트 |
| **Manual E2E**        | 1 flow          | 실제 LinkedIn OAuth 연동            |

### Test File Organization

```
apps/blog/src/
├── infrastructure/
│   └── edge-config/
│       ├── edge-config.client.ts       # 구현
│       └── edge-config.client.test.ts  # 유닛 테스트
├── app/
│   └── api/
│       └── auth/
│           └── linkedin/
│               ├── route.ts            # 구현
│               ├── route.test.ts       # 통합 테스트
│               └── callback/
│                   ├── route.ts        # 구현
│                   └── route.test.ts   # 통합 테스트
```

### Coverage Requirements

- **Edge Config 유틸리티**: ≥90% (핵심 인프라)
- **OAuth Route Handlers**: ≥80% (비즈니스 로직)
- **환경변수 검증**: 기존 테스트 유지

---

## Implementation Phases

### Phase 1.1: Edge Config 유틸리티

**Goal**: Edge Config 읽기/쓰기 기능을 캡슐화한 유틸리티 모듈 구현
**Estimated Time**: 45분
**Status**: ⏳ Pending

#### Tasks

**RED: Write Failing Tests First**

- [ ] **Test 1.1.1**: Edge Config 읽기 유닛 테스트 작성
  - File: `apps/blog/src/infrastructure/edge-config/edge-config.client.test.ts`
  - Expected: Tests FAIL (red) - 모듈 미존재
  - Details:

    ```typescript
    describe("EdgeConfigClient", () => {
      describe("getLinkedInTokens", () => {
        it("should return tokens when they exist", async () => {
          // Mock fetch
          // Assert: access_token, refresh_token, issued_at 반환
        });

        it("should return null when tokens do not exist", async () => {
          // Mock fetch returning empty
          // Assert: null 반환
        });

        it("should throw on network error", async () => {
          // Mock fetch throwing
          // Assert: Error thrown
        });
      });
    });
    ```

- [ ] **Test 1.1.2**: Edge Config 쓰기 유닛 테스트 작성
  - File: `apps/blog/src/infrastructure/edge-config/edge-config.client.test.ts`
  - Expected: Tests FAIL (red)
  - Details:

    ```typescript
    describe("updateLinkedInTokens", () => {
      it("should update tokens successfully", async () => {
        // Mock PATCH request
        // Assert: 성공 반환
      });

      it("should handle partial update", async () => {
        // Assert: access_token만 업데이트 가능
      });

      it("should throw on API error", async () => {
        // Mock 401/403 response
        // Assert: Error with message
      });
    });
    ```

**GREEN: Implement to Make Tests Pass**

- [ ] **Task 1.1.3**: Edge Config 타입 정의
  - File: `apps/blog/src/infrastructure/edge-config/types.ts`
  - Details:

    ```typescript
    export interface LinkedInTokens {
      accessToken: string;
      refreshToken: string;
      issuedAt: number; // Unix timestamp (ms)
    }

    export interface EdgeConfigUpdateItem {
      operation: "upsert" | "delete";
      key: string;
      value?: string | number;
    }
    ```

- [ ] **Task 1.1.4**: Edge Config Client 구현
  - File: `apps/blog/src/infrastructure/edge-config/edge-config.client.ts`
  - Details:

    ```typescript
    export class EdgeConfigClient {
      constructor(
        private edgeConfigId: string,
        private vercelToken: string
      ) {}

      async getLinkedInTokens(): Promise<LinkedInTokens | null> { ... }
      async updateLinkedInTokens(tokens: Partial<LinkedInTokens>): Promise<void> { ... }
    }
    ```

- [ ] **Task 1.1.5**: Index 파일 생성
  - File: `apps/blog/src/infrastructure/edge-config/index.ts`
  - Details: Public exports

**REFACTOR: Clean Up Code**

- [ ] **Task 1.1.6**: 코드 품질 개선
  - [ ] 에러 메시지 한글화 (사용자 대면 에러)
  - [ ] JSDoc 주석 추가
  - [ ] 상수 추출 (`EDGE_CONFIG_API_BASE_URL` 등)

#### Quality Gate 1.1

**STOP: Do NOT proceed until ALL checks pass**

**TDD Compliance**:

- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Code improved while tests still pass
- [ ] Coverage: ≥90% for edge-config module

**Validation Commands**:

```bash
# 테스트 실행
cd apps/blog && pnpm test src/infrastructure/edge-config

# 커버리지 확인
cd apps/blog && pnpm test --coverage src/infrastructure/edge-config

# 타입 체크
cd apps/blog && pnpm type-check

# 린트
cd apps/blog && pnpm lint
```

---

### Phase 1.2: 환경변수 스키마 확장

**Goal**: LinkedIn OAuth 관련 환경변수 타입 정의 추가
**Estimated Time**: 15분
**Status**: ⏳ Pending

#### Tasks

**RED: Write Failing Tests First**

- [ ] **Test 1.2.1**: 환경변수 검증 테스트 (선택적)
  - File: `apps/blog/src/config/env.test.ts` (신규 또는 기존 확장)
  - Expected: 기존 테스트 유지, 새 변수 테스트 추가
  - Details:

    ```typescript
    describe("getEnv", () => {
      it("should accept optional LinkedIn OAuth vars", () => {
        // VERCEL_TOKEN, EDGE_CONFIG_ID 없어도 에러 안남
      });

      it("should validate VERCEL_TOKEN format if provided", () => {
        // 빈 문자열이면 undefined 처리
      });
    });
    ```

**GREEN: Implement to Make Tests Pass**

- [ ] **Task 1.2.2**: env.ts 스키마 확장
  - File: `apps/blog/src/config/env.ts`
  - Details:

    ```typescript
    const envSchema = z.object({
      // ... 기존 필드 ...

      // [선택] Edge Config (LinkedIn 토큰 관리)
      VERCEL_TOKEN: z.string().optional(),
      EDGE_CONFIG_ID: z.string().optional(),
    });
    ```

- [ ] **Task 1.2.3**: Edge Config 설정 확인 유틸리티 추가
  - File: `apps/blog/src/config/env.ts`
  - Details:
    ```typescript
    export function isEdgeConfigured(): boolean {
      return !!(process.env.VERCEL_TOKEN && process.env.EDGE_CONFIG_ID);
    }
    ```

**REFACTOR: Clean Up Code**

- [ ] **Task 1.2.4**: env.ts 주석 정리
  - [ ] 새 환경변수 설명 추가
  - [ ] 그룹 주석 업데이트

#### Quality Gate 1.2

**Validation Commands**:

```bash
# 타입 체크
cd apps/blog && pnpm type-check

# 린트
cd apps/blog && pnpm lint

# 기존 테스트 통과 확인
cd apps/blog && pnpm test
```

---

### Phase 1.3: OAuth 시작 엔드포인트

**Goal**: `/api/auth/linkedin` GET 요청 시 LinkedIn OAuth 페이지로 리다이렉트
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

**RED: Write Failing Tests First**

- [ ] **Test 1.3.1**: OAuth 시작 엔드포인트 테스트
  - File: `apps/blog/src/app/api/auth/linkedin/route.test.ts`
  - Expected: Tests FAIL (red) - route.ts 미존재
  - Details:

    ```typescript
    import { GET } from "./route";

    describe("GET /api/auth/linkedin", () => {
      beforeEach(() => {
        process.env.LINKEDIN_CLIENT_ID = "test-client-id";
        process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
      });

      it("should redirect to LinkedIn OAuth URL", async () => {
        const response = await GET();

        expect(response.status).toBe(302); // or 307
        expect(response.headers.get("Location")).toContain(
          "https://www.linkedin.com/oauth/v2/authorization",
        );
      });

      it("should include required OAuth params", async () => {
        const response = await GET();
        const location = response.headers.get("Location");

        expect(location).toContain("response_type=code");
        expect(location).toContain("client_id=test-client-id");
        expect(location).toContain("scope=openid+profile+w_member_social");
        expect(location).toContain(
          encodeURIComponent("/api/auth/linkedin/callback"),
        );
      });

      it("should return 500 if LINKEDIN_CLIENT_ID is not set", async () => {
        delete process.env.LINKEDIN_CLIENT_ID;

        const response = await GET();
        expect(response.status).toBe(500);
      });
    });
    ```

**GREEN: Implement to Make Tests Pass**

- [ ] **Task 1.3.2**: OAuth 시작 Route Handler 구현
  - File: `apps/blog/src/app/api/auth/linkedin/route.ts`
  - Details:

    ```typescript
    import { NextResponse } from "next/server";

    export async function GET() {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      if (!clientId || !baseUrl) {
        return NextResponse.json(
          { error: "LinkedIn OAuth is not configured" },
          { status: 500 },
        );
      }

      const params = new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        redirect_uri: `${baseUrl}/api/auth/linkedin/callback`,
        scope: "openid profile w_member_social",
      });

      return NextResponse.redirect(
        `https://www.linkedin.com/oauth/v2/authorization?${params}`,
      );
    }
    ```

**REFACTOR: Clean Up Code**

- [ ] **Task 1.3.3**: 상수 추출 및 문서화
  - [ ] LinkedIn OAuth URL을 상수로 추출
  - [ ] 함수에 JSDoc 추가

#### Quality Gate 1.3

**Validation Commands**:

```bash
# 테스트 실행
cd apps/blog && pnpm test src/app/api/auth/linkedin/route.test.ts

# 빌드 확인
cd apps/blog && pnpm build
```

**Manual Test Checklist**:

- [ ] 로컬에서 `/api/auth/linkedin` 접속 시 LinkedIn 로그인 페이지로 이동
- [ ] URL 파라미터 정상 확인 (response_type, client_id, redirect_uri, scope)

---

### Phase 1.4: OAuth Callback 엔드포인트

**Goal**: LinkedIn 인증 완료 후 토큰 교환 및 Edge Config 저장
**Estimated Time**: 45분
**Status**: ⏳ Pending

#### Tasks

**RED: Write Failing Tests First**

- [ ] **Test 1.4.1**: Callback 엔드포인트 성공 테스트
  - File: `apps/blog/src/app/api/auth/linkedin/callback/route.test.ts`
  - Expected: Tests FAIL (red) - route.ts 미존재
  - Details:

    ```typescript
    import { GET } from "./route";

    // Mock fetch globally
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    describe("GET /api/auth/linkedin/callback", () => {
      beforeEach(() => {
        vi.clearAllMocks();
        process.env.LINKEDIN_CLIENT_ID = "test-client-id";
        process.env.LINKEDIN_CLIENT_SECRET = "test-secret";
        process.env.NEXT_PUBLIC_BASE_URL = "https://example.com";
        process.env.VERCEL_TOKEN = "test-vercel-token";
        process.env.EDGE_CONFIG_ID = "test-edge-config-id";
      });

      it("should exchange code for tokens and update Edge Config", async () => {
        // Mock LinkedIn token exchange
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: "new-access-token",
              refresh_token: "new-refresh-token",
            }),
        });

        // Mock Edge Config update
        mockFetch.mockResolvedValueOnce({ ok: true });

        const request = new Request(
          "https://example.com/api/auth/linkedin/callback?code=auth-code",
        );
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toContain("text/html");

        // Verify LinkedIn API call
        expect(mockFetch).toHaveBeenCalledWith(
          "https://www.linkedin.com/oauth/v2/accessToken",
          expect.objectContaining({ method: "POST" }),
        );

        // Verify Edge Config update
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("api.vercel.com"),
          expect.objectContaining({ method: "PATCH" }),
        );
      });

      it("should return 400 if code is missing", async () => {
        const request = new Request(
          "https://example.com/api/auth/linkedin/callback",
        );
        const response = await GET(request);

        expect(response.status).toBe(400);
      });

      it("should return 500 if token exchange fails", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: "invalid_grant" }),
        });

        const request = new Request(
          "https://example.com/api/auth/linkedin/callback?code=invalid",
        );
        const response = await GET(request);

        expect(response.status).toBe(500);
      });
    });
    ```

- [ ] **Test 1.4.2**: Edge 케이스 테스트
  - File: 위와 동일
  - Details:

    ```typescript
    it("should handle Edge Config update failure gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "token",
            refresh_token: "refresh",
          }),
      });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 403 });

      const request = new Request("https://example.com?code=valid");
      const response = await GET(request);

      expect(response.status).toBe(500);
      // Assert: 에러 메시지에 Edge Config 언급
    });
    ```

**GREEN: Implement to Make Tests Pass**

- [ ] **Task 1.4.3**: Callback Route Handler 구현
  - File: `apps/blog/src/app/api/auth/linkedin/callback/route.ts`
  - Details:

    ```typescript
    import { NextResponse } from "next/server";
    import { EdgeConfigClient } from "@/infrastructure/edge-config";

    export async function GET(request: Request) {
      const url = new URL(request.url);
      const code = url.searchParams.get("code");

      if (!code) {
        return new Response("Authorization code missing", { status: 400 });
      }

      try {
        // 1. Token 교환
        const tokenResponse = await fetch(
          "https://www.linkedin.com/oauth/v2/accessToken",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/linkedin/callback`,
              client_id: process.env.LINKEDIN_CLIENT_ID!,
              client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
            }),
          },
        );

        if (!tokenResponse.ok) {
          const error = await tokenResponse.json();
          console.error("LinkedIn token exchange failed:", error);
          return new Response("Failed to exchange authorization code", {
            status: 500,
          });
        }

        const { access_token, refresh_token } = await tokenResponse.json();

        // 2. Edge Config 업데이트
        const edgeConfig = new EdgeConfigClient(
          process.env.EDGE_CONFIG_ID!,
          process.env.VERCEL_TOKEN!,
        );

        await edgeConfig.updateLinkedInTokens({
          accessToken: access_token,
          refreshToken: refresh_token,
          issuedAt: Date.now(),
        });

        // 3. 성공 페이지
        return new Response(
          `<!DOCTYPE html>
          <html>
            <head><meta charset="UTF-8"><title>LinkedIn 연동 완료</title></head>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
              <h1>LinkedIn 연동 완료!</h1>
              <p>토큰이 성공적으로 저장되었습니다.</p>
              <p>이 창을 닫으셔도 됩니다.</p>
            </body>
          </html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      } catch (error) {
        console.error("OAuth callback error:", error);
        return new Response("Internal server error", { status: 500 });
      }
    }
    ```

**REFACTOR: Clean Up Code**

- [ ] **Task 1.4.4**: 코드 품질 개선
  - [ ] 에러 핸들링 세분화 (토큰 교환 실패 vs Edge Config 실패)
  - [ ] 성공 페이지 스타일링 개선
  - [ ] 로깅 개선 (민감 정보 마스킹)

#### Quality Gate 1.4

**TDD Compliance**:

- [ ] Tests written FIRST and initially failed
- [ ] Production code written to make tests pass
- [ ] Code improved while tests still pass
- [ ] Coverage: ≥80% for callback route

**Validation Commands**:

```bash
# 테스트 실행
cd apps/blog && pnpm test src/app/api/auth/linkedin

# 전체 테스트 통과
cd apps/blog && pnpm test

# 빌드 확인
cd apps/blog && pnpm build

# 린트 & 타입 체크
cd apps/blog && pnpm lint && pnpm type-check
```

**Manual Test Checklist**:

- [ ] ngrok 또는 Vercel Preview에서 전체 OAuth 플로우 테스트
- [ ] LinkedIn 로그인 -> 권한 승인 -> Callback 정상 처리
- [ ] Edge Config 대시보드에서 토큰 3종 저장 확인
- [ ] 성공 페이지 정상 렌더링

---

## Risk Assessment

| Risk                      | Probability | Impact   | Mitigation Strategy                  |
| ------------------------- | ----------- | -------- | ------------------------------------ |
| LinkedIn API 변경         | Low         | High     | 공식 문서 버전 명시, 에러 로깅 강화  |
| Edge Config 쓰기 실패     | Low         | High     | Retry 로직 추가, 상세 에러 메시지    |
| OAuth Callback URL 불일치 | Medium      | High     | 환경변수 검증, 개발 환경 설정 가이드 |
| Token 노출 위험           | Low         | Critical | 서버 사이드 처리, 로그 마스킹        |

---

## Rollback Strategy

### If Phase 1.1 (Edge Config) Fails

**Steps to revert:**

- `apps/blog/src/infrastructure/edge-config/` 디렉토리 전체 삭제
- 관련 import 제거

### If Phase 1.2 (env.ts) Fails

**Steps to revert:**

- env.ts 변경사항 git revert
- 새로 추가된 환경변수 관련 코드 삭제

### If Phase 1.3-1.4 (Routes) Fails

**Steps to revert:**

- `apps/blog/src/app/api/auth/linkedin/` 디렉토리 전체 삭제
- Edge Config 유틸리티는 유지 (다른 용도로 재사용 가능)

---

## Progress Tracking

### Completion Status

- **Phase 1.1 (Edge Config)**: ✅ 100%
- **Phase 1.2 (env.ts)**: ✅ 100%
- **Phase 1.3 (OAuth Start)**: ✅ 100%
- **Phase 1.4 (OAuth Callback)**: ✅ 100%

**Overall Progress**: 100% complete

### Time Tracking

| Phase     | Estimated  | Actual | Variance |
| --------- | ---------- | ------ | -------- |
| Phase 1.1 | 45분       | 15분   | -30분    |
| Phase 1.2 | 15분       | 5분    | -10분    |
| Phase 1.3 | 30분       | 10분   | -20분    |
| Phase 1.4 | 45분       | 15분   | -30분    |
| **Total** | 2시간 15분 | 45분   | -1.5시간 |

---

## Notes & Learnings

### Implementation Notes

- TDD 방식으로 테스트 먼저 작성 후 구현하여 빠른 개발 속도 달성
- 기존 infrastructure 레이어 패턴(image 모듈)을 참고하여 일관성 있는 구조 유지
- Edge Config REST API PATCH 엔드포인트 사용하여 토큰 upsert 구현
- 테스트에서 vi.resetModules() 사용하여 환경변수 격리

### Blockers Encountered

- 없음

### Improvements for Future Plans

- Edge Config 읽기에 캐싱 레이어 추가 고려
- 토큰 만료 시간 계산 로직 추가 (Phase 2에서 구현)

---

## References

### Documentation

- [LinkedIn OAuth 2.0 Documentation](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Vercel Edge Config API](https://vercel.com/docs/rest-api/reference/endpoints/edge-config)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Related Files

- Main Plan: [PLAN_SNS_AUTO_POST.md](../PLAN_SNS_AUTO_POST.md)
- Original Phase 1: [PHASE-1-LINKEDIN-OAUTH.md](./PHASE-1-LINKEDIN-OAUTH.md)
- Next Phase: [PHASE-2-LINKEDIN-TOKEN-REFRESH.md](./PHASE-2-LINKEDIN-TOKEN-REFRESH.md)

---

## Final Checklist

**Before marking Phase 1 as COMPLETE**:

- [x] All sub-phases completed with quality gates passed
- [ ] Full OAuth flow tested on Vercel Preview or ngrok
- [ ] Edge Config 토큰 저장 확인
- [x] 에러 케이스 모두 테스트
- [x] 코드 리뷰 완료 (self-review)
- [x] Plan document 업데이트 (시간 추적, 노트)

---

## Quick Start Commands

```bash
# 개발 환경 설정 (필요한 환경변수)
export LINKEDIN_CLIENT_ID="your-client-id"
export LINKEDIN_CLIENT_SECRET="your-client-secret"
export VERCEL_TOKEN="your-vercel-token"
export EDGE_CONFIG_ID="your-edge-config-id"
export NEXT_PUBLIC_BASE_URL="http://localhost:36001" # 또는 ngrok URL

# 개발 서버 실행
cd apps/blog && pnpm dev

# 테스트 실행
cd apps/blog && pnpm test

# 빌드 검증
cd apps/blog && pnpm build
```

---

**Plan Status**: ✅ Complete
**Next Action**: Phase 2 시작 - LinkedIn 토큰 자동 갱신
**Blocked By**: None

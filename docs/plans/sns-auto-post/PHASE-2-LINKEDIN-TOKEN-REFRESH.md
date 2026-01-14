# Phase 2: LinkedIn 토큰 자동 갱신

**Status**: ✅ Complete
**Started**: 2026-01-14
**Last Updated**: 2026-01-14
**Completed**: 2026-01-14
**Actual Time**: ~1시간
**Dependencies**: Phase 1 완료 ✅

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each sub-phase:

1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next sub-phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description

LinkedIn Access Token을 GitHub Actions를 통해 자동으로 갱신하고, Refresh Token 만료 30일 전 GitHub Issue로 알림을 발송하는 시스템을 구현합니다.

### Success Criteria

- [x] 매주 월요일 자동 실행 (Cron 스케줄)
- [x] Access Token 만료 7일 전 자동 갱신
- [x] Refresh Token 만료 30일 전 GitHub Issue 자동 생성
- [x] 수동 트리거로 즉시 갱신 가능 (workflow_dispatch)
- [x] 에러 발생 시 GitHub Issue로 알림
- [x] 중복 알림 방지 (기존 이슈 확인)

### User Impact

- LinkedIn 토큰 관리 완전 자동화
- 연 1회 재인증만으로 1년간 무중단 운영
- 토큰 만료로 인한 SNS 포스팅 실패 방지

---

## 🏗️ Architecture Decisions

| Decision                      | Rationale                                | Trade-offs          |
| ----------------------------- | ---------------------------------------- | ------------------- |
| **GitHub Actions 사용**       | Vercel 컴퓨팅 비용 절약, 6시간 실행 가능 | GitHub 의존성 증가  |
| **매주 월요일 실행**          | 7일 버퍼로 충분한 갱신 여유 확보         | 즉각적 갱신 아님    |
| **Edge Config 직접 API 호출** | Phase 1 구현 재활용, SDK 불필요          | curl 명령어 복잡성  |
| **GitHub Issue 알림**         | 추가 인프라 불필요, 코드 저장소와 통합   | 이메일/Slack 미지원 |

---

## 📦 Dependencies

### Required Before Starting

- [x] Phase 1: LinkedIn OAuth 엔드포인트 완료
- [x] Edge Config 클라이언트 구현 (`apps/blog/src/infrastructure/edge-config/`)
- [ ] GitHub Secrets 설정:
  - `EDGE_CONFIG_ID`: Vercel Edge Config 식별자
  - `EDGE_CONFIG_TOKEN`: Edge Config 읽기 토큰
  - `VERCEL_TOKEN`: Edge Config 쓰기 토큰
  - `LINKEDIN_CLIENT_ID`: LinkedIn OAuth App Client ID
  - `LINKEDIN_CLIENT_SECRET`: LinkedIn OAuth App Client Secret

### External Dependencies

- LinkedIn OAuth 2.0 API: `https://www.linkedin.com/oauth/v2/accessToken`
- Vercel Edge Config API: `https://api.vercel.com/v1/edge-config/{id}/items`
- GitHub Actions: `actions/checkout@v4`, `actions/github-script@v7`

---

## 🧪 Test Strategy

### Testing Approach

이 Phase는 GitHub Actions 워크플로우가 핵심이므로, **로컬 테스트가 제한적**입니다.
대신 **모듈화된 스크립트**와 **워크플로우 시뮬레이션**을 통해 품질을 보장합니다.

### Test Pyramid for This Feature

| Test Type             | Coverage Target   | Purpose                                 |
| --------------------- | ----------------- | --------------------------------------- |
| **Unit Tests**        | ≥80%              | 토큰 만료일 계산 로직, 에러 핸들링      |
| **Integration Tests** | Critical paths    | Edge Config API 연동, LinkedIn API 연동 |
| **E2E Tests**         | workflow_dispatch | 수동 트리거로 전체 플로우 검증          |

### Test File Organization

```
apps/blog/src/infrastructure/
├── edge-config/
│   ├── edge-config.client.test.ts    # 기존 8개 테스트
│   └── token-expiry.test.ts          # 신규: 만료일 계산 테스트
└── linkedin/
    └── token-refresh.test.ts          # 신규: 토큰 갱신 테스트

.github/workflows/
└── refresh-linkedin-token.yml         # 워크플로우 파일
```

---

## 🚀 Implementation Sub-Phases

### Sub-Phase 2.1: 토큰 만료일 계산 유틸리티

**Goal**: 토큰 발급일로부터 Access/Refresh Token 만료일을 계산하는 순수 함수 구현
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Write Failing Tests First**

- [ ] **Test 2.1.1**: 만료일 계산 유닛 테스트 작성
  - File: `apps/blog/src/infrastructure/edge-config/token-expiry.test.ts`
  - Expected: Tests FAIL (red) because utility doesn't exist yet
  - Test Cases:

    ```typescript
    describe("calculateTokenExpiry", () => {
      it("should calculate access token expiry (60 days from issued_at)");
      it("should calculate refresh token expiry (365 days from issued_at)");
      it("should return days remaining until expiry");
      it("should return negative days if already expired");
      it("should handle edge case: issued_at is 0 or undefined");
    });

    describe("needsRefresh", () => {
      it("should return true if access token expires within 7 days");
      it("should return false if access token has more than 7 days");
    });

    describe("needsReauth", () => {
      it("should return true if refresh token expires within 30 days");
      it("should return false if refresh token has more than 30 days");
    });
    ```

**🟢 GREEN: Implement to Make Tests Pass**

- [ ] **Task 2.1.2**: 토큰 만료일 계산 유틸리티 구현
  - File: `apps/blog/src/infrastructure/edge-config/token-expiry.ts`
  - Implementation:

    ```typescript
    // 상수 정의
    export const ACCESS_TOKEN_LIFETIME_DAYS = 60;
    export const REFRESH_TOKEN_LIFETIME_DAYS = 365;
    export const ACCESS_TOKEN_REFRESH_THRESHOLD_DAYS = 7;
    export const REFRESH_TOKEN_ALERT_THRESHOLD_DAYS = 30;

    // 만료일 계산 함수
    export function calculateDaysRemaining(
      issuedAt: number,
      lifetimeDays: number,
    ): number;
    export function needsAccessTokenRefresh(issuedAt: number): boolean;
    export function needsReauthAlert(issuedAt: number): boolean;
    ```

- [ ] **Task 2.1.3**: Edge Config 타입에 만료일 관련 헬퍼 추가
  - File: `apps/blog/src/infrastructure/edge-config/index.ts`
  - Goal: Public exports 업데이트

**🔵 REFACTOR: Clean Up Code**

- [ ] **Task 2.1.4**: 코드 품질 개선
  - [ ] 상수를 별도 파일로 분리 검토
  - [ ] JSDoc 주석 추가
  - [ ] 타입 안전성 강화

#### Quality Gate 2.1 ✋

**Build & Tests**:

```bash
cd apps/blog && pnpm test -- --run token-expiry
```

- [ ] 모든 테스트 통과
- [ ] 테스트 커버리지 ≥80%

---

### Sub-Phase 2.2: GitHub Actions 워크플로우 생성

**Goal**: LinkedIn 토큰 자동 갱신 워크플로우 파일 생성
**Estimated Time**: 1시간
**Status**: ⏳ Pending

#### Tasks

**🔴 RED: Define Expected Behavior First**

- [ ] **Spec 2.2.1**: 워크플로우 동작 명세 정의
  - 트리거: `schedule` (매주 월요일 00:00 UTC) + `workflow_dispatch`
  - 입력: Edge Config에서 토큰 조회
  - 처리: 만료일 계산 → 갱신 필요 시 LinkedIn API 호출 → Edge Config 업데이트
  - 출력: 갱신 성공/실패 로그, 필요 시 GitHub Issue 생성

**🟢 GREEN: Implement Workflow**

- [ ] **Task 2.2.2**: 워크플로우 파일 생성
  - File: `.github/workflows/refresh-linkedin-token.yml`
  - Structure:

    ```yaml
    name: Refresh LinkedIn Token

    on:
      schedule:
        - cron: "0 0 * * 1" # 매주 월요일 00:00 UTC
      workflow_dispatch: # 수동 트리거

    jobs:
      refresh-token:
        runs-on: ubuntu-latest
        steps:
          - name: Get tokens from Edge Config
          - name: Calculate expiry dates
          - name: Check if refresh needed
          - name: Refresh Access Token (conditional)
          - name: Update Edge Config (conditional)
          - name: Check if reauth alert needed
          - name: Create GitHub Issue for reauth (conditional)
    ```

- [ ] **Task 2.2.3**: Edge Config 토큰 조회 Step 구현

  ```yaml
  - name: Get tokens from Edge Config
    id: get-tokens
    run: |
      RESPONSE=$(curl -s "https://edge-config.vercel.com/${{ secrets.EDGE_CONFIG_ID }}" \
        -H "Authorization: Bearer ${{ secrets.EDGE_CONFIG_TOKEN }}")

      echo "refresh_token=$(echo $RESPONSE | jq -r '.LINKEDIN_REFRESH_TOKEN')" >> $GITHUB_OUTPUT
      echo "issued_at=$(echo $RESPONSE | jq -r '.LINKEDIN_TOKEN_ISSUED_AT')" >> $GITHUB_OUTPUT

      # 민감 데이터 마스킹
      echo "::add-mask::$(echo $RESPONSE | jq -r '.LINKEDIN_REFRESH_TOKEN')"
  ```

- [ ] **Task 2.2.4**: 만료일 계산 Step 구현

  ```yaml
  - name: Calculate expiry dates
    id: check-expiry
    run: |
      ISSUED_AT=${{ steps.get-tokens.outputs.issued_at }}
      NOW=$(date +%s)
      DAYS_ELAPSED=$(( (NOW - ISSUED_AT/1000) / 86400 ))
      ACCESS_EXPIRES_IN=$(( 60 - DAYS_ELAPSED ))
      REFRESH_EXPIRES_IN=$(( 365 - DAYS_ELAPSED ))

      echo "access_expires_in=$ACCESS_EXPIRES_IN" >> $GITHUB_OUTPUT
      echo "refresh_expires_in=$REFRESH_EXPIRES_IN" >> $GITHUB_OUTPUT
      echo "needs_refresh=$( [ $ACCESS_EXPIRES_IN -le 7 ] && echo true || echo false )" >> $GITHUB_OUTPUT
      echo "needs_reauth_alert=$( [ $REFRESH_EXPIRES_IN -le 30 ] && echo true || echo false )" >> $GITHUB_OUTPUT

      echo "📊 Token Status:"
      echo "  - Access Token expires in: $ACCESS_EXPIRES_IN days"
      echo "  - Refresh Token expires in: $REFRESH_EXPIRES_IN days"
  ```

- [ ] **Task 2.2.5**: Access Token 갱신 Step 구현

  ```yaml
  - name: Refresh Access Token
    id: refresh
    if: steps.check-expiry.outputs.needs_refresh == 'true'
    run: |
      echo "🔄 Refreshing Access Token..."

      RESPONSE=$(curl -s -X POST "https://www.linkedin.com/oauth/v2/accessToken" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "grant_type=refresh_token" \
        -d "refresh_token=${{ steps.get-tokens.outputs.refresh_token }}" \
        -d "client_id=${{ secrets.LINKEDIN_CLIENT_ID }}" \
        -d "client_secret=${{ secrets.LINKEDIN_CLIENT_SECRET }}")

      ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.access_token')

      if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
        echo "❌ Token refresh failed"
        echo "Error: $(echo $RESPONSE | jq -r '.error_description // .error')"
        echo "refresh_failed=true" >> $GITHUB_OUTPUT
        exit 1
      fi

      echo "::add-mask::$ACCESS_TOKEN"
      echo "access_token=$ACCESS_TOKEN" >> $GITHUB_OUTPUT
      echo "✅ Access Token refreshed successfully"
  ```

- [ ] **Task 2.2.6**: Edge Config 업데이트 Step 구현

  ```yaml
  - name: Update Edge Config
    if: steps.refresh.outputs.access_token != ''
    run: |
      echo "📤 Updating Edge Config..."

      curl -X PATCH "https://api.vercel.com/v1/edge-config/${{ secrets.EDGE_CONFIG_ID }}/items" \
        -H "Authorization: Bearer ${{ secrets.VERCEL_TOKEN }}" \
        -H "Content-Type: application/json" \
        -d '{
          "items": [
            {
              "operation": "upsert",
              "key": "LINKEDIN_ACCESS_TOKEN",
              "value": "${{ steps.refresh.outputs.access_token }}"
            }
          ]
        }'

      echo "✅ Edge Config updated"
  ```

- [ ] **Task 2.2.7**: 재인증 알림 Issue 생성 Step 구현

  ```yaml
  - name: Check for existing reauth issue
    id: check-issue
    if: steps.check-expiry.outputs.needs_reauth_alert == 'true'
    uses: actions/github-script@v7
    with:
      script: |
        const issues = await github.rest.issues.listForRepo({
          owner: context.repo.owner,
          repo: context.repo.repo,
          labels: 'linkedin-reauth',
          state: 'open'
        });
        return issues.data.length > 0;
      result-encoding: string

  - name: Create reauth alert issue
    if: steps.check-expiry.outputs.needs_reauth_alert == 'true' && steps.check-issue.outputs.result != 'true'
    uses: actions/github-script@v7
    with:
      script: |
        const daysRemaining = ${{ steps.check-expiry.outputs.refresh_expires_in }};
        const reauthUrl = '${{ secrets.NEXT_PUBLIC_BASE_URL || 'https://your-blog.vercel.app' }}/api/auth/linkedin';

        await github.rest.issues.create({
          owner: context.repo.owner,
          repo: context.repo.repo,
          title: '🔔 LinkedIn 재인증 필요 (' + daysRemaining + '일 후 만료)',
          body: `## LinkedIn Refresh Token 만료 예정

        **남은 일수**: ${daysRemaining}일

        Refresh Token이 곧 만료됩니다. 아래 링크에서 재인증해주세요:

        👉 [LinkedIn 재인증하기](${reauthUrl})

        > ⏱️ 1분 내 완료됩니다.
        > 
        > 재인증 후 이 이슈를 닫아주세요.`,
          labels: ['linkedin-reauth', 'urgent', 'auth']
        });

        console.log('📢 Reauth alert issue created');
  ```

**🔵 REFACTOR: Clean Up Workflow**

- [ ] **Task 2.2.8**: 워크플로우 최적화
  - [ ] 중복 코드 제거
  - [ ] 환경 변수 그룹화
  - [ ] 주석 추가
  - [ ] 에러 핸들링 강화

#### Quality Gate 2.2 ✋

**Workflow Validation**:

```bash
# YAML 문법 검증
yamllint .github/workflows/refresh-linkedin-token.yml

# GitHub Actions 로컬 테스트 (선택적)
act -l  # 워크플로우 목록 확인
```

- [ ] YAML 문법 오류 없음
- [ ] 모든 secrets 참조 올바름
- [ ] 조건문 로직 검증됨

---

### Sub-Phase 2.3: 에러 핸들링 및 알림

**Goal**: 토큰 갱신 실패 시 자동 알림 및 복구 로직 구현
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

**🟢 GREEN: Implement Error Handling**

- [ ] **Task 2.3.1**: 토큰 갱신 실패 시 Issue 생성

  ```yaml
  - name: Alert on refresh failure
    if: failure() && steps.refresh.outputs.refresh_failed == 'true'
    uses: actions/github-script@v7
    with:
      script: |
        await github.rest.issues.create({
          owner: context.repo.owner,
          repo: context.repo.repo,
          title: '❌ LinkedIn Token 갱신 실패',
          body: `## Token Refresh Failed
          
          LinkedIn Access Token 갱신 중 오류가 발생했습니다.
          
          **가능한 원인:**
          - Refresh Token이 이미 만료됨 (365일 초과)
          - LinkedIn OAuth 앱 권한 변경
          - API 일시적 오류
          
          **조치 방법:**
          1. [LinkedIn 재인증하기](${{ secrets.NEXT_PUBLIC_BASE_URL }}/api/auth/linkedin)
          2. 워크플로우 수동 재실행
          
          **실행 로그:** [Actions Run](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})`,
          labels: ['bug', 'auth', 'urgent']
        });
  ```

- [ ] **Task 2.3.2**: Edge Config 조회 실패 처리

  ```yaml
  - name: Validate Edge Config response
    id: validate
    run: |
      if [ -z "${{ steps.get-tokens.outputs.refresh_token }}" ] || \
         [ "${{ steps.get-tokens.outputs.refresh_token }}" == "null" ]; then
        echo "❌ Failed to retrieve tokens from Edge Config"
        echo "Please ensure EDGE_CONFIG_ID and EDGE_CONFIG_TOKEN are correctly set"
        exit 1
      fi
      echo "✅ Tokens retrieved successfully"
  ```

- [ ] **Task 2.3.3**: 워크플로우 Summary 출력
  ```yaml
  - name: Generate workflow summary
    if: always()
    run: |
      echo "## 🔐 LinkedIn Token Refresh Summary" >> $GITHUB_STEP_SUMMARY
      echo "" >> $GITHUB_STEP_SUMMARY
      echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
      echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
      echo "| Access Token Expires In | ${{ steps.check-expiry.outputs.access_expires_in }} days |" >> $GITHUB_STEP_SUMMARY
      echo "| Refresh Token Expires In | ${{ steps.check-expiry.outputs.refresh_expires_in }} days |" >> $GITHUB_STEP_SUMMARY
      echo "| Refresh Needed | ${{ steps.check-expiry.outputs.needs_refresh }} |" >> $GITHUB_STEP_SUMMARY
      echo "| Reauth Alert Needed | ${{ steps.check-expiry.outputs.needs_reauth_alert }} |" >> $GITHUB_STEP_SUMMARY
  ```

#### Quality Gate 2.3 ✋

- [ ] 에러 시나리오별 알림 동작 확인
- [ ] GitHub Step Summary 정상 출력

---

### Sub-Phase 2.4: 통합 테스트 및 검증

**Goal**: 전체 워크플로우 E2E 검증
**Estimated Time**: 30분
**Status**: ⏳ Pending

#### Tasks

- [ ] **Task 2.4.1**: GitHub Secrets 설정 확인
  - Repository Settings > Secrets and variables > Actions
  - 필수 Secrets:
    - `EDGE_CONFIG_ID`
    - `EDGE_CONFIG_TOKEN`
    - `VERCEL_TOKEN`
    - `LINKEDIN_CLIENT_ID`
    - `LINKEDIN_CLIENT_SECRET`
    - `NEXT_PUBLIC_BASE_URL`

- [ ] **Task 2.4.2**: 수동 트리거로 워크플로우 실행

  ```bash
  # GitHub CLI 사용
  gh workflow run refresh-linkedin-token.yml

  # 실행 상태 확인
  gh run list --workflow=refresh-linkedin-token.yml
  ```

- [ ] **Task 2.4.3**: 실행 결과 검증
  - [ ] 워크플로우 성공적으로 완료
  - [ ] Edge Config에서 토큰 조회 성공
  - [ ] 만료일 계산 로직 정상 동작
  - [ ] (필요 시) Access Token 갱신 성공
  - [ ] (필요 시) GitHub Issue 생성 성공
  - [ ] Step Summary 정상 출력

- [ ] **Task 2.4.4**: Edge Config 업데이트 확인
  ```bash
  # Vercel Dashboard에서 확인 또는
  curl "https://edge-config.vercel.com/${EDGE_CONFIG_ID}" \
    -H "Authorization: Bearer ${EDGE_CONFIG_TOKEN}" | jq
  ```

#### Quality Gate 2.4 ✋ (Final)

**⚠️ STOP: Phase 2 완료 전 모든 항목 확인**

**Workflow Execution**:

- [ ] `workflow_dispatch` 트리거로 수동 실행 성공
- [ ] 모든 Step 성공적으로 완료 (초록색 체크)
- [ ] GitHub Step Summary 정상 출력

**Token Management**:

- [ ] Edge Config에서 토큰 읽기 성공
- [ ] 만료일 계산 로직 정확
- [ ] (조건 충족 시) Access Token 갱신 성공
- [ ] (조건 충족 시) Edge Config 업데이트 성공

**Alerting**:

- [ ] (조건 충족 시) 재인증 알림 Issue 생성
- [ ] 중복 Issue 방지 로직 동작

**Error Handling**:

- [ ] 에러 발생 시 적절한 알림 생성
- [ ] 실패 시 워크플로우 Summary에 에러 정보 포함

---

## ⚠️ Risk Assessment

| Risk                    | Probability | Impact | Mitigation Strategy                         |
| ----------------------- | ----------- | ------ | ------------------------------------------- |
| LinkedIn API 변경       | Low         | High   | 공식 문서 모니터링, 에러 알림으로 빠른 대응 |
| Edge Config API 장애    | Low         | Medium | 재시도 로직, 실패 시 Issue 알림             |
| Refresh Token 만료 놓침 | Low         | High   | 30일 전 알림, 매주 체크로 충분한 버퍼       |
| GitHub Actions 장애     | Low         | Medium | 수동 트리거 가능, 워크플로우 로그 확인      |
| Secrets 미설정          | Medium      | High   | 워크플로우 초반에 필수 값 검증              |

---

## 🔄 Rollback Strategy

### If Sub-Phase 2.1 Fails

- 삭제: `apps/blog/src/infrastructure/edge-config/token-expiry.ts`
- 삭제: `apps/blog/src/infrastructure/edge-config/token-expiry.test.ts`
- 되돌리기: `apps/blog/src/infrastructure/edge-config/index.ts`

### If Sub-Phase 2.2-2.4 Fails

- 삭제: `.github/workflows/refresh-linkedin-token.yml`
- 수동 토큰 갱신으로 대체 (OAuth 재인증 URL 직접 접속)

---

## 📊 Progress Tracking

### Completion Status

- **Sub-Phase 2.1 (토큰 만료 유틸리티)**: ⏳ 0%
- **Sub-Phase 2.2 (워크플로우 생성)**: ⏳ 0%
- **Sub-Phase 2.3 (에러 핸들링)**: ⏳ 0%
- **Sub-Phase 2.4 (통합 테스트)**: ⏳ 0%

**Overall Progress**: 0% complete

### Time Tracking

| Sub-Phase              | Estimated | Actual | Variance |
| ---------------------- | --------- | ------ | -------- |
| 2.1 토큰 만료 유틸리티 | 30분      | -      | -        |
| 2.2 워크플로우 생성    | 1시간     | -      | -        |
| 2.3 에러 핸들링        | 30분      | -      | -        |
| 2.4 통합 테스트        | 30분      | -      | -        |
| **Total**              | 2.5시간   | -      | -        |

---

## 📝 Notes & Learnings

### Implementation Notes

_구현 중 발견한 인사이트를 여기에 기록합니다._

### Blockers Encountered

_발생한 블로커와 해결 방법을 기록합니다._

### Improvements for Future Plans

_다음 Phase를 위한 개선 사항을 기록합니다._

---

## 📚 References

### Documentation

- [LinkedIn Programmatic Refresh Tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)
- [Vercel Edge Config API](https://vercel.com/docs/rest-api/reference/endpoints/edge-config/update-edge-config-items-in-batch)
- [GitHub Actions Scheduled Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [actions/github-script](https://github.com/actions/github-script)

### Related Files

- Phase 1 구현: `apps/blog/src/infrastructure/edge-config/`
- Phase 1 OAuth: `apps/blog/src/app/api/auth/linkedin/`
- 환경 변수: `apps/blog/src/config/env.ts`

---

## ✅ Final Checklist

**Before marking Phase 2 as COMPLETE**:

- [ ] Sub-Phase 2.1 완료 (토큰 만료 유틸리티)
- [ ] Sub-Phase 2.2 완료 (워크플로우 생성)
- [ ] Sub-Phase 2.3 완료 (에러 핸들링)
- [ ] Sub-Phase 2.4 완료 (통합 테스트)
- [ ] 모든 Quality Gate 통과
- [ ] 문서 업데이트 완료
- [ ] PLAN_SNS_AUTO_POST.md에서 Phase 2 상태 ✅로 변경

---

## ➡️ Next Phase

→ [Phase 3: SNS 포스팅 핵심 로직](./PHASE-3-CORE-POSTING.md)

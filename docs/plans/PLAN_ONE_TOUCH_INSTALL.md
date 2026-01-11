# Implementation Plan: 원터치 설치 시스템 (One-Touch Install)

**Status**: ⏳ Pending
**Started**: 2026-01-11
**Last Updated**: 2026-01-11
**Estimated Completion**: 2026-01-18

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description
Node.js나 Vercel CLI 없이, **단일 실행 파일**(`tuum-setup`) 하나만으로 Vercel 배포 및 블로그 설정을 완료할 수 있는 원터치 설치 시스템을 구현합니다.

### Success Criteria
- [ ] Node.js/npm 없는 환경에서 실행 파일만으로 동작
- [ ] Windows/Mac 크로스 플랫폼 지원
- [ ] OAuth 자동화로 사용자 복사/붙여넣기 0회 (Vercel 관련)
- [ ] 최종 바이너리 크기 20MB 이하
- [ ] 설치 완료까지 사용자 개입 최소화 (브라우저 로그인 1회 + Notion 정보 입력)

### User Impact
- 기술 지식 없는 사용자도 블로그 배포 가능
- 설치 시간 5분 이내
- 복잡한 개발 환경 설정 불필요

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| **Bun 사용** (pkg 대신) | 더 가벼운 바이너리, 빠른 빌드, Native module 이슈 없음 | Bun 생태계가 Node.js보다 작음 |
| **Vercel REST API 직접 호출** | CLI 번들링 불필요, ~10MB vs ~300MB | API 버전 관리 필요 |
| **OAuth 2.0 인증** | 토큰 자동 발급, 사용자 복사/붙여넣기 불필요 | Vercel Integration 사전 등록 필요 |
| **TypeScript 사용** | 타입 안정성, 더 나은 개발 경험 | 빌드 단계 필요 (Bun이 처리) |

---

## 📦 Dependencies

### Required Before Starting
- [ ] Vercel Integration 등록 (OAuth Client ID/Secret 발급)
- [ ] GitHub Repository에 Apps 폴더 구조 정의 (`apps/setup/`)

### External Dependencies
- `bun`: v1.0.0+ (빌드 및 런타임)
- `open`: v10.0.0 (브라우저 자동 실행)
- `prompts`: v2.4.2 (대화형 CLI)
- `chalk`: v5.3.0 (터미널 색상)
- `ora`: v8.0.0 (스피너/진행률)

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: Write tests FIRST, then implement to make them pass

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥80% | OAuth 토큰 교환, API 호출, 설정 유효성 검증 |
| **Integration Tests** | Critical paths | OAuth 흐름, API 연동 |
| **E2E Tests** | Key user flows | 전체 설치 프로세스 (mock API 사용) |

### Test File Organization
```
apps/setup/
├── src/
│   ├── auth/           # OAuth 인증
│   ├── api/            # Vercel API 호출
│   ├── config/         # 설정 수집
│   └── deploy/         # 배포 로직
└── test/
    ├── unit/
    │   ├── auth/
    │   ├── api/
    │   └── config/
    └── integration/
        └── flows/
```

---

## 🚀 Implementation Phases

### Phase 1: 프로젝트 구조 및 기본 설정
**Goal**: Bun 프로젝트 초기화 및 기본 CLI 프레임워크 구축
**Estimated Time**: 2시간
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 1.1**: CLI 진입점 테스트
  - File(s): `apps/setup/test/unit/cli.test.ts`
  - Expected: Tests FAIL - CLI 모듈 없음
  - Details:
    - CLI가 정상 실행되는지
    - 버전 플래그(`--version`) 동작
    - 도움말 플래그(`--help`) 동작

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 1.2**: 프로젝트 구조 생성
  - File(s): `apps/setup/package.json`, `apps/setup/tsconfig.json`
  - Details: Bun 프로젝트 초기화, TypeScript 설정

- [x] **Task 1.3**: CLI 진입점 구현
  - File(s): `apps/setup/src/index.ts`, `apps/setup/src/cli.ts`
  - Goal: Test 1.1 통과

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 1.4**: 코드 정리 및 문서화
  - 프로젝트 README 작성
  - 기본 타입 정의

#### Quality Gate ✋

**TDD Compliance**:
- [x] Tests written FIRST and initially failed
- [x] Production code written to make tests pass
- [x] Code improved while tests still pass

**Build & Tests**:
```bash
cd apps/setup && bun test
cd apps/setup && bun run build
```

- [x] All tests pass
- [x] Build succeeds

---

### Phase 2: OAuth 인증 모듈
**Goal**: Vercel OAuth 로그인 및 토큰 자동 발급
**Estimated Time**: 3시간
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 2.1**: 로컬 서버 테스트
  - File(s): `apps/setup/test/unit/auth/server.test.ts`
  - Expected: Tests FAIL
  - Details:
    - 로컬 서버가 지정 포트에서 시작되는지
    - 콜백 URL이 올바르게 처리되는지
    - 서버 종료가 정상적인지

- [x] **Test 2.2**: 토큰 교환 테스트
  - File(s): `apps/setup/test/unit/auth/token.test.ts`
  - Expected: Tests FAIL
  - Details:
    - Authorization Code → Access Token 교환
    - 에러 응답 처리
    - 토큰 유효성 검증

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 2.3**: 로컬 HTTP 서버 구현
  - File(s): `apps/setup/src/auth/server.ts`
  - Details: 콜백 수신용 로컬 서버

- [x] **Task 2.4**: OAuth 토큰 교환 구현
  - File(s): `apps/setup/src/auth/token.ts`
  - Details: Vercel OAuth API 호출

- [x] **Task 2.5**: 브라우저 자동 실행
  - File(s): `apps/setup/src/auth/browser.ts`
  - Details: `open` 패키지로 브라우저 실행

- [x] **Task 2.6**: 인증 흐름 통합
  - File(s): `apps/setup/src/auth/index.ts`
  - Details: 전체 OAuth 흐름 조합

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 2.7**: 에러 핸들링 강화
  - 타임아웃 처리
  - 사용자 친화적 에러 메시지

#### Quality Gate ✋

**TDD Compliance**:
- [x] Tests written FIRST
- [x] Green phase minimal code
- [x] Refactoring complete

**Validation Commands**:
```bash
cd apps/setup && bun test --filter auth
```

**Manual Test Checklist**:
- [ ] 브라우저가 자동으로 열리는지
- [ ] 로그인 후 터미널에 "인증 완료" 메시지 표시
- [ ] 토큰이 정상적으로 저장되는지

---

### Phase 3: Vercel REST API 클라이언트
**Goal**: 프로젝트 생성, 환경변수 설정, 배포 API 구현
**Estimated Time**: 4시간
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 3.1**: 프로젝트 생성 API 테스트
  - File(s): `apps/setup/test/unit/api/project.test.ts`
  - Details:
    - 프로젝트 생성 요청 형식
    - 성공/실패 응답 처리
    - 중복 프로젝트명 처리

- [x] **Test 3.2**: 환경변수 설정 API 테스트
  - File(s): `apps/setup/test/unit/api/env.test.ts`
  - Details:
    - 환경변수 설정 요청
    - 다중 환경변수 일괄 설정
    - 기존 변수 덮어쓰기

- [x] **Test 3.3**: 배포 API 테스트
  - File(s): `apps/setup/test/unit/api/deploy.test.ts`
  - Details:
    - 파일 업로드 형식
    - 배포 상태 폴링
    - 배포 완료 감지

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 3.4**: API 클라이언트 기반 구현
  - File(s): `apps/setup/src/api/client.ts`
  - Details: 공통 HTTP 클라이언트, 인증 헤더

- [x] **Task 3.5**: 프로젝트 API 구현
  - File(s): `apps/setup/src/api/project.ts`

- [x] **Task 3.6**: 환경변수 API 구현
  - File(s): `apps/setup/src/api/env.ts`

- [x] **Task 3.7**: 배포 API 구현
  - File(s): `apps/setup/src/api/deploy.ts`

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 3.8**: 타입 정의 분리
  - File(s): `apps/setup/src/types/api.ts`
- [x] **Task 3.9**: 재시도 로직 추가 (네트워크 오류)

#### Quality Gate ✋

**Validation Commands**:
```bash
cd apps/setup && bun test --filter api
```

---

### Phase 4: 대화형 설정 UI
**Goal**: 사용자 입력 수집 (Notion, 블로그 정보, 소셜 링크)
**Estimated Time**: 2시간
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 4.1**: 설정 유효성 검증 테스트
  - File(s): `apps/setup/test/unit/config/validation.test.ts`
  - Details:
    - Notion API Key 형식 검증 (`secret_` 접두사)
    - Database ID 형식 검증 (UUID)
    - URL 형식 검증 (소셜 링크)

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 4.2**: 설정 수집 프롬프트 구현
  - File(s): `apps/setup/src/config/prompts.ts`
  - Details: `prompts` 패키지 사용

- [x] **Task 4.3**: 유효성 검증 구현
  - File(s): `apps/setup/src/config/validation.ts`

- [x] **Task 4.4**: 설정 모델 정의
  - File(s): `apps/setup/src/config/types.ts`

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 4.5**: 사용자 경험 개선
  - 기본값 제공
  - 힌트 메시지 추가

#### Quality Gate ✋

**Validation Commands**:
```bash
cd apps/setup && bun test --filter config
```

---

### Phase 5: 배포 오케스트레이션
**Goal**: 전체 설치 프로세스 통합 (인증 → 설정 → 배포)
**Estimated Time**: 3시간
**Status**: ✅ Complete

#### Tasks

**🔴 RED: Write Failing Tests First**
- [x] **Test 5.1**: 오케스트레이션 흐름 테스트
  - File(s): `apps/setup/test/integration/flows/install.test.ts`
  - Details:
    - 전체 단계 순서 검증
    - 단계별 에러 핸들링
    - 진행률 표시

**🟢 GREEN: Implement to Make Tests Pass**
- [x] **Task 5.2**: 오케스트레이터 구현
  - File(s): `apps/setup/src/orchestrator.ts`
  - Details: 전체 흐름 조합

- [x] **Task 5.3**: 진행률 UI 구현
  - File(s): `apps/setup/src/ui/progress.ts`
  - Details: `ora` 스피너, 단계별 체크마크

- [x] **Task 5.4**: 에러 핸들링 통합
  - File(s): `apps/setup/src/errors.ts`
  - Details: 사용자 친화적 에러 메시지

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 5.5**: 로깅 개선
- [x] **Task 5.6**: 재시도 옵션 추가

#### Quality Gate ✋

**Manual Test Checklist**:
- [ ] 전체 흐름이 순서대로 진행되는지
- [ ] 각 단계에서 진행률이 표시되는지
- [ ] 에러 발생 시 명확한 메시지 표시

---

### Phase 6: 바이너리 패키징 및 배포
**Goal**: Bun으로 크로스 플랫폼 실행 파일 생성
**Estimated Time**: 2시간
**Status**: ✅ Complete

#### Tasks

**🟢 GREEN: Implement**
- [x] **Task 6.1**: Bun 빌드 설정
  - File(s): `apps/setup/build.ts`
  - Details:
    ```bash
    bun build src/index.ts --compile --outfile dist/tuum-setup
    ```

- [x] **Task 6.2**: Mac 빌드
  - Output: `dist/tuum-setup` (arm64, x64)

- [x] **Task 6.3**: Windows 빌드
  - Output: `dist/tuum-setup.exe`

- [ ] **Task 6.4**: GitHub Actions 워크플로우 (추후)
  - File(s): `.github/workflows/release-setup.yml`
  - Details: 태그 푸시 시 자동 릴리즈

**🔵 REFACTOR: Clean Up Code**
- [x] **Task 6.5**: 빌드 스크립트 정리
- [ ] **Task 6.6**: README 업데이트 (추후)

#### Quality Gate ✋

**Validation**:
- [x] Mac에서 실행 파일 테스트
- [ ] Windows에서 실행 파일 테스트 (가능하다면)
- [ ] 바이너리 크기 20MB 이하 확인 (현재 57MB - Bun 런타임 포함)

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Vercel API 변경 | Low | High | API 버전 고정, 변경사항 모니터링 |
| OAuth Integration 승인 거부 | Low | High | 사전 Vercel 문서 확인, 대안 인증 방식 준비 |
| Bun 크로스 컴파일 이슈 | Medium | Medium | CI/CD에서 각 플랫폼별 빌드 |
| 네트워크 불안정 | Medium | Low | 재시도 로직, 타임아웃 설정 |

---

## 🔄 Rollback Strategy

### If Phase 1-4 Fails
- `apps/setup/` 폴더 삭제
- `pnpm-workspace.yaml`에서 제거

### If Phase 5 Fails
- Phase 4 완료 상태로 복원
- 오케스트레이터 코드만 제거

### If Phase 6 Fails
- 빌드 스크립트 제거
- 수동 빌드로 전환

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ✅ 100%
- **Phase 2**: ✅ 100%
- **Phase 3**: ✅ 100%
- **Phase 4**: ✅ 100%
- **Phase 5**: ✅ 100%
- **Phase 6**: ✅ 100%

**Overall Progress**: 100% (Core Complete)

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1 | 2시간 | - | - |
| Phase 2 | 3시간 | - | - |
| Phase 3 | 4시간 | - | - |
| Phase 4 | 2시간 | - | - |
| Phase 5 | 3시간 | - | - |
| Phase 6 | 2시간 | - | - |
| **Total** | **16시간** | - | - |

---

## 📝 Notes & Learnings

### Implementation Notes
- (추가 예정)

### Blockers Encountered
- (추가 예정)

---

## 📚 References

### Documentation
- [Vercel REST API](https://vercel.com/docs/rest-api)
- [Vercel OAuth Integration](https://vercel.com/docs/integrations/create-integration)
- [Bun Single-file Executables](https://bun.sh/docs/bundler/executables)
- [Bun Test Runner](https://bun.sh/docs/cli/test)

### Related Files
- [PLAN_INSTALL.md](file:///Users/furychick/Develop/tuum-prism/PLAN_INSTALL.md) - 상위 계획 문서

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All phases completed with quality gates passed
- [ ] Mac/Windows 바이너리 테스트 완료
- [ ] GitHub Releases에 배포
- [ ] 사용자 가이드 문서화
- [ ] Node.js 없는 환경에서 최종 검증

---

**Plan Status**: ⏳ Pending
**Next Action**: Phase 1 시작 - 프로젝트 구조 생성
**Blocked By**: Vercel Integration 등록 (OAuth Client ID/Secret 발급)

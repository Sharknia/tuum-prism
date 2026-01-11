# Tuum Setup - 원터치 설치 도구

Vercel에 Tuum Blog를 배포하는 CLI 설치 마법사입니다.

## 📋 사전 준비

### 1. Vercel Access Token 발급

1. https://vercel.com/account/tokens 접속
2. "Create Token" 클릭
3. 이름 입력 (예: `tuum-setup`)
4. Scope: 원하는 팀/개인 선택
5. "Create" 클릭
6. **토큰 복사해두기** (한 번만 보여집니다!)

### 2. Notion 설정

1. https://www.notion.so/my-integrations 에서 Integration 생성
2. API Key 복사 (`secret_xxx` 형식)
3. 블로그용 Database 생성 또는 템플릿 복제
4. Database ID 확인 (URL에서 추출)

---

## 🚀 실행 방법

### 방법 1: 바이너리 직접 실행 (권장)

```bash
# 저장소 루트에서
./apps/setup/dist/tuum-setup
```

### 방법 2: Bun 개발 모드

```bash
cd apps/setup
bun run src/index.ts
```

### 방법 3: pnpm 스크립트

```bash
# 루트에서
pnpm --filter @tuum/setup dev
```

---

## 📝 설치 흐름

실행하면 다음 단계를 거칩니다:

```
🚀 Tuum Blog 설치를 시작합니다!

[1/5] Vercel 인증
      ? Vercel Access Token: ********
      ✅ 인증 완료: your@email.com

[2/5] Notion 설정
      ? Notion API Key: ********
      ? Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

[3/5] 블로그 설정
      ? 블로그 제목: My Tech Blog
      ? 작성자 이름: @username

[4/5] 소셜 링크 (선택)
      ? GitHub URL: https://github.com/username
      ? Email: hello@example.com

[5/5] Vercel 프로젝트 생성
      ✅ 프로젝트 생성 완료: my-tech-blog
      ✅ 환경변수 6개 설정 완료

🎉 설치가 완료되었습니다!
```

---

## 🔧 문제 해결

### "유효하지 않은 토큰입니다"
- 토큰이 만료되었거나 잘못 복사됨
- https://vercel.com/account/tokens 에서 새 토큰 발급

### "API 오류: 403"
- 토큰의 Scope가 올바른지 확인
- 팀 프로젝트라면 해당 팀에 대한 권한 필요

### Notion 연결 안 됨
- API Key가 `secret_` 또는 `ntn_`으로 시작하는지 확인
- Database에 Integration 권한이 부여되었는지 확인

---

## 📦 빌드

바이너리를 직접 빌드하려면:

```bash
cd apps/setup
bun build src/index.ts --compile --outfile dist/tuum-setup
```

크로스 플랫폼 빌드:
```bash
# Mac
bun build src/index.ts --compile --target=bun-darwin-arm64 --outfile dist/tuum-setup-macos

# Windows
bun build src/index.ts --compile --target=bun-windows-x64 --outfile dist/tuum-setup-win.exe
```

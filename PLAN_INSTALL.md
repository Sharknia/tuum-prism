# 원터치 설치 시스템 구현 계획 (One-Touch Install System)

## 📌 목표
Node.js나 Vercel CLI 없이, **단일 실행 파일** 하나만으로 Vercel 배포 및 블로그 설정을 완료할 수 있도록 합니다.

---

## 🏗️ 아키텍처: REST API 직접 호출 방식

기존 계획(Vercel CLI 번들링)을 폐기하고, **Vercel REST API를 직접 호출**하는 경량 방식으로 전환합니다.

### 기존 vs 신규 비교

| 항목 | 기존 (CLI 번들링) | 신규 (REST API) |
|------|------------------|-----------------|
| 바이너리 크기 | 150~300MB | **~10MB** |
| Native Module | 필요 (복잡) | **불필요** |
| 버전 의존성 | CLI 버전 고정 | **API 버전만 관리** |
| 구현 복잡도 | 높음 (pkg VFS 이슈) | **낮음** |

### 구성 요소

```
┌────────────────────────────────────────────┐
│            tuum-setup (~10MB)              │
├────────────────────────────────────────────┤
│  1. OAuth 로그인 (로컬 서버 + 브라우저)      │
│  2. 설정 수집 UI (대화형 프롬프트)           │
│  3. Vercel REST API 호출                   │
│  4. 파일 업로드 & 배포                      │
└────────────────────────────────────────────┘
                    │
                    ▼  HTTPS
┌────────────────────────────────────────────┐
│            api.vercel.com                  │
└────────────────────────────────────────────┘
```

---

## 🔐 인증: OAuth 2.0 자동화

사용자가 브라우저에서 로그인만 하면 토큰을 자동으로 발급받습니다.

### 흐름

```
1. tuum-setup 실행
2. 로컬 서버 시작 (localhost:3000)
3. 브라우저 자동 실행 → Vercel OAuth 페이지
4. 사용자가 "Authorize" 클릭
5. 브라우저 → localhost:3000/callback 리다이렉트
6. Authorization Code → Access Token 교환
7. 토큰 저장 후 설정 단계로 진행
```

### 사전 요구사항

- **Vercel Integration 등록**: Vercel Dashboard에서 OAuth 앱 생성
- **Client ID / Secret**: 등록 후 발급
- **Redirect URI**: `http://localhost:3000/callback` 등록

### 코드 예시

```javascript
const http = require('http');
const open = require('open');

const CLIENT_ID = 'oac_xxxxxxxxxx';
const CLIENT_SECRET = process.env.VERCEL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

async function authenticate() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost:3000');
      
      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        
        // Code → Token 교환
        const tokenRes = await fetch('https://api.vercel.com/v2/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            redirect_uri: REDIRECT_URI
          })
        });
        
        const { access_token } = await tokenRes.json();
        
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>✅ 인증 완료!</h1><p>이 창을 닫고 터미널로 돌아가세요.</p>');
        server.close();
        resolve(access_token);
      }
    }).listen(3000);

    // 브라우저 자동 실행
    const authUrl = `https://vercel.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    open(authUrl);
    
    console.log('🌐 브라우저에서 Vercel 로그인을 진행해주세요...');
  });
}
```

---

## 🛠️ REST API 활용

### 1. 프로젝트 생성

```javascript
async function createProject(token, name) {
  const res = await fetch('https://api.vercel.com/v9/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      framework: 'nextjs'
    })
  });
  return res.json();
}
```

### 2. 환경변수 설정

```javascript
async function setEnvVariables(token, projectId, envVars) {
  // envVars: [{ key: 'NOTION_API_KEY', value: 'secret_xxx', target: ['production'] }]
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(envVars)
  });
  return res.json();
}
```

### 3. 배포 (파일 업로드)

```javascript
async function deploy(token, projectName, files) {
  // files: [{ file: 'package.json', data: '...' }, ...]
  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: projectName,
      files,
      target: 'production'
    })
  });
  return res.json();
}
```

---

## 📦 패키징: pkg 또는 Bun

### 옵션 A: pkg (Node.js)

```json
{
  "name": "tuum-setup",
  "bin": "src/index.js",
  "pkg": {
    "targets": ["node18-macos-x64", "node18-win-x64"],
    "outputPath": "dist"
  },
  "dependencies": {
    "open": "^10.0.0",
    "prompts": "^2.4.2"
  }
}
```

```bash
npx pkg . --output dist/tuum-setup
```

### 옵션 B: Bun (더 경량)

```bash
bun build src/index.ts --compile --outfile dist/tuum-setup
```

- 바이너리 크기: ~10MB
- 빌드 속도: 더 빠름
- Native module 이슈 없음

---

## 🚶 사용자 시나리오 (User Journey)

### 1. 준비
- [x] Notion 템플릿 복제 & API Key 획득
- ~~GitHub 레포지토리 Clone~~ → **불필요! CLI가 자동으로 소스 다운로드**

### 2. 바이너리 다운로드
- [GitHub Releases](https://github.com/Sharknia/tuum-prism/releases)에서 OS에 맞는 파일 다운로드
  - Mac: `tuum-setup-macos`
  - Windows: `tuum-setup-win.exe`
  - Linux: `tuum-setup-linux`

### 3. 실행

**Mac:**
```bash
./tuum-setup
```

**Windows:**
```cmd
tuum-setup.exe
```

**(Node.js, npm, Vercel CLI 설치 불필요!)**

### 3. 대화형 설정

```
🚀 Tuum Blog 설치 마법사

[1/6] Vercel 로그인
      → 브라우저가 열립니다. 로그인 후 권한을 승인해주세요.
      ✅ 로그인 성공!

[2/6] Notion 설정
      ? Notion API Key: secret_xxxxxxxxxxxxxxx
      ? Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

[3/6] 블로그 기본 정보
      ? 블로그 제목: My Tech Blog
      ? 블로그 설명: 개발 이야기를 담는 공간
      ? 작성자 이름: John Doe

[4/6] 소셜 링크 (선택)
      ? GitHub URL: https://github.com/username
      ? X(Twitter) URL: 
      ? Email: hello@example.com

[5/6] 환경변수 설정 중...
      ✅ NOTION_API_KEY 설정 완료
      ✅ NOTION_DATABASE_ID 설정 완료
      ✅ NEXT_PUBLIC_SITE_TITLE 설정 완료

[6/6] 배포 중...
      ⏳ 파일 업로드 중... (234개 파일)
      ⏳ 빌드 중... 
      ✅ 배포 완료!

🎉 축하합니다! 블로그가 배포되었습니다.
   https://my-tech-blog.vercel.app
```

---

## ✅ 검증 포인트

1. **무설치 환경**: Node.js가 없는 PC에서 실행 파일만으로 동작하는가?
2. **크로스 플랫폼**: Windows와 Mac에서 동일하게 동작하는가?
3. **OAuth 인증**: 브라우저 로그인 → 토큰 발급이 정상 동작하는가?
4. **API 호출**: 프로젝트 생성, 환경변수 설정, 배포가 정상 수행되는가?
5. **에러 핸들링**: 네트워크 오류, 인증 실패 시 명확한 메시지 제공하는가?
6. **바이너리 크기**: 최종 크기가 20MB 이하인가?

---

## 📅 구현 로드맵

### Phase 1: 핵심 기능 (MVP)
- [x] PAT 인증 모듈 (OAuth는 추후)
- [x] 대화형 설정 UI
- [x] 환경변수 설정 API 연동
- [x] 기본 배포 기능
- [x] GitHub Archive 자동 다운로드 (로컬 파일 불필요)

### Phase 2: 안정화
- [ ] 에러 핸들링 강화
- [ ] 재시도 로직 (네트워크 오류)
- [ ] 진행 상황 표시 개선

### Phase 3: 패키징 & 배포
- [x] Bun으로 바이너리 생성
- [x] GitHub Actions 크로스 플랫폼 빌드 (`.github/workflows/release-setup.yml`)
- [x] GitHub Releases 자동화
- [ ] 설치 가이드 문서화

---

## 📚 참고 자료

- [Vercel REST API 문서](https://vercel.com/docs/rest-api)
- [Vercel OAuth Integration](https://vercel.com/docs/integrations/create-integration)
- [pkg 패키지](https://github.com/vercel/pkg)
- [Bun Single-file Executables](https://bun.sh/docs/bundler/executables)

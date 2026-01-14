# Phase 2: LinkedIn 토큰 자동 갱신

**예상 소요**: 2-3시간
**의존성**: Phase 1 완료

---

## 목표

LinkedIn Access Token을 자동으로 갱신하고, Refresh Token 만료 시 알림을 발송합니다.

---

## To-Do

### 2.1 GitHub Actions 워크플로우 생성

**파일**: `.github/workflows/refresh-linkedin-token.yml`

- [ ] Cron 스케줄 설정 (매주 월요일)
- [ ] workflow_dispatch 추가 (수동 트리거)

### 2.2 Edge Config에서 토큰 조회

- [ ] Edge Config API로 현재 토큰 조회
- [ ] `LINKEDIN_REFRESH_TOKEN` 추출
- [ ] `LINKEDIN_TOKEN_ISSUED_AT` 추출

### 2.3 만료일 계산 로직

- [ ] Access Token 잔여일 계산 (60일 기준)
- [ ] Refresh Token 잔여일 계산 (365일 기준)
- [ ] 갱신 필요 여부 판단 (7일 이하면 갱신)

### 2.4 Access Token 갱신

- [ ] LinkedIn Token Refresh API 호출
- [ ] 새 Access Token 추출
- [ ] Edge Config 업데이트

### 2.5 Refresh Token 만료 알림

- [ ] 잔여일 30일 이하 시 GitHub Issue 생성
- [ ] Issue 제목: "🔔 LinkedIn 재인증 필요 (30일 이내 만료)"
- [ ] Issue 본문에 재인증 URL 포함

### 2.6 에러 핸들링

- [ ] Token Refresh 실패 시 알림
- [ ] Edge Config 업데이트 실패 시 알림

---

## 완료 기준

- [ ] 매주 월요일 자동 실행
- [ ] Access Token 만료 7일 전 자동 갱신
- [ ] Refresh Token 만료 30일 전 GitHub Issue 생성
- [ ] 수동 트리거로 즉시 갱신 가능

---

## 참고 코드

```yaml
# .github/workflows/refresh-linkedin-token.yml
name: Refresh LinkedIn Token

on:
  schedule:
    - cron: "0 0 * * 1" # 매주 월요일
  workflow_dispatch:

jobs:
  refresh-token:
    runs-on: ubuntu-latest
    steps:
      - name: Get current tokens from Edge Config
        id: get-tokens
        run: |
          TOKENS=$(curl -s "https://edge-config.vercel.com/${{ secrets.EDGE_CONFIG_ID }}" \
            -H "Authorization: Bearer ${{ secrets.EDGE_CONFIG_TOKEN }}")
          echo "refresh_token=$(echo $TOKENS | jq -r '.LINKEDIN_REFRESH_TOKEN')" >> $GITHUB_OUTPUT
          echo "issued_at=$(echo $TOKENS | jq -r '.LINKEDIN_TOKEN_ISSUED_AT')" >> $GITHUB_OUTPUT

      - name: Check if refresh needed
        id: check
        run: |
          ISSUED_AT=${{ steps.get-tokens.outputs.issued_at }}
          NOW=$(date +%s)
          DAYS_ELAPSED=$(( (NOW - ISSUED_AT/1000) / 86400 ))
          ACCESS_EXPIRES_IN=$(( 60 - DAYS_ELAPSED ))
          REFRESH_EXPIRES_IN=$(( 365 - DAYS_ELAPSED ))

          echo "access_expires_in=$ACCESS_EXPIRES_IN" >> $GITHUB_OUTPUT
          echo "refresh_expires_in=$REFRESH_EXPIRES_IN" >> $GITHUB_OUTPUT

          if [ $ACCESS_EXPIRES_IN -le 7 ]; then
            echo "needs_refresh=true" >> $GITHUB_OUTPUT
          else
            echo "needs_refresh=false" >> $GITHUB_OUTPUT
          fi

      - name: Refresh Access Token
        if: steps.check.outputs.needs_refresh == 'true'
        run: |
          # Token refresh logic

      - name: Alert if Refresh Token expiring soon
        if: steps.check.outputs.refresh_expires_in <= 30
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔔 LinkedIn 재인증 필요 (30일 이내 만료)',
              body: '재인증 URL: ...',
              labels: ['urgent', 'auth']
            })
```

---

## 다음 Phase

→ [Phase 3: SNS 포스팅 핵심 로직](./PHASE-3-CORE-POSTING.md)

# Notion 설정 가이드

Tuum Blog가 Notion 데이터베이스에서 글을 가져오기 위해 필요한 설정입니다.

## 1. Notion Integration 생성

1. [Notion Integrations](https://www.notion.so/my-integrations) 페이지 접속
2. **"+ New integration"** 클릭
3. 설정:
   - **Name**: `tuum-blog` (원하는 이름)
   - **Associated workspace**: 사용할 워크스페이스 선택
   - **Capabilities**: "Read content" 체크
4. **"Submit"** 클릭
5. **"Internal Integration Secret"** 복사
   - `secret_` 또는 `ntn_`으로 시작합니다

> ⚠️ 이 시크릿은 한 번만 표시됩니다. 안전한 곳에 저장하세요!

---

## 2. Database 생성

### 옵션 A: 템플릿 복제 (권장)

[Tuum Blog 템플릿](https://www.notion.so/templates/tuum-blog)을 복제하세요.

### 옵션 B: 직접 생성

새 Database를 만들고 다음 속성을 추가하세요:

| 속성 이름 | 타입 | 필수 | 설명 |
|-----------|------|------|------|
| `title` | Title | ✅ | 게시글 제목 |
| `description` | Text | | 게시글 설명 |
| `date` | Date | ✅ | 작성/발행일 |
| `status` | Select | ✅ | Draft, Published |
| `tags` | Multi-select | | 태그 목록 |
| `series` | Select | | 시리즈 이름 |

---

## 3. Database와 Integration 연결

1. 생성한 Database 페이지 열기
2. 우측 상단 **"..."** 클릭
3. **"Add connections"** 클릭
4. 방금 만든 Integration (`tuum-blog`) 선택
5. **"Confirm"** 클릭

---

## 4. Database ID 확인

Database 페이지의 URL을 확인하세요:

```
https://www.notion.so/[WORKSPACE]/[DATABASE_ID]?v=[VIEW_ID]
```

- `DATABASE_ID` 부분이 필요합니다
- 32자의 영숫자 문자열입니다
- 예: `12345678abcd1234efgh5678ijkl9012`

또는 하이픈이 포함된 UUID 형식:
```
12345678-abcd-1234-efgh-5678ijkl9012
```

---

## 5. 설정 완료

`tuum-setup`을 실행할 때:

1. **Notion API Key**: 복사한 Integration Secret
2. **Database ID**: 위에서 확인한 ID

입력하면 됩니다!

---

## 문제 해결

### "unauthorized" 오류
- Database에 Integration 연결이 되어있는지 확인하세요
- Integration Secret이 올바른지 확인하세요

### "object_not_found" 오류
- Database ID가 올바른지 확인하세요
- Database가 삭제되지 않았는지 확인하세요

### 글이 안 보여요
- 게시글의 `status` 속성이 `Published`인지 확인하세요
- `date` 속성이 설정되어 있는지 확인하세요

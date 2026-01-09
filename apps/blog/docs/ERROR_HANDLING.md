# 에러 핸들링 가이드

> **대상**: `apps/blog` 개발자

---

## 개요

이 프로젝트는 **Result 패턴**을 사용하여 에러를 처리합니다. 전통적인 예서 던지기 대신, 성공/실패를 값으로 표현하여 타입 안전한 에러 핸들링을 제공합니다.

## 핵심 개념

### Result 타입

```typescript
// src/domain/result.ts
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };
```

### AppError 클래스

```typescript
// src/domain/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number,
    public readonly originalError?: unknown
  ) { ... }
}
```

---

## 에러 코드

| 코드             | HTTP 상태 | 설명        | 사용 예                         |
| ---------------- | --------- | ----------- | ------------------------------- |
| `NOT_FOUND`      | 404       | 리소스 없음 | 존재하지 않는 포스트 ID         |
| `UNAUTHORIZED`   | 401       | 인증 오류   | Notion API 키 오류              |
| `INTERNAL_ERROR` | 500       | 서버 오류   | 네트워크 오류, 예상치 못한 예외 |

---

## 사용법

### 1. Repository에서 Result 반환

```typescript
// infrastructure/notion/notion.repository.ts
async findById(id: string): Promise<Result<Post>> {
  try {
    const page = await this.notion.pages.retrieve({ page_id: id });
    if (!isFullPage(page)) {
      return fail(AppError.notFound('포스트'));
    }
    return ok(mapNotionPageToPost(page));
  } catch (error) {
    if (this.isNotionApiError(error) && error.code === 'object_not_found') {
      return fail(AppError.notFound('포스트'));
    }
    return fail(AppError.internal('서버 오류', error));
  }
}
```

### 2. 페이지에서 Result 처리

```typescript
// app/blog/[id]/page.tsx
const result = await postRepository.findById(id);

if (!result.success) {
  if (result.error.code === ErrorCode.NOT_FOUND) {
    notFound(); // Next.js 404 페이지
  }
  throw result.error; // error.tsx에서 처리
}

const post = result.data;
```

### 3. 헬퍼 함수

```typescript
import { ok, fail, isOk, isFail } from '@/domain/result';

// 성공 결과 생성
const success = ok({ id: 1, name: 'test' });

// 실패 결과 생성
const failure = fail(AppError.notFound('리소스'));

// 타입 가드
if (isOk(result)) {
  console.log(result.data); // T 타입
}
if (isFail(result)) {
  console.log(result.error); // E 타입
}
```

---

## 커스텀 에러 페이지

### 404 페이지

```typescript
// app/blog/[id]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h1>404</h1>
      <p>포스트를 찾을 수 없습니다</p>
      <Link href="/">홈으로</Link>
    </div>
  );
}
```

### 500 에러 페이지

```typescript
// app/blog/[id]/error.tsx
'use client';

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div>
      <h1>오류</h1>
      <p>서버에서 문제가 발생했습니다</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

---

## 팩토리 메서드

```typescript
// 리소스 없음
AppError.notFound('포스트');
// → { code: NOT_FOUND, statusCode: 404, message: '포스트을(를) 찾을 수 없습니다' }

// 서버 오류
AppError.internal('데이터베이스 연결 실패', originalError);
// → { code: INTERNAL_ERROR, statusCode: 500, message: '데이터베이스 연결 실패', originalError }
```

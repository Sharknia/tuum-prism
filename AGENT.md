# Tuum Prism - AI Context

## ⚠️ Maintenance Policy

Update this document when:

- Adding/removing packages or directories
- Changing data flow or layer dependencies
- Adding new entry points, routes, or major types
- Modifying Notion database schema

Skip for: bug fixes, styling, minor refactors.

---

## Overview

**Notion CMS → Blog multi-publishing monorepo.**

Currently supports blog. SNS publishing infrastructure (LinkedIn OAuth + Token Auto-Refresh + Core Posting + Platform Posting for X/LinkedIn/Threads + Notion Write-back) is fully implemented.

## Tech Stack

| Category        | Technology              |
| --------------- | ----------------------- |
| Framework       | Next.js 16 (App Router) |
| Language        | TypeScript (strict)     |
| Styling         | Tailwind CSS v4         |
| Package Manager | pnpm + Turborepo        |
| Deployment      | Vercel                  |
| Dev Port        | 36001                   |

## Package Relationships

```
apps/blog ──uses──→ packages/refract-notion
apps/setup ─deploys→ apps/blog (via Vercel API)
```

| Package                | Path                      | Description                                   |
| ---------------------- | ------------------------- | --------------------------------------------- |
| `@tuum/blog`           | `apps/blog`               | Next.js blog application                      |
| `@tuum/setup`          | `apps/setup`              | One-touch CLI installer (Bun compiled binary) |
| `@tuum/refract-notion` | `packages/refract-notion` | Headless Notion renderer (Official SDK only)  |

---

## Key Entry Points

| Task             | Start File                                                 |
| ---------------- | ---------------------------------------------------------- |
| Blog home        | `apps/blog/src/app/page.tsx`                               |
| Post detail      | `apps/blog/src/app/blog/[id]/page.tsx`                     |
| About page       | `apps/blog/src/app/about/page.tsx`                         |
| Series list      | `apps/blog/src/app/(main)/series/page.tsx`                 |
| Series detail    | `apps/blog/src/app/(main)/series/[slug]/page.tsx`          |
| LinkedIn OAuth   | `apps/blog/src/app/api/auth/linkedin/route.ts`             |
| OAuth Callback   | `apps/blog/src/app/api/auth/linkedin/callback/route.ts`    |
| Token Refresh    | `.github/workflows/refresh-linkedin-token.yml`             |
| SNS Auto Post    | `.github/workflows/sns-auto-post.yml`                      |
| Notion rendering | `packages/refract-notion/src/components/BlockRenderer.tsx` |
| Setup CLI        | `apps/setup/src/cli.ts` → `orchestrator.ts`                |

---

## Layer Architecture (apps/blog)

```
src/
├── app/                    # Next.js App Router (RSC)
│   ├── (main)/             # Route group for series
│   ├── about/              # About page
│   ├── blog/[id]/          # Post detail + error/not-found
│   └── api/                # API routes
├── application/            # Use cases, Port interfaces
│   └── post/               # PostRepository interface
├── domain/                 # Entities, business logic
│   ├── errors/             # AppError, ErrorCode
│   ├── post/               # Post entity, PostStatus enum
│   └── result.ts           # Result<T, E> pattern
├── infrastructure/         # External system adapters
│   ├── notion/             # Notion API implementation
│   ├── image/              # Image storage (Blob/Passthrough)
│   └── edge-config/        # Vercel Edge Config client (LinkedIn tokens)
├── components/             # React components
│   ├── filter/             # SearchBar, TagSidebar, SeriesDropdown
│   ├── layout/             # Header, Footer, ThemeToggle, etc.
│   ├── notion/             # NotionRenderer, EnhancedCodeBlock
│   ├── post/               # PostCard, PostList, TableOfContents
│   ├── profile/            # Profile, SocialIcons
│   └── series/             # SeriesCard
├── config/                 # Configuration
│   ├── env.ts              # Zod schema for env validation
│   └── site.config.ts      # Blog/owner settings
├── lib/                    # Utilities
│   ├── cache.ts            # unstable_cache wrappers
│   ├── reading-time.ts     # Reading time calculator
│   ├── toc-extractor.ts    # Table of contents extractor
│   └── utils.ts            # General utilities
└── styles/                 # CSS files
```

---

## Core Types & Patterns

| Type               | Location                                           | Purpose                              |
| ------------------ | -------------------------------------------------- | ------------------------------------ |
| `Result<T, E>`     | `domain/result.ts`                                 | Error-as-value pattern (no throwing) |
| `Post`             | `domain/post/post.entity.ts`                       | Blog post entity                     |
| `PostStatus`       | `domain/post/post-status.enum.ts`                  | `Updated`, `Writing`, `About`, etc.  |
| `PostRepository`   | `application/post/post.repository.ts`              | Port interface (DI)                  |
| `AppError`         | `domain/errors/app-error.ts`                       | Typed error with `ErrorCode`         |
| `ImageService`     | `infrastructure/image/image.types.ts`              | Image processing interface           |
| `EdgeConfigClient` | `infrastructure/edge-config/edge-config.client.ts` | Vercel Edge Config CRUD              |
| `LinkedInTokens`   | `infrastructure/edge-config/edge-config.types.ts`  | LinkedIn OAuth tokens type           |
| Token Expiry Utils | `infrastructure/edge-config/token-expiry.ts`       | Token expiry calculation (60d/365d)  |

### Factory Pattern

```typescript
// infrastructure/image/index.ts
createImageService()
  → BLOB_READ_WRITE_TOKEN exists? ImageServiceImpl : PassthroughImageService
```

---

## API Routes

| Route                         | Method | Description                              |
| ----------------------------- | ------ | ---------------------------------------- |
| `/api/auth/linkedin`          | GET    | Start LinkedIn OAuth flow (redirect)     |
| `/api/auth/linkedin/callback` | GET    | OAuth callback, token exchange & storage |
| `/api/notion/test`            | GET    | Notion connection test (dev only)        |

---

## Data Flow

```
[Page Component]
       ↓
PostRepository.findById(id)
       ↓
NotionPostRepository (infrastructure)
       ↓
Notion API (@notionhq/client)
       ↓
Result<Post, AppError>
       ↓
[Render with NotionRenderer]
       ↓
BlockRenderer (@tuum/refract-notion)
```

---

## Notion Database Schema

| Property      | Type             | Description                                                                       |
| ------------- | ---------------- | --------------------------------------------------------------------------------- |
| `title`       | title            | Post title                                                                        |
| `상태`        | select           | Status: `Writing`, `Ready`, `Updated`, `ToBeDeleted`, `Deleted`, `Error`, `About` |
| `date`        | date             | Publish date                                                                      |
| `update`      | last_edited_time | Auto-updated timestamp                                                            |
| `tags`        | multi_select     | Post tags (dynamic)                                                               |
| `series`      | select           | Series name (dynamic)                                                             |
| `description` | rich_text        | SEO description                                                                   |
| `systemLog`   | rich_text        | System log field                                                                  |
| `IDX`         | unique_id        | Auto ID with `NUM-` prefix                                                        |

**Special behavior:**

- Posts with `상태 = Updated` are shown on blog
- Posts with `상태 = About` are shown on `/about` page
- If no About post exists, About link is hidden in header

---

## refract-notion Exports

```typescript
// packages/refract-notion/src/index.ts
export { getBlocks } from './client/fetcher';      // Recursive block fetcher
export { BlockRenderer } from './components/BlockRenderer';
export { RichText } from './components/RichText';
export { Typography } from './components/Typography';
export { colorMapper } from './utils/color-mapper';
export type { NotionBlock, ... } from './types';
```

---

## apps/setup Structure

```
src/
├── cli.ts              # Entry point
├── orchestrator.ts     # Main installation flow (6 steps)
├── api/                # Vercel API wrappers
│   ├── client.ts       # HTTP client
│   ├── deploy.ts       # Deployment creation
│   ├── env.ts          # Environment variables
│   ├── project.ts      # Project management
│   └── source.ts       # GitHub source download
├── auth/               # Vercel PAT authentication
├── config/             # User prompts, validation
└── ui/                 # Progress display
```

**Release:** Push tag `setup-v*` → GitHub Actions builds binaries for macOS/Windows/Linux → Auto-uploads to Releases.

---

## GitHub Actions Workflows

| Workflow                     | Trigger                         | Purpose                              |
| ---------------------------- | ------------------------------- | ------------------------------------ |
| `release-setup.yml`          | Tag `setup-v*`                  | Build & release setup binaries       |
| `refresh-linkedin-token.yml` | Weekly (Mon 00:00 UTC) / Manual | Auto-refresh LinkedIn Access Token   |
| `sns-auto-post.yml`          | Hourly (every hour) / Manual    | Fetch Ready posts, transform for SNS |

### LinkedIn Token Refresh Workflow

**Schedule:** Every Monday at 00:00 UTC (`cron: '0 0 * * 1'`)

**Features:**

- Reads tokens from Vercel Edge Config
- Calculates token expiry (Access: 60d, Refresh: 365d)
- Auto-refreshes Access Token if ≤7 days remaining
- Creates GitHub Issue if Refresh Token expires in ≤30 days
- Prevents duplicate alert issues
- Generates workflow summary

**Required Secrets:**

```
EDGE_CONFIG_ID, EDGE_CONFIG_TOKEN, VERCEL_TOKEN
LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
NEXT_PUBLIC_BASE_URL
```

---

## Modification Guide

| Change                    | Files to Modify                                       |
| ------------------------- | ----------------------------------------------------- |
| New Notion block type     | `refract-notion/src/components/BlockRenderer.tsx`     |
| New filter option         | `blog/src/components/filter/`                         |
| Notion property change    | `blog/src/infrastructure/notion/notion.mapper.ts`     |
| New page route            | `blog/src/app/[route]/page.tsx`                       |
| Add environment variable  | `blog/src/config/env.ts` (schema)                     |
| Add Edge Config feature   | `blog/src/infrastructure/edge-config/`                |
| Site config change        | `blog/src/config/site.config.ts`                      |
| New image storage adapter | `blog/src/infrastructure/image/`                      |
| Add GitHub Actions        | `.github/workflows/` + update this doc                |
| Token expiry logic change | `blog/src/infrastructure/edge-config/token-expiry.ts` |

---

## Test Strategy

| Package                   | Pattern     | Location                          |
| ------------------------- | ----------- | --------------------------------- |
| `apps/blog`               | Co-location | `*.test.ts` next to source        |
| `packages/refract-notion` | Co-location | `*.test.tsx` next to source       |
| `apps/setup`              | Separated   | `test/unit/`, `test/integration/` |

**Commands:**

```bash
pnpm test        # Run all tests
pnpm check       # lint + typecheck + format
pnpm build       # Production build
```

---

## Git Branch Strategy

```
feature/* → dev → main
```

| Branch      | Environment       | Purpose      |
| ----------- | ----------------- | ------------ |
| `feature/*` | localhost:36001   | Development  |
| `dev`       | Vercel Preview    | User testing |
| `main`      | Vercel Production | Live site    |

**Rules:**

- Always branch from `dev`
- Merge with `--no-ff`
- User approval required before merge to `main`

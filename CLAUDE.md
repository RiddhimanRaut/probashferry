# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev              # Next.js dev server on localhost:3000
npm run build            # Production build (static generation)
npm run lint             # ESLint with Next.js config
npm run test:e2e         # All Playwright tests (iPhone 14, SE, Pixel 7, Desktop Chrome)
npm run test:e2e:mobile  # Mobile device tests only
npm run test:e2e:desktop # Desktop Chrome tests only
npm run test:e2e:ui      # Playwright interactive UI mode
vercel --prod            # Manual production deploy (no auto-deploy from git)
```

## Project Overview

Probashferry is a digital magazine for the Bengali diaspora, built as a Next.js 14 app with a swipeable magazine-style reader. Content is authored as MDX files, parsed at build time, and rendered as full-screen panels.

## Architecture

### Content Pipeline

MDX files in `content/articles/en/` → `src/lib/articles.ts` parses with gray-matter + remark → `Article[]` sorted by category order (Letters → Photography → Comics → Art), then by date → passed to MagazineViewer.

Each article's `category` field determines which panel component renders it. The `photos` array (with optional `panels` for multi-image carousels) drives gallery sections.

### Magazine Viewer (`src/components/magazine/MagazineViewer.tsx`)

The core UI. Renders a horizontal sequence of full-screen panels:

```
[CoverPanel] → [ArticlePanel|PhotoGalleryPanel|ComicsGalleryPanel|ArtGalleryPanel]... → [TeamPanel] → [SubmitPanel]
```

MagazineViewer owns all gesture handling (swipe, single-tap for controls, double-tap for likes, keyboard nav). It routes double-tap events to individual cards via `doubleTapEvent` prop and per-card hit-testing. Panel navigation uses `useSwipe` hook which persists index to sessionStorage.

Category routing is a conditional chain — order matters. Comics must come before Art.

### Gallery Panel Pattern

PhotoGalleryPanel, ArtGalleryPanel, and ComicsGalleryPanel follow the same structure:
- Hero cover (70vh) with gradient fade and category badge
- Card list — each card wraps `data-likeable`, uses `useLike` with `{slug}-photo-{index}` IDs
- Single-tap → PhotoViewer (400ms delay to distinguish from double-tap), double-tap → like
- Action bar: LikeButton + CommentsSection + ShareButton, all `variant="dark"`
- Optional MDX prose body → Footer

The double-tap delay pattern (400ms singleTapTimer) is critical — it prevents the viewer from opening when the user is liking.

### Comics Carousel (`ComicsGalleryPanel.tsx`)

Multi-panel comics use a Framer Motion carousel with `useMotionValue` + `fmAnimate` for position control (not `animate` prop, which fights with `drag`). Touch events are `stopPropagation()`ed to prevent MagazineViewer swipe. A composite "full page" slide is appended showing all panels in a grid.

### Firebase / Firestore

Auth: Google OAuth via Firebase Auth with redirect flow. Firestore uses a custom REST client (`src/lib/firebase/firestore-rest.ts`) instead of the SDK's WebChannel transport.

Collections:
- `articles/{id}` — likeCount, commentCount. Gallery IDs use `{slug}-photo-{index}`.
- `likes/{articleId}/users/{userId}` — one doc per like, presence = liked
- `comments/{articleId}/messages/{commentId}` — text, authorName, createdAt
- `submissions/{uid}_{category}_{issue}` — duplicate submission lock. Written by the API route (service account) after a successful Drive upload. Deleting a doc re-opens that slot.

Likes use atomic batch commits (like-doc write + count increment). Comments poll every 5s. Both use optimistic updates with rollback and poll suppression during writes.

### Submission Pipeline

Reader-facing form at `src/components/magazine/SubmitPanel.tsx` (imported with `ssr: false` to prevent hydration mismatch). Serverless API at `src/app/api/submit/route.ts`.

Flow:
1. Client gets a fresh Firebase ID token (`user.getIdToken()`) and sends it with the FormData
2. API verifies the token via `identitytoolkit.googleapis.com/v1/accounts:lookup` to extract the real UID
3. API checks Firestore for `submissions/{uid}_{category}_{issue}` — returns 409 if found
4. API authenticates with Google Drive via service account (`GOOGLE_SERVICE_ACCOUNT_JSON`)
5. API creates `submissions/{activeIssue}/pending/{slug}/` in Drive and uploads all files + `meta.json`
6. API writes the Firestore submission record to lock the slot

Active issue is read from `content/config.json` (`activeIssue` field). Changing this value and deploying opens a new issue's submission folder automatically on first submission.

### Auth Gating

`useAuthContext()` provides `promptSignIn()` which shows a modal. All like/comment actions check auth first: `if (!user) { promptSignIn(); return; }`. Refs keep callback state fresh to avoid stale closures in gesture handlers.

### Table of Contents (`TableOfContents.tsx`)

Sections are defined in `SECTIONS` constant (Letters, Photography, Comics, Art). The expand chevron is hidden for single-content sections (Photography, Comics, Art). "Coming Soon" badge appears automatically when a section has no articles.

## Styling

Tailwind with custom theme colors: `paper` (#F5F0E8 cream), `charcoal` (#1A1A1A), `terracotta`, `mustard`, `sindoor` (#A52422 for likes), `sage`. Section-specific backgrounds: Photography (`bg-charcoal`), Art (`bg-[#0A0A0A]`), Comics (`bg-[#0D0D1A]`).

Fonts: Playfair Display (headings), Inter (body), Noto Serif Bengali, Caveat (handwriting).

Per-tag colors defined in `src/lib/tags.ts` — flavor tags (Culture, Faith, Travel...) and type tags (Prose, Poem, Memoir...).

## Key Types (`src/types/article.ts`)

```typescript
interface Photo {
  src: string; caption: string;
  title?: string; artist?: string; medium?: string;
  panels?: string[];  // Multi-panel comics carousel
}
interface ArticleMeta {
  slug, title, author, date, excerpt, coverImage, category, readingTime, lang: string;
  photos?: Photo[]; flavor?: string; type?: string;
}
interface Article extends ArticleMeta { content: string; html: string; }
```

## Gesture Constants

```
SWIPE_THRESHOLD = 60px    DOUBLE_TAP_WINDOW = 400ms
TAP_THRESHOLD = 25px      DOUBLE_TAP_DISTANCE = 60px
TAP_HOLD_LIMIT = 500ms    CONTROLS_TIMEOUT = 3000ms
```

## Deployment

Vercel project is linked (`.vercel/project.json`). **No auto-deploy** — deploy manually with `vercel --prod`. Production URL: https://probashferry.vercel.app

Firebase env vars are `NEXT_PUBLIC_FIREBASE_*` in `.env.local` and Vercel dashboard.

## E2E Tests

Playwright config in `playwright.config.ts`. Tests in `e2e/`. Four projects: iPhone 14, iPhone SE, Pixel 7, Desktop Chrome. Service workers are blocked for test consistency. Dev server runs on port 3001 locally, 3000 in CI.

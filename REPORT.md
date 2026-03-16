# Project Report — Probashferry

Current state of the project as of March 2026. Update this file when major features ship or decisions change.

---

## What's live

**Core reader**
- Horizontal swipe navigation across full-screen panels (CoverPanel → EditorialPanel → content panels → TeamPanel)
- Smooth ease-out expo transitions (`[0.22, 1, 0.36, 1]`, 300ms) — Instagram-like feel
- Keyboard navigation (arrow keys)
- Session-persistent panel index (sessionStorage — survives refresh, resets on tab close)
- Page indicator dots at bottom

**Content panels**
- `CoverPanel` — magazine cover with issue info
- `ArticlePanel` — essays, with MDX prose body and reading time
- `EditorialPanel` — letter from the editors, rendered as ArticlePanel at index 1
- `PhotoGalleryPanel` — photo series with hero + card list + full-screen viewer
- `ComicsGalleryPanel` — comics with multi-panel Framer Motion carousel; composite "full page" grid appended automatically
- `ArtGalleryPanel` — same structure as photo, dark theme

**Social features**
- Like system: double-tap on card or tap like button. Atomic Firestore batch commits. Optimistic updates with rollback.
- Comment system: tap comment button on action bar. Polls Firestore every 5s. Optimistic updates.
- Share button: Web Share API with clipboard fallback
- Auth gating: Google OAuth (redirect flow). Modal prompt on first like/comment.

**Table of contents**
- Accessible via hamburger. Lists all sections with article counts.
- Editorial entry at top, section entries below.
- "Coming Soon" badge auto-appears when a section has no articles.
- Expand/collapse chevron hidden for single-item sections.
- Taps navigate directly to that panel.

**Content pipeline**
- MDX files in `content/articles/en/` parsed at build time
- Category order: Essays → Photography → Comics → Art
- Image compression: `npm run images` (ffmpeg, ~quality 85) + pre-commit hook auto-compresses staged JPEGs

**Submission pipeline**
- Reader-facing form: `SubmitPanel.tsx` — auth-gated, category-adaptive, supports Essays (docx + cover), Photography/Art (up to 3 images), Comics (single or multi-panel)
- Serverless API: `src/app/api/submit/route.ts` — verifies Firebase ID token, checks Firestore for duplicate, uploads to Google Drive via service account, records submission in Firestore
- Duplicate prevention: one submission per user per category per issue, enforced by Firestore doc at `submissions/{uid}_{category}_{issue}`
- Drive structure: `submissions/{issue}/pending/` → `accepted/` → `published/`
- Active issue set in `content/config.json`

**Infrastructure**
- Vercel static hosting (manual deploy via `vercel --prod`)
- Firebase Auth + Firestore (custom REST client — avoids WebChannel issues)
- E2E tests: Playwright across iPhone 14, iPhone SE, Pixel 7, Desktop Chrome

---

## Key technical decisions

**Custom Firestore REST client** instead of the Firebase SDK.
The SDK uses WebChannel (long-polling over HTTP/1.1), which has reliability issues on mobile and in certain environments. The REST client is simpler, more predictable, and avoids the WebChannel keepalive noise.

**No auto-deploy from git.**
Deliberate — gives control over when content goes live. Run `vercel --prod` manually.

**`useMotionValue` + `fmAnimate` for the comics carousel** (not the `animate` prop).
Framer Motion's `drag` and `animate` props fight each other for control of the same value. Imperative `fmAnimate` calls work with drag, not against it.

**`articleOffset` constant for panel index math.**
The editorial panel is at index 1, so all article indices are offset by `hasEditorial ? 2 : 1`. This constant is threaded through MagazineViewer and TableOfContents to keep navigation correct.

**400ms single-tap delay on gallery cards.**
Needed to distinguish single-tap (open viewer) from double-tap (like). Without the delay, tapping to open the viewer also triggers a like if the user taps twice.

---

## Known limitations

- Comments poll every 5s — not realtime. Sufficient for current traffic.
- Session index resets on tab close — users always start from the cover on a new session.
- No search or filtering.
- No i18n beyond Bengali font support — all content is in English currently.
- No offline/PWA support.
- No reading progress beyond panel index (no scroll position saved within panels).

---

## Content in the magazine (as of March 2026)

- Editorial (letter from the editors)
- Essays: 1 piece (Brick Lane)
- Photography: placeholder
- Comics: Pepper & Carrot (CC BY 4.0), xkcd strips (CC BY-NC 2.5)
- Art: placeholder

---

## Deployment checklist

Before running `vercel --prod`:
- [ ] `npm run build` passes locally
- [ ] `npm run test:e2e` passes (or mobile subset)
- [ ] New images compressed (`npm run images`)
- [ ] Proofed on `npm run dev`

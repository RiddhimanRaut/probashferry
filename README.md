# Probashferry

A digital magazine for the Bengali diaspora. Built as a swipeable, mobile-first magazine reader — think less blog, more publication.

**Production:** https://probashferry.vercel.app

---

## What it is

Probashferry publishes essays, photography, comics, and art by and for the Bengali diaspora. The reading experience is designed for phones: full-screen panels, swipe to navigate, double-tap to like.

Content is authored as MDX files and rendered at build time — no CMS, no database for content. Likes and comments are stored in Firebase Firestore.

---

## Running locally

```bash
npm install
npm run dev        # localhost:3000
```

You'll need a `.env.local` with Firebase credentials (see `.env.local.example` if it exists, or ask for the values).

---

## Building and deploying

```bash
npm run build      # static build — catches content errors before deploy
vercel --prod      # deploy to production (no auto-deploy from git)
```

The deploy workflow is:
```
git push origin dev
git checkout main && git merge dev && git push origin main
vercel --prod
```

---

## Adding content

See `EDITORIAL.md` for the full submission workflow. Short version:

1. Create `content/articles/en/{slug}.mdx`
2. Drop images in `public/images/`
3. `npm run images` to compress (or just commit — the pre-commit hook does it)
4. Proof locally, then deploy

Content categories (in display order): Letters → Photography → Comics → Art

---

## Testing

```bash
npm run test:e2e          # all devices (iPhone 14, SE, Pixel 7, Desktop Chrome)
npm run test:e2e:mobile   # mobile only
npm run test:e2e:desktop  # desktop only
npm run test:e2e:ui       # interactive Playwright UI
```

---

## Tech stack

- **Next.js 14** — static generation, App Router
- **Framer Motion** — swipe transitions, comic carousels
- **Firebase Auth** — Google OAuth
- **Firestore** — likes, comments (custom REST client, no SDK)
- **Tailwind CSS** — with custom theme (paper, charcoal, terracotta, mustard, sindoor, sage)
- **MDX** — content authoring (gray-matter + remark)
- **Playwright** — E2E tests across 4 device profiles

---

## Project files

| File | Purpose |
|---|---|
| `CLAUDE.md` | Architecture guide for AI-assisted development |
| `EDITORIAL.md` | How to add submissions to the magazine |
| `REPORT.md` | Current project status and decisions log |
| `TRACKER.md` | Feature backlog — what's done, what's planned |

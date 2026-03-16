# Feature Tracker — Probashferry

One feature per chat session. Pick one item from **Planned** and move it to **In Progress** when you start. Move to **Done** when shipped.

---

## Done

- [x] Core magazine viewer — horizontal swipe navigation, full-screen panels
- [x] CoverPanel
- [x] ArticlePanel (essays with MDX body)
- [x] PhotoGalleryPanel — hero + card list + full-screen PhotoViewer
- [x] ArtGalleryPanel — same structure as photo, dark theme
- [x] ComicsGalleryPanel — multi-panel Framer Motion carousel + composite "full page" grid
- [x] TeamPanel
- [x] EditorialPanel — letter from the editors, inserted at panel index 1
- [x] Table of contents — section listing, article navigation, coming-soon badges
- [x] Like system — double-tap or button, Firestore batch commits, optimistic updates
- [x] Comment system — action bar button, Firestore polling every 5s, optimistic updates
- [x] Share button — Web Share API + clipboard fallback
- [x] Google OAuth sign-in — redirect flow, modal prompt on first social action
- [x] Tag system — flavor tags (Culture, Faith, etc.) + type tags (Prose, Poem, etc.)
- [x] Smooth swipe transitions — ease-out expo, 300ms
- [x] Comics drag constraints — prevent boundary overflow revealing dark background
- [x] Image compression workflow — `npm run images` (ffmpeg) + pre-commit hook
- [x] Keyboard navigation — arrow keys
- [x] E2E tests — Playwright across iPhone 14, SE, Pixel 7, Desktop Chrome
- [x] Vercel deployment — manual `vercel --prod`
- [x] Submission pipeline — reader form, Google Drive upload, Firestore duplicate guard
- [x] Documentation — ADMIN.md (technical), SUBMISSIONS_GUIDE.md (editorial team), EDITORIAL.md (content pipeline)
- [x] TeamPanel roles — updated to match actual team structure (EIC, Outreach Director, Social Media Head, Art & Design Director, Founder/Tech Lead/Co-Editor)
- [x] SubmitPanel — header unified with TeamPanel (matching font size, padding, divider)

---

## In Progress

_(nothing currently in progress — pick from Planned below)_

---

## Planned

Features are roughly ordered by priority. Each item is scoped for one session.

### Content & Reading Experience

- [ ] **Bengali language support** — add `lang: "bn"` articles, switch content pipeline to serve both `en/` and `bn/` MDX, add a language toggle
- [ ] **Reading progress persistence** — save scroll position within long essay panels to localStorage so readers can resume
- [ ] **Issue/edition system** — group content into numbered issues (Vol. 1, Vol. 2), show issue badge on cover, filter TOC by issue
- [ ] **Article series** — link multi-part essays with prev/next navigation within the panel
- [ ] **Audio narration** — optional audio file per article, mini player appears at bottom of ArticlePanel

### Discovery & Navigation

- [ ] **Search** — full-text search across article titles, authors, excerpts; accessible from TOC or a dedicated button
- [ ] **Tag filtering** — tap a flavor/type tag to filter the TOC to matching articles
- [ ] **Bookmarks** — let signed-in users save articles to a reading list, accessible from a bookmark icon in the action bar

### Social & Community

- [ ] **Comment moderation** — flag/report button on comments; admin view to review and delete flagged comments
- [ ] **Reactions** — expand beyond likes to a small set of emoji reactions (like Substack)
- [ ] **User profiles** — basic profile page showing a user's liked articles and comments

### Distribution & Growth

- [ ] **Newsletter signup** — email capture form on the cover or team panel, integrate with Mailchimp or Resend
- [ ] **Open Graph / SEO** — per-article OG image, meta description, `sitemap.xml`, `robots.txt`
- [ ] **Push notifications** — PWA web push when a new issue drops (requires service worker + subscription flow)

### Technical

- [ ] **PWA / offline support** — service worker caching so the current issue is readable offline
- [ ] **Lazy loading within panels** — only load images for cards within ±1 panel of the current index
- [ ] **Analytics** — page views and dwell time per article (Plausible or self-hosted; privacy-respecting)
- [ ] **Admin dashboard** — simple web UI (auth-gated) for reviewing comment queue and seeing like counts without opening Firestore console

---

## Icebox

Ideas that are interesting but not prioritised yet.

- Video embed support in articles
- PDF export of an issue
- Dark/light mode toggle (currently dark only in Photography/Comics/Art sections)
- Multi-author bylines
- ~~Contributor portal~~ — shipped (see submission pipeline in Done)

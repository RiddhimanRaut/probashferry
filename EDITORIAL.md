# Editorial Workflow

How to add a submission to Probashferry — from received files to live on the site.

## General flow (all categories)

```
1. Receive submission
2. Create content/articles/en/{slug}.mdx
3. Drop images into public/images/{category}/{slug}/
4. npm run images          ← compress images
5. npm run dev             ← proof-read locally at localhost:3000
6. git add + git commit    ← hook auto-compresses any new images
7. git push origin dev && git checkout main && git merge dev && git push origin main
8. vercel --prod
```

---

## Essay

Simplest case — text and one cover image.

```mdx
---
title: "The title"
author: "Author Name"
date: "2025-11-01"
excerpt: "One sentence teaser shown in the table of contents."
coverImage: "/images/bricklane-thumb.jpg"
category: "Essays"
flavor: "Culture"
type: "Prose"
---

Body of the piece in Markdown...
```

The cover image is displayed as a 40vh hero. You can reuse an existing image or
drop a new one anywhere in `public/images/`.

**`flavor`** (optional): Culture · Faith · Travel · Food · Identity · Memory · Belonging

**`type`** (optional): Prose · Poem · Memoir · Essay · Fiction

---

## Photography

One MDX file per series. Each photo in the `photos` array becomes its own
card with its own like and comment button.

```mdx
---
title: "Series Title"
author: "Photographer Name"
date: "2025-11-01"
excerpt: "A short description of the series."
coverImage: "/images/photography/series-slug/cover.jpg"
category: "Photography"
photos:
  - src: "/images/photography/series-slug/01.jpg"
    caption: "Caption for photo 1"
    title: "Optional individual title"
    flavor: "Urban"
    type: "Documentary"
  - src: "/images/photography/series-slug/02.jpg"
    caption: "Caption for photo 2"
---
```

---

## Comics

Same structure as Photography, but individual comics with multiple pages use
a `panels` array to create a swipeable carousel. A composite "full page" view
is appended automatically — no extra work needed.

```mdx
---
title: "Comic Series Title"
author: "Artist Name"
date: "2025-11-01"
excerpt: "Short description."
coverImage: "/images/comics/series-slug/cover.jpg"
category: "Comics"
photos:
  - src: "/images/comics/series-slug/ep01/p01.jpg"
    caption: "Episode 1"
    title: "Episode 1: The Title"
    panels:
      - "/images/comics/series-slug/ep01/p01.jpg"
      - "/images/comics/series-slug/ep01/p02.jpg"
      - "/images/comics/series-slug/ep01/p03.jpg"
  - src: "/images/comics/series-slug/ep02/p01.jpg"
    caption: "Episode 2"
    title: "Episode 2: Another Title"
    panels:
      - "/images/comics/series-slug/ep02/p01.jpg"
      - "/images/comics/series-slug/ep02/p02.jpg"
---
```

If a comic has only one page, omit `panels` — it will display as a static image.

---

## Art

Identical structure to Photography. Change `category` to `"Art"`.

---

## Quick reference

| | |
|---|---|
| Slug | Must match the filename: `slug.mdx` → `/content/articles/en/slug.mdx` |
| Images | `public/images/{category}/{slug}/` |
| Compress | `npm run images` — or just commit, the pre-commit hook handles it |
| Cover image | Required for all categories; displayed as the section hero |
| `photos` array | Required for Photography, Comics, and Art |
| `panels` array | Multi-page comics only |
| `flavor` / `type` tags | Optional on articles and on individual photos |

Valid tag values are defined in `src/lib/tags.ts`. Add new ones there if needed.

---

## Ordering

Articles appear in this order regardless of filename:

1. **Essays** — sorted by date, newest first
2. **Photography**
3. **Comics**
4. **Art**

To control ordering within a category, set the `date` field accordingly.

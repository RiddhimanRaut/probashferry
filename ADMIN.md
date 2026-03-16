# Admin Reference — Probashferry

Technical guide for administrators (Riddhiman). Covers Firebase, Firestore, Google Drive, submission management, and deployment.

---

## Systems at a Glance

| System | Purpose | Access |
|---|---|---|
| **Vercel** | Hosts the website | vercel.com → probashferry project |
| **Firebase** | User authentication (sign-in) | console.firebase.google.com |
| **Firestore** | Stores likes, comments, submission records | Firebase Console → Firestore |
| **Google Drive** | Stores raw submission files | drive.google.com → Probashferry folder |
| **GitHub** | Source code | github.com/RiddhimanRaut/probashferry |

---

## Deployment

The site does **not** auto-deploy from git. Deploy manually after every change.

```bash
# Full deploy flow
git checkout dev
# ... make changes, commit ...
git push origin dev
git checkout main && git merge dev && git push origin main
git checkout dev
vercel --prod
```

**Before every deploy:**
- `npm run build` — must pass with no errors
- `npm run test:e2e` — must pass (or at minimum the mobile subset)
- New images compressed: `npm run images`
- Proofed locally: `npm run dev`

Production URL: **https://probashferry.vercel.app**

---

## Environment Variables

Stored in two places: `.env.local` (local dev) and the Vercel dashboard (production).

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON of the service account (one line, minified) |
| `GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID` | Drive folder ID for the submissions root |

To update a Vercel env var: Vercel Dashboard → Project → Settings → Environment Variables. After changing any env var, redeploy with `vercel --prod`.

---

## Firebase — User Authentication

Go to: **console.firebase.google.com** → select project → Authentication → Users

**What you can do here:**
- Look up a user by their email address
- Copy their **UID** (needed to find their submission in Firestore or Drive)
- Disable or delete an account if needed

Users sign in with Google. There is no password to manage.

---

## Firestore — Database Structure

Go to: **console.firebase.google.com** → Firestore Database

### `articles/{id}`
Stores like and comment counts for each piece of content.
- `likeCount` — integer
- `commentCount` — integer
- Gallery piece IDs use the pattern `{slug}-photo-{index}` (e.g. `streets-of-kolkata-photo-0`)

### `likes/{articleId}/users/{userId}`
One document per like. The existence of the document means the user has liked that piece.
- `userId` — the user's Firebase UID

### `comments/{articleId}/messages/{commentId}`
One document per comment.
- `text` — the comment body
- `authorName` — display name
- `createdAt` — ISO timestamp

### `submissions/{key}`
One document per submission. Key format: `{uid}_{category}_{issue}` (e.g. `abc123_Essays_issue-01`).
- `uid` — Firebase UID of the submitter
- `category` — Essays / Photography / Art / Comics
- `issue` — active issue ID (e.g. `issue-01`)
- `slug` — the Drive folder name for their files
- `submittedAt` — ISO timestamp

This is the duplicate-submission lock. Deleting a document here allows that user to resubmit for that category.

---

## Firestore — Common Admin Tasks

### Delete a submission record (allow resubmission)

1. Firebase Console → Firestore → `submissions` collection
2. Find the document: `{uid}_{category}_{issue}` — get the UID from Firebase Auth by searching their email
3. Click the document → **Delete document**

This does not delete their files from Drive — do that separately if needed.

### Delete a comment

1. Firestore → `comments` → find the article ID → `messages` subcollection
2. Open the comment document → **Delete document**

### Reset a like count (if corrupted)

1. Firestore → `articles` → find the article ID
2. Edit the `likeCount` field → set to the correct integer value

---

## Google Drive — Submissions Folder Structure

Root folder: **Probashferry/submissions/**

```
submissions/
  issue-01/
    pending/          ← new submissions land here
      {slug}/         ← one folder per submission
        meta.json     ← title, author, category, tags, etc.
        manuscript.docx (essays)
        cover.jpg     (if provided)
        photo_00.jpg  (photography/art/comics)
        photo_01.jpg
        ...
    accepted/         ← move folders here when approved
    published/        ← move here after the piece goes live on the site
  issue-02/           ← created automatically when a new issue starts
    pending/
    ...
  _templates/         ← example meta.json files for reference
```

---

## How a Submission Arrives

When a reader submits through the website:
1. The system creates a folder in `pending/` named `{category}-{title}-{timestamp}`
2. All their files are uploaded into that folder
3. A `meta.json` is written with their title, author, category, language, and tags
4. A Firestore record is created to prevent duplicate submissions

There is no automatic notification — check the `pending/` folder periodically. Drive's built-in activity notifications can be enabled via Drive Settings → Notifications.

---

## Processing a Submission

### Accept
1. Editorial team moves the folder from `pending/` to `accepted/`
2. They send you the folder name, cover image choice, and any editorial notes
3. You follow `EDITORIAL.md` to add the piece to the site and deploy

### Delete a submission completely (on contributor request)

For exceptional cases only — a contributor asking for their files to be removed entirely.

**Step 1 — Find the UID**
Firebase Console → Authentication → search by email → copy the UID

**Step 2 — Note the slug**
Firestore → `submissions` → open `{uid}_{category}_{issue}` → note the `slug` field

**Step 3 — Delete the Firestore record**
Delete the document from step 2

**Step 4 — Delete the Drive folder**
Go to `submissions/{issue}/pending/` or `accepted/` → find the folder with that slug → delete it

---

## Starting a New Issue

When issue-01 is complete and you're ready to open submissions for issue-02:

1. **Update `content/config.json`:**
   ```json
   { "activeIssue": "issue-02" }
   ```
2. **Commit and deploy.** New submissions will go to `submissions/issue-02/pending/` in Drive. The folder is created automatically on the first submission.
3. Archive issue-01 content as appropriate (no automated tooling yet).

---

## Google Service Account

The service account (`probashferry-submissions`) has Editor access to Google Drive and is used by the Vercel serverless function to upload submission files and write Firestore records. Its credentials live in `GOOGLE_SERVICE_ACCOUNT_JSON`.

The JSON file is backed up in: **Probashferry/credentials/** on Drive.

Do not rotate the key without updating the Vercel environment variable and redeploying.

---

## Firestore Security Rules

Current rules:
- Public: read `articles`, `likes`, `comments` (for displaying counts and comments)
- Signed-in users: write likes and comments under their own UID
- `submissions` collection: server-only via service account

To update rules: Firebase Console → Firestore → Rules tab.

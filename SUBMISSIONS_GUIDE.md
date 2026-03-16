# Submissions Review Guide

**Who this is for:** Ritoja, Abhipsha, Srijan, Pratyusha, Riddhiman
**What you need:** Access to the Probashferry Google Drive folder. No technical knowledge required.

---

## Who reviews what

| Category | Primary Reviewer | Role |
|---|---|---|
| Letters (English), Prose, Poetry | Ritoja | Editor-in-Chief |
| Letters (Bengali / Bilingual), Guest Columns | Srijan | Outreach Director |
| Art | Abhipsha | Art & Design Director |
| Photography | Riddhiman | Founder, Tech Lead, Co-Editor |
| All final decisions | Ritoja | Editor-in-Chief |

Pratyusha (Social Media Head) does not review submissions. She handles Instagram, Facebook, branding, and community engagement. Loop her in on anything that affects how we present the magazine publicly.

---

## What happens when someone submits

When a reader submits their work through the Probashferry website:

1. Their files are automatically uploaded to Google Drive
2. A record is created so they can't submit twice to the same category in the same issue
3. **Nothing is published automatically** — every piece goes through the editorial team first

There is no automatic notification when a new submission arrives. Check the folder regularly, or ask Riddhiman to set up a Drive activity alert.

---

## Where to find submissions

Open Google Drive and navigate to:

**Probashferry → submissions → issue-01 → pending**

Each submission is its own folder. The folder name looks like:
```
essays-the-last-train-home-1741234567890
```
(category — title — timestamp; ignore the numbers at the end)

---

## What's inside each submission folder

Every folder contains a `meta.json` file and the actual submitted files.

### `meta.json`
Open this first. Right-click → Open with → Google Docs (it will display as readable text).

Example:
```json
{
  "title": "The Last Train Home",
  "author": "Priya Das",
  "category": "Letters",
  "lang": "en",
  "flavor": "Memory",
  "type": "Prose"
}
```

| Field | What it means |
|---|---|
| `title` | Title of the piece |
| `author` | Their name (from their Google account) |
| `category` | Letters / Photography / Art / Comics |
| `lang` | `en` = English · `bn` = Bengali · `bil` = Bilingual |
| `flavor` | Theme: Culture, Faith, Travel, Food, Identity, Memory, Belonging |
| `type` | Format: Prose, Poem, Memoir, Essay, Fiction |

### Files by category

**Letters:**
- `manuscript.docx` — the full text in a Word file
- `cover.jpg` (optional) — a suggested cover image

**Photography:**
- `photo_00.jpg`, `photo_01.jpg`, `photo_02.jpg` — up to 3 images

**Art:**
- Same as Photography. Check `meta.json` for the `medium` field (e.g. "Watercolour on paper")

**Comics:**
- Single panel: `photo_00.jpg`
- Multi-panel: `photo_00_panel_00.jpg`, `photo_00_panel_01.jpg`, etc. (in order)

---

## How to review

### Letters (Ritoja / Srijan)

1. Open `manuscript.docx` via Google Docs
2. Read the piece
3. Ask yourself:
   - Does it speak to the Bengali diaspora experience?
   - Is the writing specific and personal, not generic?
   - Is the length right? (roughly 500–2000 words)
   - Bengali text: is it typed in Unicode, not a scan or image? (We cannot publish scanned text)
   - Are track changes accepted? (Edit menu → Track changes → should be clean)

### Art (Abhipsha)

1. View the image files
2. Ask yourself:
   - Is the work strong enough to represent the magazine?
   - Does it fit the visual language of Probashferry?
   - Is the resolution sufficient? (minimum 1500px on the longest side)
   - Is the colour mode RGB, not CMYK? (CMYK won't display correctly on screen)
   - Note the `medium` field — this is what we'll credit in the magazine

### Photography (Riddhiman)

1. View the images
2. Ask yourself:
   - Are they sharp and well-exposed?
   - Do they tell a story or convey a strong feeling?
   - Are they at least 1500px on the longest side?
   - Are they in sRGB colour space?

---

## Making a decision

There are three outcomes:

### Accept
Move the folder from `pending/` to `accepted/`.

Then:
- Note the title, author, and any editorial choices (which image to use as cover, any tag changes)
- Email the submitter (template below)
- Pass the folder details to Riddhiman to publish

### Revise and resubmit
Leave the folder in `pending/` — do not move it.

Then:
- Email the submitter with specific, kind feedback
- If they want to resubmit, they'll email you directly (the system won't let them submit again via the form for the same category this issue)
- If you want to give them another form submission slot, ask Riddhiman to reset it

### Reject
Move the folder to a `rejected/` folder inside `issue-01/` (create it if it doesn't exist).

Then:
- Email the submitter a kind, honest note
- Encourage resubmission next issue if appropriate

---

## Email templates

### Acceptance

> **Subject:** Your submission to Probashferry
>
> Dear [Name],
>
> We're delighted to let you know that your [essay / photo series / artwork], "[Title]", has been selected for Probashferry's upcoming issue. We'll be in touch with a publication date soon.
>
> Thank you for sharing your work with us.
>
> Warm regards,
> [Your name]
> Probashferry
> probashferrymagazine@gmail.com

### Revision request

> **Subject:** Your submission to Probashferry
>
> Dear [Name],
>
> Thank you for submitting "[Title]" to Probashferry. We've read it carefully and feel it has genuine promise. Before we can move forward, we'd love to see a few changes:
>
> [Be specific: what needs to change and why]
>
> Please reply to this email with a revised version. We look forward to reading it again.
>
> Warm regards,
> [Your name]
> Probashferry

### Rejection

> **Subject:** Your submission to Probashferry
>
> Dear [Name],
>
> Thank you for submitting to Probashferry. We appreciate you sharing your work with us. After careful consideration, we're unable to include this piece in the current issue. This is often a matter of fit and timing rather than the quality of the work itself.
>
> We'd love to see more from you. Please consider submitting to a future issue.
>
> Warm regards,
> [Your name]
> Probashferry

---

## Finding a submitter's contact details

Submissions come in through Google sign-in. The email address they used is the one attached to their Google account. We do not currently capture this automatically in the submission folder. If you need to contact a submitter and don't have their email:

- Ask them to email you directly (mention this in your response to any query they send)
- Or ask Riddhiman to look it up — he can find it via the admin panel in about 30 seconds

For now, the simplest approach: encourage submitters to include their contact email in the manuscript itself or in the caption/description field.

---

## Handing off to Riddhiman for publishing

Once a submission is in `accepted/`, send Riddhiman:

1. The folder name (so he can find it in Drive)
2. Which image to use as the cover (for photo/art/comics)
3. Any changes to the title, author credit, or tags
4. Any editorial notes (e.g. "we cut the last paragraph", "the Bengali text needs a Unicode check")

He'll handle the technical side: image compression, layout, and putting it live on the site.

---

## Starting a new issue

When one issue wraps up, Riddhiman will update the system to point to `issue-02`. Submissions will then land in `submissions/issue-02/pending/`. The `issue-01` folder stays intact as a permanent record.

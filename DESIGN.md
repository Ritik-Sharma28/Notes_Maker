# ChatNotes: Frontend Design System

> Source of truth for every UI decision. If this file and an AI tool's instinct disagree, this file wins.
> Stack: React + Vite + Tailwind CSS + shadcn/ui + Lucide + TanStack Query + Supabase JS.

---

## 0. Rules for the AI (paste into your tool's workspace rules)

1. Read this whole file before writing any UI code.
2. Never choose colors, fonts, radii, shadows or spacing yourself. Use only the tokens in section 3 to 5.
3. Never write raw Tailwind palette colors (`bg-blue-500`, `text-gray-700`, `bg-zinc-50`). Use semantic tokens only: `bg-background`, `bg-card`, `bg-sunken`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `bg-marker`.
4. No gradients, no glassmorphism, no colored shadows, no decorative blobs, no emoji as icons, no sparkle/"AI" iconography.
5. Cards are rare. Prefer whitespace, dividers and lists. Do not chop content into identical rounded boxes.
6. Reading experience comes first. The note reader is the most important screen after ingest.
7. Do not change the visual design when wiring APIs. Wiring is a separate task.
8. When unsure, do less. Remove one decoration before adding another.

---

## 1. Product context

**What it is.** ChatNotes turns a ChatGPT conversation (share URL or pasted text) into structured, exam-ready study notes. A backend pipeline of seven agents does the work asynchronously, so a run takes a while.

**Who uses it.** Students who learn by chatting with an AI and want clean, revisable notes afterwards. They are often on a laptop in a study session, sometimes on a phone revising before an exam.

**The core loop.** Paste a conversation, wait while it processes, land in organised topics, read and revise notes, preview the exported HTML and download it.

**What makes the UI different from a generic SaaS dashboard.**
- It is a reading tool, so typography matters more than chrome.
- Processing is long and visible, so the waiting screen is a real feature.
- Topics are hierarchical and grow over time, so navigation is a tree, not a card grid.
- Notes are versioned and get rewritten when new facts arrive, so "updated" states matter.

---

## 2. Design direction

### Concept: "the annotated textbook"

A quiet, paper-like workspace where the notes are the star and the interface stays out of the way. The one signature element borrowed from studying itself is **the highlighter**.

### The one memorable thing: the marker

A single highlighter yellow (`--marker`) is used only to mean "this is where you are or what you're looking for":

- the active step on the processing screen (a marker swipe behind the label)
- the current section in the reader's table of contents
- search matches in topics and notes
- the topic that was just updated by the latest run

It is **never** used as a button fill, badge background, border, icon tint or decoration. If yellow appears anywhere else, it is a bug. This restraint is what makes it feel intentional rather than themed.

### Principles

1. **Reading first.** Serif body text at a comfortable measure for notes. Everything else is quiet.
2. **Structure is information.** Borders, dividers and indentation exist to show hierarchy (parent topic, section, version), not to decorate.
3. **Calm density.** Compact enough to show a topic tree and a long note, loose enough to breathe. Think 14px UI text, 17px reading text.
4. **Honest waiting.** Show what the pipeline is really doing. Never a bare spinner.
5. **One accent for action, one marker for location.** Pine green means "do this". Yellow marker means "you are here".
6. **Boring controls, good typography.** Inputs and buttons are plain and consistent. The personality lives in type, spacing and the marker.

### Alignment

Everything is left-aligned. The only centered content is the login form and full-page empty states.

---

## 3. Color

Warm-neutral "chalk" surfaces, near-black green-tinted ink, one deep pine accent, one marker. No blue anywhere in the interface.

### Palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#F5F5F1` | `#151816` | App background |
| `card` (surface) | `#FBFBF9` | `#1B1F1C` | Dialogs, popovers, inputs, reader page |
| `sunken` | `#ECECE6` | `#101311` | Code blocks, table headers, sidebar, wells |
| `foreground` (ink) | `#1C1F1D` | `#E8E9E4` | Primary text |
| `muted-foreground` | `#5E625E` | `#9A9E98` | Secondary text, metadata |
| `border` | `#DEDED6` | `#2A2F2B` | All 1px lines |
| `primary` (pine) | `#1F5A4A` | `#6FBFA3` | Primary buttons, links, focus ring |
| `primary-hover` | `#184A3C` | `#86CDB3` | Hover on primary |
| `primary-foreground` | `#F5F5F1` | `#11201B` | Text on primary |
| `marker` | `#F3DC5B` | `#E6CF54` | Highlighter, see section 2 |
| `destructive` | `#B3402F` | `#E07A68` | Errors, failed states |

Semantic use of the palette:
- Success = pine text/icon with a check, never a green fill.
- Warning = foreground text with a marker-underlined phrase. No orange or amber.
- Error = `destructive` text and icon, 1px `destructive` border on the field. No red backgrounds.

### Contrast rules
- Body text on `background` and `card` must meet WCAG AA (they do with the values above).
- `muted-foreground` is for metadata only, never for essential instructions.
- Marker is always a background behind `foreground` text, never text color.

### `src/styles/globals.css`

```css
@import "tailwindcss";

:root {
  --background: #F5F5F1;
  --foreground: #1C1F1D;
  --card: #FBFBF9;
  --card-foreground: #1C1F1D;
  --popover: #FBFBF9;
  --popover-foreground: #1C1F1D;
  --sunken: #ECECE6;
  --muted: #ECECE6;
  --muted-foreground: #5E625E;
  --border: #DEDED6;
  --input: #DEDED6;
  --primary: #1F5A4A;
  --primary-hover: #184A3C;
  --primary-foreground: #F5F5F1;
  --secondary: #ECECE6;
  --secondary-foreground: #1C1F1D;
  --accent: #ECECE6;
  --accent-foreground: #1C1F1D;
  --marker: #F3DC5B;
  --destructive: #B3402F;
  --ring: #1F5A4A;

  --radius-chip: 4px;
  --radius-control: 6px;
  --radius-panel: 8px;
  --radius-dialog: 12px;
}

.dark {
  --background: #151816;
  --foreground: #E8E9E4;
  --card: #1B1F1C;
  --card-foreground: #E8E9E4;
  --popover: #1B1F1C;
  --popover-foreground: #E8E9E4;
  --sunken: #101311;
  --muted: #101311;
  --muted-foreground: #9A9E98;
  --border: #2A2F2B;
  --input: #2A2F2B;
  --primary: #6FBFA3;
  --primary-hover: #86CDB3;
  --primary-foreground: #11201B;
  --secondary: #1B1F1C;
  --secondary-foreground: #E8E9E4;
  --accent: #1B1F1C;
  --accent-foreground: #E8E9E4;
  --marker: #E6CF54;
  --destructive: #E07A68;
  --ring: #6FBFA3;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-sunken: var(--sunken);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-marker: var(--marker);
  --color-destructive: var(--destructive);
  --color-ring: var(--ring);

  --radius-chip: var(--radius-chip);
  --radius-control: var(--radius-control);
  --radius-panel: var(--radius-panel);
  --radius-dialog: var(--radius-dialog);

  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Source Serif 4 Variable", ui-serif, Georgia, serif;
  --font-mono: "Geist Mono Variable", ui-monospace, "SF Mono", Menlo, monospace;
}

html { background: var(--background); color: var(--foreground); }
body { font-family: var(--font-sans); font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
::selection { background: color-mix(in srgb, var(--marker) 55%, transparent); }
```

If the project uses Tailwind v3 instead of v4, map the same variables in `tailwind.config.js` under `theme.extend.colors` as `"var(--background)"` etc. The tokens stay identical.

Theme: follow the system setting by default, with a manual toggle in Settings. Apply `.dark` on `<html>`.

---

## 4. Typography

Two families, clearly distinct roles.

| Role | Family | Install |
|---|---|---|
| Interface | **Geist Sans** | `@fontsource-variable/geist` |
| Notes (reading) | **Source Serif 4** | `@fontsource-variable/source-serif-4` |
| Code | **Geist Mono** | `@fontsource-variable/geist-mono` |

Import the three packages once in `main.jsx`. Always keep the fallback stacks from `globals.css`.

### Scale

**Interface (Geist Sans)**

| Style | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| page-title | 20 / 28 | 600 | -0.01em | Page headers |
| section-title | 15 / 22 | 600 | 0 | Section headers inside pages |
| body | 14 / 21 | 400 | 0 | Default UI text |
| small | 13 / 18 | 400 | 0 | Metadata, helper text |
| tiny | 12 / 16 | 500 | 0 | Badges, timestamps |

**Reading (Source Serif 4), inside `.note-prose` only**

| Style | Size / line | Weight | Tracking |
|---|---|---|---|
| note-title (h1) | 34 / 40 | 600 | -0.02em |
| h2 | 24 / 32 | 600 | -0.01em |
| h3 | 19 / 28 | 600 | 0 |
| body | 17 / 29 | 400 | 0 |
| blockquote | 17 / 29 italic | 400 | 0 |

**Landing page only**

| Style | Size / line | Weight | Family |
|---|---|---|---|
| display | 48 / 52 (34 / 40 mobile) | 600, tracking -0.02em | Source Serif 4 |
| lead | 18 / 28 | 400 | Geist Sans |

### Rules
- Reading measure: `max-width: 66ch`. Never wider.
- Serif body gets a little more line-height than sans (1.7 vs 1.5). Already built into the scale.
- Sentence case everywhere. No ALL CAPS labels, no letter-spaced eyebrow text above headings.
- Do not accent a single word in a heading with color or italics.
- Numbers in tables and metadata use `font-variant-numeric: tabular-nums`.
- Do not use more than two weights on one screen region (400 and 600).

---

## 5. Layout, spacing, shape

### Spacing
4px base. Use the Tailwind scale `1, 2, 3, 4, 6, 8, 12, 16`. Page padding: `px-6` on mobile, `px-10` on desktop. Section gaps: `gap-8`. Related items: `gap-2` to `gap-3`.

### Radius hierarchy
Not one radius for everything.

| Element | Radius |
|---|---|
| Badges, kbd, inline code | 4px (`rounded-chip`) |
| Buttons, inputs, selects, tabs | 6px (`rounded-control`) |
| Panels, code blocks, tables, wells | 8px (`rounded-panel`) |
| Dialogs, sheets, command palette | 12px (`rounded-dialog`) |

### Borders and elevation
- Structure comes from 1px `border-border` lines.
- No shadows on in-page elements.
- Only floating layers (popovers, dropdowns, dialogs, toasts) get a shadow: `0 8px 24px -8px rgb(20 24 22 / 0.18)`. In dark mode, rely on the border and drop the shadow.
- Hover on rows and buttons changes background tone one step (`bg-sunken`). Never lift, scale or glow.

### Global layout

```
┌──────────────┬──────────────────────────────────────────────┐
│ Sidebar 248  │  Page area                                    │
│ (sunken bg)  │                                               │
│              │  Page header (title left, actions right)      │
│              │  ───────────────────────────────────────────  │
│              │  Page content                                 │
└──────────────┴──────────────────────────────────────────────┘
```

- Sidebar is `bg-sunken` with a 1px right border, collapsible to a 56px icon rail.
- Page header is 56px tall with a 1px bottom border. No top navbar.
- Page content scrolls; sidebar and page header stay fixed.

---

## 6. Motion

Motion answers an action or shows a state change. It does not decorate.

- Duration 120 to 180ms, `ease-out`. Nothing over 250ms except the marker swipe.
- Allowed: dropdown/dialog open and close, accordion expand, tab underline slide, toast in, skeleton shimmer (subtle), progress step changes.
- **The one orchestrated moment:** when a processing step becomes active, the marker swipes left to right behind its label over 400ms. That is the only decorative motion in the app.
- Not allowed: page-load fade-ups, staggered card entrances, hover lifts, parallax, bouncing, pulsing glows.
- Respect `prefers-reduced-motion`: replace the swipe with an instant marker background and disable shimmer.

---

## 7. Iconography

- Lucide React only. 16px in UI, 18px in the sidebar, stroke width 1.5.
- Icons accompany a label or have an `aria-label`. They are never decoration.
- Color: `muted-foreground` by default, `foreground` on hover or active.
- No sparkles, wands, robots or brain icons. Avoid the "AI" visual language entirely.
- Suggested set: `FilePlus2` (new notes), `BookOpen` (notes), `Inbox` or `Database` (sources), `Settings`, `Download`, `RotateCw` (retry), `Search`, `ChevronRight`, `Check`, `Circle`, `Loader` (spinning only inside the current step), `History` (versions), `Link`, `ClipboardPaste`.

---

## 8. Information architecture

No dashboard. The app opens where the work is.

```
/                          -> public landing page (no login needed)
/demo                      -> public sample run (no login needed)
/login
/signup

/app                       -> redirects: has notes ? /app/topics : /app/ingest
/app/ingest                -> paste URL or text
/app/processing/:sourceId  -> live pipeline view
/app/topics                -> topic tree (+ empty state)
/app/topics/:topicId       -> note reader
/app/sources               -> history of ingested conversations
/app/settings              -> theme, account, sign out
```

Sidebar items, in this order:

1. **New notes** (primary button, goes to `/app/ingest`)
2. **Notes** (`/app/topics`)
3. **Sources** (`/app/sources`)
4. Spacer
5. Usage line: "1 of 2 runs left this week" (regular users only, hidden for admins)
6. **Settings**, then the account row with email and sign out

---

## 9. Screens

### 9.0 Landing page (`/`)

The first thing anyone sees. Nobody lands on a login form. The page explains what ChatNotes does by **showing the product working**, not by describing it.

**Routing and auth**
- `/` and `/demo` are public. `/login` and `/signup` are reached from the landing page.
- `/app/*` is protected. An unauthenticated visit redirects to `/login` and returns to the original page after sign-in.
- A signed-in visitor opening `/` still sees the landing page, but the header shows **Open app** instead of Sign in and Get started. Do not auto-redirect.
- Unknown URLs show a plain 404 with a link home.

**Header (56px, 1px bottom border, not sticky-blurred)**
Wordmark on the left. Links: How it works, How it's built, GitHub. On the right: theme toggle, **Sign in** (ghost), **Get started** (primary). On mobile: wordmark, **Get started**, and a menu button.

**Layout**

```
ChatNotes     How it works   How it's built   GitHub      Sign in  [Get started]
──────────────────────────────────────────────────────────────────────────────

Turn your ChatGPT conversations
into notes you can revise from.

Paste a conversation. ChatNotes sorts it into topics, writes the notes,
checks them against what was said, and adds diagrams where they help.

[ Create notes ]   Watch a sample run
Preview: two conversations per week for each account.

┌───────────────────────────────────────────────────────────────────────────┐
│ Flow    Read ── Extract ── Organise ── Write notes ── Finish              │
│ Topics  ACID properties     Write ✓ ─ Check ✓ ─ Diagram ✓ ─ Save ✓        │
│         Isolation levels    Write ✓ ─ Check ↺2 ─ ...                      │
│ Activity  1:41 Reviewer asked for changes on "Isolation levels"           │
└───────────────────────────────────────────────────────────────────────────┘
                                                     Replay

Notes you can revise from
(text left)                              (real reader component, right:
Each topic becomes one note with a        tabs Notes | HTML preview, with a
contents list, code kept exactly as       short sample note)
you saw it, comparison tables and
diagrams. Preview the exported HTML
before you download it.

What happens to your conversation
──────────────────────────────────────────────────────────────────────────────
Reads it            Pulls the messages from a ChatGPT share link or pasted text.
Extracts            Keeps every fact, code block and table, and your corrections. Skips small talk.
Organises           Matches what you learned to topics you already have, so notes grow instead of duplicating.
Writes and checks   Drafts each note, then a reviewer checks it against the original facts and sends it back if something is missing.
Adds diagrams       Draws a flowchart or state diagram when the topic is a process or a comparison.
──────────────────────────────────────────────────────────────────────────────

Details that matter when you revise
Notes grow over time      New conversations extend existing topics. Earlier versions are kept.
Reviewed first            Every note is checked against the facts it came from.
Yours alone               Each account only sees its own sources and notes.
Plain HTML export         Download a clean file you can open anywhere.

How it's built
ChatNotes is a multi-agent system. A FastAPI service queues each conversation
with Redis and arq. A LangGraph pipeline of seven agents does the work. Topics
and notes live in PostgreSQL, with pgvector to match new material to existing
topics. Supabase handles sign-in. The interface is React.

 React ─ FastAPI ─ Redis + arq ─ LangGraph (7 agents) ─ PostgreSQL + pgvector
                      Supabase Auth verifies every request

 View the code on GitHub

Paste your first conversation.
[ Create notes ]   Watch a sample run
──────────────────────────────────────────────────────────────────────────────
ChatNotes            GitHub        Built by Ritik
```

**The embedded sample run (the hero's centerpiece)**
- It is the real Run view (`RunView` in compact mode, driven by `SampleRunPlayer` and `sampleRun.json`), not a screenshot or video. Same components, same simulated clock as `/demo`.
- Autoplays once when it scrolls into view (IntersectionObserver), pauses on hover or focus, shows a **Replay** control when finished.
- With `prefers-reduced-motion`, show the finished state statically.
- Clicking any step opens the detail sheet, just like the real thing. A visitor can poke at it.
- This is the one place on the page where the marker yellow appears.

**The reader sample**
- Uses the real `NoteReader` with a short static sample note (a heading, two paragraphs, a code block, a small table, one diagram) and a working Notes / HTML preview tab. It is read-only: no export, no history.

**Visual rules for this page only**
- Same tokens as the app. Left-aligned. Content width 1120px, text columns 640px max.
- Headline: Source Serif 4 semibold, 48/52 on desktop, 34/40 on mobile, tracking -0.02em. No word in the headline is colored or italicized. Lead paragraph 18/28 Geist.
- The page is the product's own voice: sentence case, plain verbs, no "AI-powered", no "revolutionary".
- Sections are separated by whitespace (`py-24`) and 1px dividers. The "What happens" and "Details" blocks are rows with a label on the left and a sentence on the right, not cards.
- No fake logos, testimonials, user counts, stats, pricing tables or stock illustrations. Only claim what the product does today.
- No scroll-triggered animations. The only motion is the embedded run and normal hover states.
- Mobile: single column, the embedded run switches to the compact vertical flow from 9.3, rows stack label over sentence.
- Set a page `<title>` ("ChatNotes: turn ChatGPT conversations into study notes"), a meta description, and a favicon (a plain "C" in pine on `background`).

**Links and config**
GitHub and other links come from env vars (`VITE_GITHUB_URL`, `VITE_AUTHOR_URL`), so nothing is hard-coded.

### 9.1 Login and signup (`/login`, `/signup`)

```
              ChatNotes

     Sign in
     ┌───────────────────────────┐
     │ Email                     │
     └───────────────────────────┘
     ┌───────────────────────────┐
     │ Password                  │
     └───────────────────────────┘
     [ Sign in ]

     No account? Create one
```

- Single centered column, 360px wide, no card, no illustration, no split hero.
- Wordmark is plain text in Geist 600 and links back to `/`. No logo mark needed in v1.
- Below the form, a quiet link: "Watch a sample run" (to `/demo`).
- Auth is handled entirely by Supabase JS. Errors appear inline under the field in `destructive`.

### 9.2 Ingest (`/app/ingest`)

The product's front door. It should feel like a calm writing surface.

```
New notes
Paste a ChatGPT conversation. We'll turn it into organised study notes.

[ Share link ]  [ Paste text ]          <- tabs, not stacked "OR" blocks

Share link
┌──────────────────────────────────────────────┐
│ https://chatgpt.com/share/...                │
└──────────────────────────────────────────────┘
The link must be public. Open it in a private window to check.

                                 [ Create notes ]
Runs left this week: 1 of 2
```

Paste text tab:
```
┌──────────────────────────────────────────────┐
│ Paste the whole conversation here            │
│                                              │
│  (large textarea, min 14 rows, mono off)     │
└──────────────────────────────────────────────┘
12,430 characters
```

Behavior:
- Tabs map to the backend: `share_url` or `raw_text`. Send exactly one.
- Validate the URL starts with `https://chatgpt.com/share/` (confirm accepted hosts in the backend).
- Button disabled until valid. While submitting, the label becomes "Creating..." and the button is disabled.
- On `202`, navigate to `/app/processing/:sourceId`.
- Rate-limit error: inline message "You've used both runs for this week. Your limit resets on {date}." No modal.
- Never use a drag-and-drop dashed box. This is a paste workflow.

### 9.3 Run view (`/app/processing/:sourceId`)

The showcase screen. It shows the real pipeline as a flow you can follow from task to task: live while it runs, and as a replayable record afterwards. Someone watching should understand within ten seconds that a multi-agent system is doing real work: reading, splitting into topics, writing, reviewing, drawing, saving.

It is not a spinner and not a progress bar with a message. It has three zones: the flow, the topic lanes, and the activity log.

```
Creating your notes                                     Elapsed 1:42
Topic 3 of 5, 4 diagrams so far                    ━━━━━━━━━━━───── 62%
────────────────────────────────────────────────────────────────────

Flow
 Read ───── Extract ───── Organise ───── Write notes ───── Finish
  ✓ 4s       ✓ 18s         ✓ 3s         ▌Writing ▐           ○

Topics
 ACID properties      new       Write ✓ ─ Check ✓ ─ Diagram ✓ ─ Save ✓   Open note
 Isolation levels     extended  Write ✓ ─ Check ↺2 ─ Diagram ○ ─ Save ○
 Two-phase locking    new       ▌Write▐ ─ Check ○ ─ Diagram ○ ─ Save ○
 Deadlocks            new       Waiting
 Indexing             extended  Waiting

Activity                                         Technical details
 1:41  Reviewer asked for changes on "Isolation levels" (attempt 1)
 1:28  Saved "ACID properties" as version 1
 1:12  Writing "ACID properties"
 0:25  Found 5 topics: 3 new, 2 added to existing notes
```

#### Zone A: the flow
- Five nodes on a 1px horizontal line: **Read, Extract, Organise, Write notes, Finish**. Nodes are small circles with a label under them, not boxes.
- "Write notes" is one node on this line because it repeats per topic. Its detail lives in zone B.
- Node states: waiting (empty circle, muted), active (spinner plus marker swipe behind the label), done (pine check plus duration like "18s"), failed (destructive icon).
- The connector between two nodes fills from left to right in pine when the next node starts. That fill is the "task to task" handoff.
- Under each done node, a one-line result in `muted-foreground`, for example Read: "42 messages", Extract: "61 facts, 5 code blocks", Organise: "5 topics".

#### Zone B: topic lanes
- Appears the moment Organise finishes. One 40px lane per topic from `dirty_topic_ids`, in processing order.
- Each lane: topic title, a text tag (**new**, **extended**, **subtopic**; plain text in `muted-foreground`, no colored pills), then a four-step mini track: **Write, Check, Diagram, Save**.
- The active lane has the marker behind the current mini-step. Waiting lanes are muted and show "Waiting".
- **The review loop is visible.** When the reviewer rejects a draft, the mini track shows `Check ↺ 2` and the lane sub-line reads "Revising, attempt 2 of 3". After the loop ends, the lane keeps a small "revised 2 times" note so the history isn't lost.
- If the max retries are reached and the note proceeds anyway, show "Saved with reviewer notes" (muted), not an error.
- **Results arrive progressively.** As soon as a topic is saved, its lane shows an **Open note** link. The user can start reading while other topics are still being written.

#### Zone C: activity log
- Plain list, newest on top, each line a relative timestamp plus a sentence in the voice from section 11. No icons per line.
- Sentences come from backend events (see 13.1), for example: "Found 5 topics: 3 new, 2 added to existing notes", "Writing 'ACID properties'", "Reviewer asked for changes on 'Isolation levels' (attempt 1)", "Added 2 diagrams to 'Isolation levels'", "Saved 'ACID properties' as version 1".
- The log scrolls inside a fixed-height region and stops auto-scrolling while the pointer is over it.
- "Technical details" toggles a `sunken` panel showing raw `current_agent`, `current_step`, `retry_count`, `percentage` and raw event types in mono. Closed by default.

#### Detail panel
Clicking a node, a lane or a mini-step opens a right-side sheet with what that step did: input and output counts, duration, and for Check the reviewer feedback text. This is where a technical viewer sees real depth, so it must show real data and never filler text.

#### Header
- Title "Creating your notes", elapsed timer, a one-line summary ("Topic 3 of 5, 4 diagrams so far"), and a 2px progress bar using the API `percentage`.
- Subtitle on first view: "You can leave this page. We'll keep working."

#### Finished state
- Title becomes "Your notes are ready". The flow stays on screen with every node done and its duration; it does not disappear.
- One summary line: "5 topics (3 new, 2 updated), 7 diagrams, finished in 3m 12s".
- Primary button **Open notes**. Each lane keeps its **Open note** link.
- The same view is reachable later from Sources via **View run**, rendered statically from stored events. This is the replayable record.

#### Failed state
- The failing node or lane step turns `destructive`; completed lanes stay green and openable.
- Show `error_message` plainly under the flow, then **Try again** with attempts left (`3 - retry_count`) and the line "Continues from {step}" since the backend resumes from saved state.
- When no attempts remain: "This conversation couldn't be processed. Try pasting the text instead."

#### Sample run (important for demos)
Regular users are limited to 2 runs per week, so a visitor can't try the product freely. Add **Watch a sample run** on the login page and the ingest page. It plays a recorded `sampleRun.json` of real events through the same Run view components, with a simulated clock. No backend call, no rate limit. This is also the fastest way for an interviewer to see the flow.

#### Mapping from backend agents to what the user sees

| Backend agent | Flow node | Lane step |
|---|---|---|
| Message extraction, Patch Builder | Read | |
| Extractor | Extract | |
| Index Keeper | Organise | |
| Note Author | Write notes | Write |
| Reviewer | Write notes | Check |
| Diagram Agent | Write notes | Diagram |
| Formatter, next_topic | Write notes, then Finish | Save |

Verify the exact `current_agent` strings in `src/pipeline` and keep the mapping in one file: `src/lib/pipelineStages.js`.

#### Motion on this screen
- Marker swipe left to right behind a node or mini-step label when it becomes active, 400ms (the one orchestrated moment).
- Connector fill 300ms. Lane rows expand into place in 150ms. Log lines append without animation.
- Reduced motion: no swipe, no fill animation, instant states.

#### Mobile
Zone A becomes a compact vertical list. Zone B lanes stack, each with its four-step track beneath the title. Zone C collapses behind an "Activity" disclosure. The detail panel becomes a bottom sheet.

### 9.4 Topics (`/app/topics`)

Master-detail with a topic tree, not a grid of cards.

```
Notes                                         [ Search notes ]
──────────────────────────────────────────────────────────────
Databases
  ▸ SQL
  ▾ Transactions                     ▌updated 2 min ago▐
      ACID properties
      Isolation levels
  ▸ Indexing
Operating systems
  ▸ Processes
  ▸ Scheduling
Web development
  ▸ React
```

- Built client-side from `parent_topic_id`. Indent 16px per level with a 1px guide line.
- Row height 32px, text 14px. Hover: `bg-sunken`. Selected row: 2px pine bar on the left plus `bg-sunken`.
- Chevron toggles children. Click on the title opens the note.
- `is_dirty = true`: show a small muted "Updating" label with a spinner icon.
- Topics updated by the latest run: marker behind the "updated" label for 24 hours (see section 2).
- Search is a simple client-side filter on titles in v1; matches get the marker.
- Empty state (no topics): "No notes yet. Paste a ChatGPT conversation to create your first one." with a primary button "New notes".

On desktop, when a topic is opened, the tree remains as a 280px left pane and the note fills the rest. On mobile, the tree and note are separate screens.

### 9.5 Note reader (`/app/topics/:topicId`) — the most important screen

```
┌────────────┬──────────────────────────────────────┬───────────────┐
│ Topic tree │  Databases / Transactions             │ On this page  │
│ (280)      │                                       │               │
│            │  PostgreSQL transactions   [Download] │ Definition    │
│            │  Version 3 · updated 2 min ago        │▌ACID        ▐ │
│            │                                       │ Isolation     │
│            │  A transaction is a unit of work...   │ Two-phase     │
│            │                                       │  locking      │
│            │  ┌ diagram ─────────────────────┐     │               │
│            │  │ (mermaid, bordered figure)   │     │               │
│            │  └──────────────────────────────┘     │               │
│            │                                       │               │
│            │  ```sql  [copy]                       │               │
└────────────┴──────────────────────────────────────┴───────────────┘
```

- The note sits on `card` background inside the `background` page, 66ch column, centered within the available space. Page padding generous (`py-12`).
- Header: breadcrumb (parent topic / topic) in `muted-foreground`, then the note title in note-title style. Meta line: "Version {n} · updated {relative time}".
- Two tabs under the title: **Notes** (the app-themed reader) and **HTML preview** (section 9.5b).
- Actions (top right of the reader): **Download** (the HTML file), **History** (version drawer), and copy as Markdown.
- There is no PDF option anywhere in the UI for now.
- Right rail "On this page": built from h2 and h3 in the markdown. Sticky. Active section gets the marker via IntersectionObserver. Hidden below 1280px width; on smaller screens becomes a "Jump to" dropdown in the header.
- **Version history:** a right-side sheet listing `note_versions` (version number, date). Selecting one shows it in read-only mode with a banner "You're viewing version 2. Back to latest." Do not offer restore in v1.
- If the topic is dirty, show a slim inline banner above the note: "New material is being added. This note will refresh shortly."
- Footer of the note: small `muted-foreground` text with the source count if the API provides it.

### 9.5b HTML preview (tab in the reader)

Shows exactly what the exported HTML file looks like, inside the app, without downloading it.

```
Notes   HTML preview
────────────────────────────────────────────────────────────
This is how the exported file looks.   Open in new tab   Download   Full screen
┌──────────────────────────────────────────────────────────┐
│  (sandboxed iframe: the exported HTML document)          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- Fetch `GET /api/v1/export/{topic_id}/html` with the auth header (a plain iframe `src` cannot send a bearer token), then pass the text to the iframe as `srcDoc`.
- Iframe uses `sandbox="allow-scripts"` only if the exported HTML needs scripts (for example Mermaid); never add `allow-same-origin`. Confirm in the backend template whether scripts are needed.
- The exported file has its own dark premium styling from the backend. Do not restyle it. Wrap it in a 1px bordered panel (radius panel) so the difference from the app theme looks deliberate.
- Toolbar above the frame, left: "This is how the exported file looks." Right: **Open in new tab** (blob URL), **Download** (blob with filename `{slugified-title}.html`), **Full screen** (a dialog that fills the viewport).
- Cache the HTML with TanStack Query keyed by `topic_id` and note `version`, so switching tabs doesn't refetch.
- Loading: a skeleton block the size of the frame. Error: "Couldn't build the preview. Try again." with a retry button.
- Preview and download always use the latest version. Old versions are not exportable in v1.
- Icons: `ExternalLink`, `Download`, `Maximize2`.

### 9.6 Sources (`/app/sources`)

A plain table, not cards.

| Source | Added | Status | |
|---|---|---|---|
| chatgpt.com/share/abc... | 3 Oct | Completed | |
| Pasted text (12,430 chars) | 1 Oct | Failed | Try again |

- Columns: source (link host + shortened path or "Pasted text"), added date, status, actions.
- Status is text with a small icon (check, loader, alert). No filled pill badges.
- Completed rows have **View run** (opens the finished Run view from stored events) and link to the topics they produced if the API exposes it.
- Processing rows link to `/app/processing/:sourceId`.
- Failed rows show "Try again" with attempts left.

### 9.7 Settings (`/app/settings`)

Three rows only: Appearance (system, light, dark), Account (email), Sign out. No extra sections until a feature needs them.

---

## 10. Components

Start from shadcn/ui and restyle through the tokens. Do not hand-build what shadcn already provides.

Install: `button input textarea label tabs dialog sheet dropdown-menu tooltip badge progress skeleton sonner scroll-area separator collapsible breadcrumb`.

| Component | Spec |
|---|---|
| **Button, primary** | `bg-primary text-primary-foreground`, hover `bg-primary-hover`, height 36px, `px-4`, radius control, weight 500. One primary button per view. |
| **Button, secondary** | `bg-card border border-border`, hover `bg-sunken`. |
| **Button, ghost** | transparent, hover `bg-sunken`. Used in toolbars. |
| **Button, destructive** | text-only in `destructive`, never a filled red button in v1. |
| **Input / Textarea** | `bg-card border border-input`, radius control, height 36px, focus: 2px `ring` outline offset 2px. Placeholder in `muted-foreground`. |
| **Tabs** | Underline style: 1px bottom border, active tab has a 2px `foreground` underline that slides. No filled pills. |
| **Badge** | Used sparingly: 4px radius, `bg-sunken`, text 12px. Never colored backgrounds. |
| **Dropdown / popover** | `bg-popover`, 1px border, radius panel, floating shadow. |
| **Dialog** | Radius dialog, 1px border, floating shadow, max-width 440px. Used for confirmations only. |
| **Sheet** | Right-side, 400px, used for version history. |
| **Tooltip** | `foreground` background, `background` text, 12px. Only for icon-only buttons. |
| **Toast (sonner)** | Bottom-right, `card` background, 1px border. Message mirrors the action name: "Downloaded HTML". |
| **Progress** | 2px tall bar, `border` track, `primary` fill. Used only in the processing footer. |
| **Skeleton** | `bg-sunken`, 6px radius, subtle shimmer. Match real content shapes. |
| **Table** | No outer card. 1px row dividers, header row `bg-sunken` text 13px 500, row height 44px. |
| **Tree row** | Described in 9.4. |

Custom components to build (all in `src/components/`):

- `AppSidebar`, `PageHeader`
- `IngestForm` (tabs plus validation)
- `RunView`, `PipelineFlow` (zone A), `TopicLanes` (zone B), `ActivityLog` (zone C), `RunDetailSheet`, `TechnicalDetails`, `SampleRunPlayer`
- `TopicTree`, `TopicRow`
- `NoteReader`, `NoteToc`, `NoteMeta`, `VersionSheet`, `HtmlPreview`
- `MarkdownRenderer`, `MermaidFigure`, `CodeBlock`
- `SourceTable`, `EmptyState`, `ErrorState`
- Landing: `LandingHeader`, `LandingHero`, `EmbeddedRun`, `ReaderSample`, `StepRows`, `HowItsBuilt`, `SiteFooter`

---

## 11. States and writing

### Voice
Plain, calm, specific. Sentence case. Active voice. No filler, no exclamation marks, no "magic", no "AI-powered", no "supercharge". Errors never apologize and never stay vague. Name things the way students do: "notes", "topics", "conversation", not "sources", "ingestion" or "pipeline" (except in the Sources page title and technical details).

### Consistent action names
The action keeps its name through the flow: **Create notes** (button) leads to "Creating your notes" (page) leads to toast "Notes created".

### Microcopy

| Moment | Copy |
|---|---|
| Ingest page title | New notes |
| Ingest subtitle | Paste a ChatGPT conversation. We'll turn it into organised study notes. |
| Share link helper | The link must be public. Open it in a private window to check. |
| Submit button | Create notes |
| Processing title | Creating your notes |
| Leave-page hint | You can leave this page. We'll keep working. |
| Processing done | Your notes are ready |
| Open button | Open notes |
| Empty topics | No notes yet. Paste a ChatGPT conversation to create your first one. |
| Empty sources | Nothing here yet. Conversations you add will appear here. |
| Failed run | We couldn't finish this one. {error_message} |
| Retry | Try again ({n} left) |
| Rate limit | You've used both runs for this week. Your limit resets on {date}. |
| Dirty topic | Updating |
| Dirty banner | New material is being added. This note will refresh shortly. |
| Old version banner | You're viewing version {n}. Back to latest |
| Download success | Downloaded HTML |
| Download failure | Download didn't work. Try again in a moment. |
| Preview failure | Couldn't build the preview. Try again. |
| Sample run link | Watch a sample run |
| Network error | Can't reach the server. Check your connection and try again. |
| Session expired | Your session ended. Sign in again to continue. |

### State rules
- **Loading:** skeletons shaped like the real content (tree rows, note lines), never full-page spinners.
- **Empty:** one sentence plus one primary action. No illustrations.
- **Error:** what happened, then what to do. Inline near the cause. Toast only for transient actions like export.
- **Optimistic UI:** none in v1, except marking a source as "Processing" right after a successful ingest.

---

## 12. Rendering generated content

Notes arrive as Markdown (`content_markdown`) plus an array of diagrams. Everything below lives inside a `.note-prose` wrapper.

**Libraries:** `react-markdown`, `remark-gfm`, `rehype-slug`, `rehype-autolink-headings` (optional), `shiki` or `rehype-highlight`, `mermaid`.

### Prose rules
- Font: Source Serif 4, 17/29, max 66ch.
- Paragraph spacing: 1.1em. h2 margin-top 2.2em, h3 margin-top 1.8em.
- Lists: 1.4em left padding, 0.35em between items, markers in `muted-foreground`.
- Blockquote: 2px left border in `border`, 1em padding, italic, `muted-foreground`.
- Inline code: Geist Mono 0.88em, `bg-sunken`, 4px radius, `px-1.5`.
- Links: `primary`, underline on hover only.
- Horizontal rule: 1px `border`.
- HTML comments (the reviewer appends feedback as an HTML comment after max retries) must never render. Do not enable raw HTML in react-markdown.

### Code blocks
- `bg-sunken`, 1px border, radius panel, Geist Mono 13/20.
- Slim header row: language on the left in `muted-foreground`, **Copy** button on the right. The label changes to "Copied" for 1.5 seconds.
- Horizontal scroll inside the block. Never wrap long lines.
- Syntax theme: low-saturation, matching tokens (pine for strings, muted for comments, foreground for rest). No neon theme.

### Tables (comparison tables)
- Wrapped in `overflow-x-auto`. 1px borders, radius panel on the wrapper.
- Header row `bg-sunken`, 600 weight. First column 500 weight.
- Cell padding `px-4 py-2.5`. Numbers tabular.

### Mermaid diagrams
- Rendered inside a `<figure>` with 1px border, radius panel, `card` background, `p-6`, horizontally scrollable.
- Initialize Mermaid with `theme: "base"` and `themeVariables` pulled from the CSS tokens (`primaryColor: card`, `primaryBorderColor: border`, `lineColor: muted-foreground`, `primaryTextColor: foreground`, `fontFamily: Geist`). Re-render when the theme changes.
- Diagrams from `diagrams` are inserted by the backend formatter into the markdown, so render fenced `mermaid` blocks. Do not render them twice.
- If a diagram fails to parse, fall back to showing its source in a code block with the caption "Diagram couldn't be drawn." Never show a blank box or crash the note.
- Optional caption under the figure in 13px `muted-foreground`.

---

## 13. Backend contract

Base URL from `VITE_API_URL`. Every request carries `Authorization: Bearer <supabase access token>`.

| Screen | Endpoint | Notes |
|---|---|---|
| Ingest | `POST /api/v1/ingest` | Body `{share_url}` or `{raw_text}`. Returns `202 {source_id, status}`. |
| Run view | `GET /api/v1/progress/{source_id}` | Poll 1.5s. Existing fields: `current_agent`, `current_step`, `percentage`, `message`, `error_message`, `retry_count`, `updated_at`. The rich flow needs the extra fields in 13.1. |
| Retry | `POST /api/v1/sources/{source_id}/retry` | Only when status is `failed`. Max 3 per source. |
| Sources | `GET /api/v1/sources` | `id, platform, status, created_at, share_url`. |
| Topics tree | `GET /api/v1/topics` | `id, title, parent_topic_id, is_dirty, created_at`. Build the tree on the client. |
| HTML preview and download | `GET /api/v1/export/{topic_id}/html` | Needs the auth header, so do NOT use a plain `<a href>` or iframe `src`. Fetch the text, use it as `srcDoc` for the preview, and as a blob for download. The PDF endpoint is not used by the UI. |

### Gaps to close in the backend before building the reader
1. **`GET /api/v1/topics/{topic_id}`** returning the topic with its note: `{ id, title, parent_topic_id, is_dirty, note: { content_markdown, diagrams, version, updated_at } }`. The documented API has no way to fetch a note yet.
2. **`GET /api/v1/topics/{topic_id}/versions`** (and a single-version read) for the History sheet. Skip the sheet in v1 if you don't add this.
3. Add `updated_at` and `has_note` to the topics list so the tree can show "updated" and "Updating" without extra calls.
4. Add `GET /api/v1/sources/{source_id}` so the processing page can load after a refresh without relying on the list.
5. Confirm the HTTP code and body for rate-limit errors (assumed `429`) and for retry exhaustion.
6. Enable CORS for the Vite dev origin (`http://localhost:5173`) and your production domain.
7. **Run events** for the Run view. This is the most important backend change; see 13.1.

If a gap isn't closed yet, mock that call in `src/api/` and mark it `// TODO(backend)`.

### 13.1 Run data the UI needs

Today `/progress` only says which agent is current. A task-to-task flow, topic lanes and an activity log need a history. Add an append-only event log and return it with the progress.

**Backend change (small):**
- New table `progress_events`: `id` (bigint, increasing), `source_id`, `at`, `agent`, `type`, `message`, `data` (JSONB).
- Write one event at the start and end of each node, and on each reviewer decision. The agents already call the state manager and progress updater, so this is one extra insert at those points.
- Event types: `stage_started`, `stage_finished`, `topics_found`, `topic_started`, `review_rejected`, `review_approved`, `diagrams_added`, `topic_saved`, `run_finished`, `run_failed`.
- Support `GET /api/v1/progress/{source_id}?after_event_id=123` so polling only returns new events.

**Response shape the UI expects:**

```json
{
  "source_id": "uuid",
  "status": "processing",
  "percentage": 62,
  "current_agent": "note_author",
  "current_step": "Writing 'Two-phase locking'",
  "retry_count": 0,
  "error_message": null,
  "started_at": "2026-10-06T10:00:00Z",
  "finished_at": null,
  "stages": [
    { "key": "read", "status": "done", "started_at": "...", "finished_at": "...", "summary": "42 messages" },
    { "key": "extract", "status": "done", "summary": "61 facts, 5 code blocks" },
    { "key": "organise", "status": "done", "summary": "5 topics" },
    { "key": "write", "status": "active" },
    { "key": "finish", "status": "waiting" }
  ],
  "topics": [
    { "topic_id": "uuid", "title": "ACID properties", "route": "new",
      "stage": "done", "attempt": 1, "status": "done", "note_ready": true, "diagram_count": 2 },
    { "topic_id": "uuid", "title": "Isolation levels", "route": "extend",
      "stage": "review", "attempt": 2, "status": "active", "note_ready": false }
  ],
  "events": [
    { "id": 118, "at": "...", "agent": "reviewer", "type": "review_rejected",
      "message": "Reviewer asked for changes on \"Isolation levels\" (attempt 1)",
      "data": { "topic_id": "uuid", "attempt": 1, "feedback": "..." } }
  ]
}
```

`stages` and `topics` can be computed from the events on read, so the event log is the only new storage.

**Until the backend change exists:** build the Run view against `src/mocks/runSimulation.js`, a scripted timeline that emits this exact shape on a timer. The same file powers the sample run (9.3), so it is useful long after the backend is done.

### Auth
Supabase JS handles login, signup, logout and session. The API client reads the access token from `supabase.auth.getSession()` on each request. Do not build a custom auth system. On `401`, sign the user out and redirect to `/login` with the "Session expired" message.

---

## 14. Frontend architecture

```
frontend/
├── DESIGN.md
├── API.md                  # copy of the table in section 13 plus response examples
├── src/
│   ├── main.jsx
│   ├── app/
│   │   ├── router.jsx
│   │   └── providers.jsx   # QueryClient, Supabase session, theme
│   ├── layouts/
│   │   ├── AppLayout.jsx
│   │   └── AuthLayout.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Demo.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Ingest.jsx
│   │   ├── Processing.jsx
│   │   ├── Topics.jsx
│   │   ├── Note.jsx
│   │   ├── Sources.jsx
│   │   └── Settings.jsx
│   ├── components/
│   │   ├── ui/             # shadcn
│   │   ├── landing/
│   │   ├── sidebar/
│   │   ├── ingest/
│   │   ├── processing/
│   │   ├── topics/
│   │   ├── notes/
│   │   └── sources/
│   ├── api/
│   │   ├── client.js       # fetch wrapper, auth header, error mapping
│   │   ├── ingest.js
│   │   ├── progress.js
│   │   ├── sources.js
│   │   ├── topics.js
│   │   └── export.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useIngest.js
│   │   ├── useProgress.js  # TanStack Query with refetchInterval
│   │   ├── useSources.js
│   │   └── useTopics.js
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── pipelineStages.js
│   │   ├── buildTopicTree.js
│   │   └── utils.js
│   ├── mocks/              # fake JSON matching the contract, for Phase 2
│   └── styles/globals.css
```

Rules:
- Components never call `fetch` or `axios` directly. Flow is component, hook, API function, FastAPI.
- TanStack Query owns server state. No Redux, no Zustand in v1.
- `useProgress` uses `refetchInterval: 1500` and returns `false` once status is `completed` or `failed`.
- After a successful ingest or completed run, invalidate `["topics"]` and `["sources"]`.
- Use plain JSX or TypeScript as you prefer, but stay consistent.

---

## 15. Accessibility and responsive

- Keyboard: every control reachable, visible 2px pine focus ring, logical order. Tree supports arrow keys (up/down move, right expands, left collapses).
- Screen readers: processing list uses `aria-live="polite"` for step changes; progress has `role="progressbar"` with values; icon-only buttons have `aria-label`.
- Color is never the only signal: statuses always pair an icon and text.
- Minimum touch target 40px on mobile.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

Breakpoints:

| Width | Behavior |
|---|---|
| < 768px | Sidebar becomes a drawer opened from a menu button in the page header. Topics and note are separate screens. TOC becomes a "Jump to" dropdown. Reader padding `px-5`, body text 16px. |
| 768 to 1279px | Sidebar visible, topic tree and note as master-detail, TOC hidden (dropdown). |
| 1280px and up | Full layout with TOC rail. |

---

## 16. Never do this

- Blue, indigo or purple anywhere. Default Tailwind palette classes.
- Gradients of any kind, including text gradients and button gradients.
- Glassmorphism, backdrop blur panels, glowing borders.
- Hero sections, marketing copy or feature grids inside `/app/*`. Marketing copy lives only on the public landing page (9.0), and even there: no fake logos, testimonials, stats, pricing or gradients.
- Dashboards full of stat cards, charts or "welcome back" banners.
- Identical rounded cards repeated down a page.
- One radius on everything; shadows under every container.
- ALL CAPS labels, letter-spaced eyebrows, numbered 01/02/03 markers on non-sequences.
- Middle-dot meta strings stuffed everywhere, spaced em dashes in labels, arrows appended to every button.
- Emoji or sparkle icons in the UI.
- Spinners as the only loading state; full-page loaders.
- Hover lifts, entrance animations on every section, bouncing or pulsing elements.
- Yellow used for anything but location (section 2).
- A PDF button, menu item or mention anywhere in the UI.
- A bare spinner or percentage as the only feedback during a run.
- Filling the screen: if a view looks sparse, that is fine.

---

## 17. Build plan (one path)

Follow this order. Do each step as a separate AI task, review in the browser, then move on.

**Phase 1: Foundation.** Vite + React, Tailwind, shadcn init, Lucide, router, `globals.css` from section 3, fonts, theme toggle, `AppLayout` with the sidebar and `PageHeader`. No pages yet.

**Phase 2: Static screens with mock JSON (no API).** Landing page, Demo, Login, Ingest, Run view (scripted simulation from `src/mocks/runSimulation.js`), Topics tree, Note reader with the HTML preview tab (use a long sample markdown containing code, a table and a mermaid diagram, plus a sample exported HTML string), Sources, Settings.

**Phase 3: Wire the API.** Supabase auth, `api/client.js`, one API module per resource, hooks with TanStack Query. Replace mocks one screen at a time. Do not change the visual design.

**Phase 4: Edge cases.** Rate limit, failed run and retry, dirty topics, 401 handling, export downloads, mobile layout, dark mode review.

### Antigravity prompts

**Prompt 1 (foundation)**
> Read DESIGN.md fully. Do not build pages yet. Set up Vite + React + Tailwind + shadcn/ui + Lucide + React Router. Implement `globals.css` exactly as written in section 3, install the three Fontsource packages, and add the light/dark theme toggle. Restyle the shadcn components listed in section 10 through the tokens only. Build `AppLayout`, `AppSidebar` and `PageHeader` per sections 5 and 8. No gradients, no raw Tailwind colors, no shadows on in-page elements. Stop when the shell renders with placeholder pages.

**Prompt 2 (ingest)**
> Build `/app/ingest` per section 9.2 using mocked submit behavior only. Tabs for share link and pasted text, validation, disabled and loading states, the rate-limit message, and the runs-left line. Follow the copy in section 11 exactly. Do not connect any API.

**Prompt 3 (run view)**
> Build `/app/processing/:sourceId` as the Run view in section 9.3: the flow (zone A), topic lanes with the visible review loop (zone B), the activity log (zone C), the detail sheet, technical details, and the finished and failed states. Drive it only from `src/mocks/runSimulation.js`, a scripted timeline that emits the response shape in section 13.1, including one topic that fails review once and then passes. Implement the stage mapping in `src/lib/pipelineStages.js`, the marker swipe and connector fill with reduced-motion fallbacks, and progressive "Open note" links. Also build "Watch a sample run" that replays the same simulation with no API. Use SVG or CSS for the flow; do not add a graph library.

**Prompt 3b (landing page)**
> Build the public landing page at `/` and the public `/demo` route per section 9.0. Make `/app/*` protected, redirecting to `/login` and back after sign-in. Header, hero, the embedded sample run (reuse the Run view components with `sampleRun.json` and the simulated clock; autoplay once on scroll into view, pause on hover, Replay button, static when reduced motion is on), the reader sample, the two row sections, "How it's built", the final call to action and footer. Use the exact copy in 9.0. No images, stock illustrations, fake logos, stats or testimonials, and no scroll animations. Links come from env vars.

**Prompt 4 (topics and reader)**
> Build `/app/topics` and `/app/topics/:topicId` per sections 9.4, 9.5 and 12. Build the topic tree from mock data with `parent_topic_id`, the note reader with react-markdown, code blocks with copy, tables, Mermaid with token-based theming and a parse-failure fallback, the sticky TOC with marker on the active section, and the version sheet. Use a long mock markdown note to test. Add the HTML preview tab per section 9.5b using a mock HTML string in a sandboxed iframe, with Open in new tab, Download and Full screen. Do not add any PDF option.

**Prompt 5 (sources and settings)**
> Build `/app/sources` and `/app/settings` per sections 9.6 and 9.7.

**Prompt 6 (wire the API)**
> Now connect the existing screens to the FastAPI backend using API.md. Create `api/client.js` with the Supabase bearer token and error mapping (401 signs out, 429 shows the rate-limit message), separate API modules, and TanStack Query hooks. Poll progress every 1.5 seconds with `after_event_id`. Fetch the HTML export with the auth header for the preview and the download. Never call the PDF endpoint. Replace mocks incrementally. Do not change the visual design or any copy.

---

## 18. Review checklist (run after every screen)

- [ ] Only semantic tokens used; no raw palette classes.
- [ ] No gradients, glass, colored shadows, or hover lifts.
- [ ] Radius hierarchy respected (4 / 6 / 8 / 12).
- [ ] Marker yellow appears only for active, current or matched states.
- [ ] Notes render in the serif at 66ch or narrower; UI in Geist.
- [ ] Sentence case, no ALL CAPS labels, no eyebrow text.
- [ ] Loading, empty and error states exist and use the copy from section 11.
- [ ] Works at 375px, 768px and 1440px, in light and dark.
- [ ] Keyboard focus is visible; icon-only buttons have labels.
- [ ] Run view shows flow, lanes, review loop and log from the contract in 13.1, not a spinner.
- [ ] No PDF anywhere. HTML preview works in a sandboxed iframe.
- [ ] Visiting `/` shows the landing page, never the login form; `/app/*` redirects to login when signed out.
- [ ] Landing page claims only what the product does today.
- [ ] Nothing was added that this file doesn't call for.
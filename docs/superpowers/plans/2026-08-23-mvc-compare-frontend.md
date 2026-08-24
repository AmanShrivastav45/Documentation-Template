# MVC Compare Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full MVP of the MVC Compare frontend — 5 screens (Compare, Sources, Ask, History, Settings) implementing the complete design system and component set specified in `DESIGN.md`, wired to the API contract in `frontend.md` via a mocked data layer that swaps to the live backend with zero code changes.

**Architecture:** Design tokens live as CSS custom properties (`tokens.css`), consumed by a Tailwind config that maps utility classes 1:1 to token names. The API client implements every `frontend.md` endpoint for real; MSW intercepts those requests in development and serves schema-accurate fixtures. Components layer bottom-up: primitives → signature/composed components → screens, each a standalone, independently reviewable unit. State is per-resource custom hooks (no server-state cache library) plus three small Contexts for theme, active run, and toasts.

**Tech Stack:** Vite, React 19, TypeScript, react-router, Tailwind CSS, msw (Mock Service Worker). No test runner — verification is manual (`tsc`, `eslint`, dev server) per the approved design.

## Global Constraints

These apply to every task below; do not repeat them per-task.

- **Never hard-code a hex value or magic spacing/radius number outside `src/styles/tokens.css`.** Every color, spacing, radius, and font value in component code must be a Tailwind class that resolves to a token (e.g. `bg-canvas`, `rounded-md`, `p-lg`), never an inline style or arbitrary Tailwind value like `bg-[#fff]`. **Exception, explicitly carved out — not a violation to flag:** DESIGN.md itself specifies a handful of one-off literal pixel dimensions for specific components that are not multiples of the spacing scale and were never meant to be tokenized (topbar `h-[52px]`, sidebar rail `w-[72px]`, stat-card `h-[88px]`, confidence-meter track `h-[3px]`, toast/empty-state `max-w-[380px]`, and similar). These appear verbatim in multiple task briefs as arbitrary Tailwind bracket values by design, matching DESIGN.md's own literal numbers. This constraint is about *colors* and *spacing/radius choices that should have come from the scale but didn't* — not about every literal pixel dimension in the design system. Do not re-flag these specific, brief-mandated arbitrary values in review; the constraint remains fully in force for any *new* literal hex color or an *invented* spacing/radius number not already sanctioned by a task's exact prescribed code.
- **Reference DESIGN.md tokens by name.** When a task's implementation corresponds to a `{component.x}` or `{colors.x}` entry in DESIGN.md, the code must use that exact name (in kebab-case) as the CSS variable / Tailwind key / component filename. Do not invent parallel names.
- **Ligatures are disabled on all evidence/code/ID text.** Any element rendering `fact_id`, `run_id`, operators, or source code must carry the `font-mono-noliga` utility (defined in Task 3) or equivalent explicit `font-variant-ligatures: none`.
- **Machine-emitted values are Fira Code; human-authored text is Roboto.** Never swap these per DESIGN.md's Typography section.
- **Verdict colour means verdict, nothing else.** `{colors.accent}` (blue) is reserved for selection, focus, and links — never used to imply a result.
- **No automated tests.** Each task's verification step is `npm run build` (which runs `tsc -b && vite build`), `npx eslint <changed files>`, and a manual check via `npm run dev` — never a test-runner invocation. **Do not substitute `npx tsc --noEmit` or `npx vite build` alone for the type-check.** This project's root `tsconfig.json` is solution-style (`"files": []`, only `references` to `tsconfig.app.json`/`tsconfig.node.json`), so a bare `tsc --noEmit` at the root silently checks nothing and exits 0 even with real type errors present — confirmed by injecting a deliberate type error and observing `tsc --noEmit` exit 0 while `npm run build`'s `tsc -b` correctly reported it. `vite build` alone also does not type-check (esbuild/SWC strip types without validating them). `npm run build`'s `tsc -b` is the only command in this project that actually performs full type-checking.
- **Commit after every task**, using `git add <exact files>` (never `git add -A`).
- **TypeScript strict**, no `any` in new code. Use the interfaces defined in Task 4 (`src/types/domain.ts`) everywhere a payload shape is needed — do not redeclare them locally in a component or hook.
- Node/npm commands are run from the repo root: `c:\Users\ammys\OneDrive\Desktop\mvc-gui`.

## File Structure

```
src/
  styles/
    tokens.css            # every DESIGN.md token as a CSS custom property, light + dark
    fonts.css              # @font-face + ligature-disable utilities
  types/
    domain.ts              # frontend.md interfaces (Verdict, CompareResponse, etc.)
  api/
    client.ts              # fetch wrapper, base URL/timeout from env
    errors.ts               # normalizeApiError
    health.ts, documents.ts, code.ts, compare.ts   # one function per endpoint, grouped by resource
  mocks/
    fixtures/               # JSON-shaped TS fixture data per resource
    handlers/                # MSW request handlers per resource
    browser.ts               # setupWorker() bootstrap
  context/
    ThemeContext.tsx, RunContext.tsx, ToastContext.tsx
  hooks/
    useDomains.ts, useRuns.ts, useDocuments.ts, useUpload.ts, useExtractPreview.ts,
    useIngest.ts, useCompare.ts, useAsk.ts, useHealth.ts
  history/
    store.ts                 # localStorage-backed compare history
  components/
    primitives/               # Button*, SelectField, TextInput, UrlInput, SegmentedControl,
                                # Toggle, ConfidenceMeter, VerdictChip, ContextChip, StatusChip, MetaBadge
    signature/                 # StatCard, EmptyState, Skeleton, HealthDot, CodeBlock, InlineCode,
                                # JsonViewer, RuleQuote, EvidenceBlock, DiscrepancyItem, VerdictSpine,
                                # CompareLedger, TriageRow, TriageList, ProgressCompare, FactMultiselect, FileDrop
  layout/
    TopBar.tsx, NavRail.tsx, AppLayout.tsx, Toast.tsx
  screens/
    Compare/, Sources/, Ask/, History/, Settings/
  App.tsx, main.tsx
index.html
tailwind.config.js
.env.development
```

---

### Task 1: Install and configure Tailwind, react-router, and MSW

**Files:**
- Modify: `package.json`
- Create: `tailwind.config.js`, `postcss.config.js`
- Modify: `src/index.css`
- Modify: `.gitignore` (add `public/mockServiceWorker.js` exclusion note — actually this file must be committed for MSW to work, see step 4)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a working `npm run dev` with Tailwind processing `src/index.css`, `react-router` importable, `msw` installed with its worker script generated into `public/`.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install react-router
npm install -D "tailwindcss@^3" postcss autoprefixer msw
```
Expected: all four packages added to `package.json` (react-router under `dependencies`; the rest under `devDependencies`). **Pin `tailwindcss` to the `3.x` line explicitly** — every later task's `tailwind.config.js` uses the v3 JS-based config API (`theme.extend`, the array-form `darkMode` selector), and `src/index.css` uses the v3 `@tailwind base/components/utilities` directives. An unpinned install resolves to Tailwind v4, whose PostCSS plugin moved to a separate `@tailwindcss/postcss` package and rejects the v3 directives outright — it throws the moment any CSS imports `src/index.css`, which is not caught by a bare `npm run dev` boot check (Vite transforms CSS lazily, on first request). Step 5 below verifies the CSS pipeline actually runs, not just that the dev server process starts, specifically to catch this.

- [ ] **Step 2: Initialize Tailwind config**

Create `postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Create `tailwind.config.js` (base shell — token mapping added in Task 3):
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 3: Wire Tailwind into the global stylesheet**

Replace the contents of `src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

(Any prior boilerplate rules from the Vite template are removed — DESIGN.md's tokens/Tailwind utilities fully replace them starting in Task 2/3.)

- [ ] **Step 4: Generate the MSW worker script**

Run:
```bash
npx msw init public/ --save
```
Expected: `public/mockServiceWorker.js` is created and `package.json` gains a `"msw": { "workerDirectory": ["public"] }` entry. This file must be committed (it is required at runtime, not a build artifact) — do not add it to `.gitignore`.

- [ ] **Step 5: Verify the dev server starts and the CSS pipeline actually compiles**

Run: `npm run dev`
Expected: Vite starts without errors on `http://localhost:5173`. A bare process boot is not sufficient — Vite transforms CSS lazily on first request, so a broken PostCSS/Tailwind pipeline will not surface until something actually requests `src/index.css`. Run `npx vite build` instead (or in addition): a production build forces every module, including `src/index.css` (imported from `src/main.tsx`), through the full PostCSS/Tailwind transform, so any PostCSS plugin failure surfaces as a build error. Expected: `vite build` exits 0. Stop the dev server (Ctrl+C) if you ran it.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint .`
Expected: no errors (the existing template files still compile; nothing has changed their types yet).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tailwind.config.js postcss.config.js src/index.css public/mockServiceWorker.js
git commit -m "chore: install Tailwind, react-router, and MSW"
```

---

### Task 2: Design tokens as CSS custom properties (light + dark)

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/index.css` (import tokens)

**Interfaces:**
- Consumes: nothing.
- Produces: every CSS custom property referenced by Task 3's `tailwind.config.js`, under `:root` (light values) and `[data-theme="dark"]` (dark values). Naming convention: `--color-<name>`, `--spacing-<name>`, `--rounded-<name>`, `--font-<family>`, matching DESIGN.md token names with the category prefixed (e.g. `{colors.verdict-aligned}` → `--color-verdict-aligned`).

- [ ] **Step 1: Write the tokens file**

Create `src/styles/tokens.css` with every value from DESIGN.md's *Colors*, *Layout → Spacing System*, and *Shapes → Border Radius Scale* sections:

```css
:root {
  /* Brand & Accent */
  --color-accent: #1f6feb;
  --color-accent-deep: #1856bd;
  --color-accent-tint: #eaf2fe;
  --color-on-accent: #ffffff;

  /* Surface */
  --color-canvas: #ffffff;
  --color-surface: #f7f8f9;
  --color-surface-raised: #ffffff;
  --color-surface-sunken: #f1f2f4;
  --color-hairline: #e4e6e9;
  --color-hairline-strong: #cfd3d8;
  --color-overlay: rgba(15, 17, 19, 0.40);

  /* Text */
  --color-ink: #16191d;
  --color-body: #33383f;
  --color-mute: #616973;
  --color-stone: #858d97;
  --color-faint: #b6bcc4;
  --color-on-fill: #ffffff;

  /* Verdict */
  --color-verdict-aligned: #0e7a55;
  --color-verdict-aligned-tint: #e7f4ee;
  --color-verdict-partial: #a96500;
  --color-verdict-partial-tint: #fcf2e2;
  --color-verdict-misaligned: #c1362b;
  --color-verdict-misaligned-tint: #fbeae8;
  --color-verdict-unrelated: #5c6570;
  --color-verdict-unrelated-tint: #f1f2f4;

  /* Code Syntax Theme — "Ledger" */
  --color-code-bg: #fbfbfc;
  --color-code-gutter: #f1f2f4;
  --color-code-line-no: #a8aeb6;
  --color-code-plain: #16191d;
  --color-code-comment: #8a9099;
  --color-code-keyword: #7a3ea1;
  --color-code-string: #2c6e8a;
  --color-code-number: #9b3b6e;
  --color-code-function: #16191d;
  --color-code-operator: #4a5058;
  --color-code-punct: #8a9099;
  --color-code-evidence-bg: var(--color-verdict-aligned-tint);

  /* Spacing (base unit 4px) */
  --spacing-xxs: 2px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-xxl: 32px;
  --spacing-xxxl: 48px;
  --spacing-section: 64px;

  /* Radius */
  --rounded-none: 0px;
  --rounded-xs: 3px;
  --rounded-sm: 4px;
  --rounded-md: 6px;
  --rounded-lg: 10px;
  --rounded-full: 9999px;

  /* Shadow */
  --shadow-pop: 0 4px 16px rgba(15, 17, 19, 0.10), 0 1px 2px rgba(15, 17, 19, 0.06);
}

[data-theme="dark"] {
  --color-accent: #4c8df6;
  --color-accent-deep: #2f74d8;
  --color-accent-tint: rgba(76, 141, 246, 0.14);
  --color-on-accent: #ffffff;

  --color-canvas: #0f1113;
  --color-surface: #16191c;
  --color-surface-raised: #1c2024;
  --color-surface-sunken: #101215;
  --color-hairline: rgba(255, 255, 255, 0.09);
  --color-hairline-strong: rgba(255, 255, 255, 0.18);
  --color-overlay: rgba(0, 0, 0, 0.60);

  --color-ink: #e9ebed;
  --color-body: #c6cad0;
  --color-mute: #949ba4;
  --color-stone: #727a83;
  --color-faint: #4e565f;
  --color-on-fill: #0f1113;

  --color-verdict-aligned: #3fbf8f;
  --color-verdict-aligned-tint: rgba(63, 191, 143, 0.13);
  --color-verdict-partial: #e8a33d;
  --color-verdict-partial-tint: rgba(232, 163, 61, 0.13);
  --color-verdict-misaligned: #f2685c;
  --color-verdict-misaligned-tint: rgba(242, 104, 92, 0.13);
  --color-verdict-unrelated: #8a939e;
  --color-verdict-unrelated-tint: rgba(255, 255, 255, 0.06);

  --color-code-bg: #131619;
  --color-code-gutter: #181b1f;
  --color-code-line-no: #5a626b;
  --color-code-plain: #e9ebed;
  --color-code-comment: #6f7780;
  --color-code-keyword: #c08ce8;
  --color-code-string: #7fc4de;
  --color-code-number: #e895be;
  --color-code-function: #e9ebed;
  --color-code-operator: #b6bcc4;
  --color-code-punct: #6f7780;
  --color-code-evidence-bg: var(--color-verdict-aligned-tint);

  --shadow-pop: 0 4px 20px rgba(0, 0, 0, 0.55);
}
```

- [ ] **Step 2: Import tokens before Tailwind layers**

Modify `src/index.css` so tokens load first:
```css
@import "./styles/tokens.css";
@import "./styles/fonts.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

(`fonts.css` is created in Task 3 — this import is added now so Step 2's ordering is correct; Task 3 will create the file it points to.)

- [ ] **Step 3: Verify no build error from the forward import**

Since `fonts.css` does not exist yet, this will fail. Create a temporary placeholder so this task is independently verifiable:

Create `src/styles/fonts.css`:
```css
/* populated in Task 3 */
```

Run: `npm run dev` — Expected: server starts, no CSS import error. Stop the server.

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint .`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/tokens.css src/styles/fonts.css src/index.css
git commit -m "feat: add design tokens as CSS custom properties for light and dark themes"
```

---

### Task 3: Tailwind token mapping, fonts, and ligature utilities

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/styles/fonts.css`
- Create: `public/fonts/` (WOFF2 files — see Step 1 note on sourcing)
- Modify: `index.html` (font preload, blocking theme script, `color-scheme` meta)

**Interfaces:**
- Consumes: CSS variables from Task 2 (`--color-*`, `--spacing-*`, `--rounded-*`, `--shadow-pop`).
- Produces: Tailwind utility classes (`bg-canvas`, `text-verdict-misaligned`, `p-lg`, `rounded-lg`, `shadow-pop`, `font-sans`, `font-mono`, `font-mono-noliga`) usable by every later component task. Also produces `resolveTheme(): 'light' | 'dark'` and the inline bootstrap script contract: `<html data-theme="...">` is set before first paint.

- [ ] **Step 1: Source font files**

Download Roboto (400, 500, 700) and Fira Code (400, 500) WOFF2 subsets and place them at:
```
public/fonts/roboto-400.woff2
public/fonts/roboto-500.woff2
public/fonts/roboto-700.woff2
public/fonts/fira-code-400.woff2
public/fonts/fira-code-500.woff2
```
(These are static binary assets — obtain them from Google Fonts' official WOFF2 distribution for Roboto and Fira Code and copy the files into place. No code is generated for this step.)

- [ ] **Step 2: Write `@font-face` and ligature-disable rules**

Replace `src/styles/fonts.css`:
```css
@font-face {
  font-family: "Roboto";
  src: url("/fonts/roboto-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Roboto";
  src: url("/fonts/roboto-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Roboto";
  src: url("/fonts/roboto-700.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fira Code";
  src: url("/fonts/fira-code-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Fira Code";
  src: url("/fonts/fira-code-500.woff2") format("woff2");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

.code-block,
.fact-id,
.operator-list,
.inline-code {
  font-variant-ligatures: none;
  font-feature-settings: "calt" 0, "liga" 0;
}
```

- [ ] **Step 3: Map Tailwind theme to tokens**

Replace `tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: "var(--color-accent)",
        "accent-deep": "var(--color-accent-deep)",
        "accent-tint": "var(--color-accent-tint)",
        "on-accent": "var(--color-on-accent)",
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        "surface-raised": "var(--color-surface-raised)",
        "surface-sunken": "var(--color-surface-sunken)",
        hairline: "var(--color-hairline)",
        "hairline-strong": "var(--color-hairline-strong)",
        overlay: "var(--color-overlay)",
        ink: "var(--color-ink)",
        body: "var(--color-body)",
        mute: "var(--color-mute)",
        stone: "var(--color-stone)",
        faint: "var(--color-faint)",
        "on-fill": "var(--color-on-fill)",
        "verdict-aligned": "var(--color-verdict-aligned)",
        "verdict-aligned-tint": "var(--color-verdict-aligned-tint)",
        "verdict-partial": "var(--color-verdict-partial)",
        "verdict-partial-tint": "var(--color-verdict-partial-tint)",
        "verdict-misaligned": "var(--color-verdict-misaligned)",
        "verdict-misaligned-tint": "var(--color-verdict-misaligned-tint)",
        "verdict-unrelated": "var(--color-verdict-unrelated)",
        "verdict-unrelated-tint": "var(--color-verdict-unrelated-tint)",
        "code-bg": "var(--color-code-bg)",
        "code-gutter": "var(--color-code-gutter)",
        "code-line-no": "var(--color-code-line-no)",
        "code-plain": "var(--color-code-plain)",
        "code-comment": "var(--color-code-comment)",
        "code-keyword": "var(--color-code-keyword)",
        "code-string": "var(--color-code-string)",
        "code-number": "var(--color-code-number)",
        "code-function": "var(--color-code-function)",
        "code-operator": "var(--color-code-operator)",
        "code-punct": "var(--color-code-punct)",
        "code-evidence-bg": "var(--color-code-evidence-bg)",
      },
      spacing: {
        xxs: "var(--spacing-xxs)",
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        xxl: "var(--spacing-xxl)",
        xxxl: "var(--spacing-xxxl)",
        section: "var(--spacing-section)",
      },
      borderRadius: {
        none: "var(--rounded-none)",
        xs: "var(--rounded-xs)",
        sm: "var(--rounded-sm)",
        md: "var(--rounded-md)",
        lg: "var(--rounded-lg)",
        full: "var(--rounded-full)",
      },
      boxShadow: {
        pop: "var(--shadow-pop)",
      },
      fontFamily: {
        sans: ["Roboto", "Helvetica Neue", "Arial", "system-ui", "sans-serif"],
        mono: ["Fira Code", "JetBrains Mono", "SF Mono", "Consolas", "monospace"],
      },
      fontSize: {
        "title-xl": ["32px", { lineHeight: "1.2", letterSpacing: "-0.6px" }],
        "title-lg": ["24px", { lineHeight: "1.25", letterSpacing: "-0.4px" }],
        "title-md": ["20px", { lineHeight: "1.3", letterSpacing: "-0.2px" }],
        "title-sm": ["16px", { lineHeight: "1.4", letterSpacing: "0" }],
        "body-lg": ["16px", { lineHeight: "1.6", letterSpacing: "0" }],
        "body-md": ["14px", { lineHeight: "1.55", letterSpacing: "0" }],
        "body-sm": ["13px", { lineHeight: "1.5", letterSpacing: "0" }],
        "label-md": ["13px", { lineHeight: "1.4", letterSpacing: "0" }],
        "label-sm": ["12px", { lineHeight: "1.35", letterSpacing: "0" }],
        caption: ["12px", { lineHeight: "1.4", letterSpacing: "0" }],
        "stat-xl": ["34px", { lineHeight: "1.0", letterSpacing: "-0.5px" }],
        "mono-eyebrow": ["11px", { lineHeight: "1.2", letterSpacing: "0.9px" }],
        "mono-id": ["12px", { lineHeight: "1.3", letterSpacing: "0.2px" }],
        "mono-code": ["13px", { lineHeight: "1.65", letterSpacing: "0" }],
        "mono-code-sm": ["12px", { lineHeight: "1.6", letterSpacing: "0" }],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Add the `font-mono-noliga` utility and blocking theme script**

Append to `src/index.css` (after the Tailwind layers):
```css
.font-mono-noliga {
  font-variant-ligatures: none;
  font-feature-settings: "calt" 0, "liga" 0;
}
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

Modify `index.html` — add inside `<head>`, before any stylesheet link, a blocking inline script resolving the theme, plus the `color-scheme` meta tag and font preloads:
```html
<meta name="color-scheme" content="light dark" />
<script>
  (function () {
    var stored = localStorage.getItem("mvc.theme");
    var mode = stored === "light" || stored === "dark" ? stored : "system";
    var resolved =
      mode === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : mode;
    document.documentElement.setAttribute("data-theme", resolved);
  })();
</script>
<link rel="preload" as="font" type="font/woff2" href="/fonts/roboto-400.woff2" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/fonts/fira-code-400.woff2" crossorigin />
```

Also set the base body font/colors in `src/index.css` `@layer base`:
```css
@layer base {
  html,
  body,
  #root {
    height: 100%;
  }
  body {
    @apply bg-canvas text-ink font-sans text-body-md;
    transition: background-color 120ms ease-out, color 120ms ease-out;
  }
}
```
The 120ms transition is DESIGN.md's own ceiling for the theme switch ("do not animate the theme switch beyond a 120ms background/colour fade") — it's intentionally on `body` only, not inherited by every element, so component-level colour changes (e.g. a verdict) are never implicitly animated by this rule.

- [ ] **Step 5: Verify tokens resolve visually**

Run: `npm run dev`, open `http://localhost:5173`. Expected: page background is white (`#ffffff`) with no console errors about missing fonts (network tab shows the WOFF2 files loading, 200 status). Toggle OS dark mode and reload — background should switch to `#0f1113` because of the inline script. Stop the server.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint .`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.js src/styles/fonts.css src/index.css index.html public/fonts
git commit -m "feat: map Tailwind to design tokens, add fonts and theme bootstrap script"
```

---

### Task 4: Domain types and `.env.development`

**Files:**
- Create: `src/types/domain.ts`
- Create: `.env.development`
- Modify: `.gitignore` (ensure `.env*.local` stays ignored; `.env.development` itself is committed since it has no secrets)

**Interfaces:**
- Consumes: nothing.
- Produces: every TypeScript type used by later tasks — `Verdict`, `CompareSummary`, `Discrepancy`, `FactVerdict`, `RuleReference`, `CompareResponse`, `Domain`, `DocumentRecord`, `IngestionStatus`, `CodeRun`, `CodeChunk`, `ExtractResponse`, `CodeFact`, `IngestResponse`, `AskSource`, `AskResponse`, `SearchProfile`, `HealthStatus`.

- [ ] **Step 1: Write the domain types**

Create `src/types/domain.ts`:
```typescript
export type Verdict = "Aligned" | "Partial" | "Misaligned" | "Unrelated";

export type SearchProfile = "precise" | "balanced" | "comprehensive";

export interface CompareSummary {
  total: number;
  aligned: number;
  partial: number;
  misaligned: number;
  unrelated: number;
}

export type DiscrepancyType =
  | "wrong_value"
  | "missing_constraint"
  | "wrong_formula"
  | "missing_logic"
  | "wrong_operator"
  | "unimplemented";

export interface Discrepancy {
  type: DiscrepancyType;
  description: string;
  rule_text?: string | null;
  code_location?: string | null;
}

export interface RuleReference {
  document_name: string;
  chunk_index: number;
  similarity_score: number;
  rule_text: string;
}

export interface FactVerdict {
  fact_id: string;
  qualified_name: string;
  fact_type: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  discrepancies: Discrepancy[];
  rule_reference?: RuleReference | null;
}

export interface CompareResponse {
  run_id: string;
  domain: string;
  compared_at: string;
  total_facts_in_run: number;
  facts_compared: number;
  summary: CompareSummary;
  verdicts: FactVerdict[];
  artifact_path?: string | null;
}

export interface CompareRequest {
  run_id: string;
  domain: string;
  fact_ids?: string[] | null;
  key_only: boolean;
  search_profile: SearchProfile;
}

export interface DomainsResponse {
  default_domain: string;
  domains: string[];
}

export type IngestionStatus = "ingested" | "pending" | "failed";

export interface DocumentRecord {
  filename: string;
  domain: string;
  uploaded_at: string;
  saved_path: string;
  metadata_path: string;
  ingestion_status: IngestionStatus;
  was_added: boolean;
}

export interface UploadResponse {
  filename: string;
  domain: string;
  saved_path: string;
  metadata_path: string;
  ingestion_result: {
    status: IngestionStatus;
    was_added: boolean;
    filename: string;
  };
}

export type PromptType =
  | "default"
  | "classification"
  | "analysis"
  | "audit"
  | "business"
  | "rtb"
  | "user"
  | "development";

export interface AskRequest {
  question: string;
  domain: string;
  prompt_type: PromptType;
  search_profile: SearchProfile;
}

export interface AskSource {
  source_location: {
    document_name: string;
    chunk_index: number;
    document_type: string;
    match_type: string;
    similarity_score: number;
    context: string;
    url: string | null;
  };
}

export interface AskResponse {
  question: string;
  answer: string;
  sources: AskSource[];
}

export interface CodeRun {
  run_id: string;
  created_at: string;
  file_path: string;
  language: string;
  facts_total: number;
  key_calculation_count: number;
  llm_refined: boolean;
  llm_skip_reason: string | null;
  artifact_path: string;
}

export interface ExtractRequest {
  url: string;
  branch?: string | null;
  key_only: boolean;
}

export interface CodeChunk {
  chunk_id: string;
  type: string;
  name: string;
  qualified_name: string;
  signature: string;
  docstring: string | null;
  source_code: string;
  start_line: number;
  end_line: number;
  parent_context: {
    type: string;
    name: string;
    docstring: string | null;
    bases: string[];
  } | null;
  decorators: string[];
  is_key_calculation: boolean;
}

export interface ExtractResponse {
  file_path: string;
  language: string;
  metadata: {
    url: string;
    branch: string;
    requested_at: string;
  };
  chunk_count: number;
  key_calculation_count: number;
  imports_in_file: string[];
  chunks: CodeChunk[];
}

export interface CodeFact {
  fact_id: string;
  fact_type: string;
  name: string;
  qualified_name: string;
  origin: {
    file_path: string;
    qualified_name: string;
    start_line: number;
    end_line: number;
  };
  logic: {
    canonical_expression: string;
    operators: string[];
    functions_called: string[];
  };
  semantics: {
    business_intent: string;
    is_key_calculation: boolean;
    confidence: number;
  };
  evidence: {
    code_snippet: string;
    decorators: string[];
  };
  embedding_text: string;
}

export interface IngestResponse {
  source_metadata: {
    file_path: string;
    language: string;
    chunk_count: number;
    key_calculation_count: number;
    imports_in_file: string[];
  };
  normalization_summary: {
    facts_total: number;
    formula_facts: number;
    condition_facts: number;
    aggregation_facts: number;
    constant_facts: number;
    data_dependency_facts: number;
    function_dependency_facts: number;
    unclassified_facts: number;
  };
  code_facts: CodeFact[];
  chunk_index: Array<{
    chunk_id: string;
    qualified_name: string;
    type: string;
    start_line: number;
    end_line: number;
    fact_ids: string[];
  }>;
  normalization_warnings: string[];
  llm_refined: boolean;
  llm_skip_reason: string | null;
}

export interface HealthStatus {
  status: "ok" | "unreachable";
}
```

- [ ] **Step 2: Write the environment file**

Create `.env.development`:
```env
VITE_MVC_API_BASE_URL=http://localhost:8000
VITE_MVC_API_TIMEOUT_MS=60000
VITE_MVC_API_RETRIES=1
VITE_MVC_USE_MOCKS=true
```

`VITE_MVC_USE_MOCKS` is the single switch consumed in Task 8 to enable/disable the MSW worker — flipping it to `false` (and pointing `VITE_MVC_API_BASE_URL` at a real host) is the entire "go live" step referenced in the design doc.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (this file only declares types, nothing consumes them yet).

- [ ] **Step 4: Commit**

```bash
git add src/types/domain.ts .env.development
git commit -m "feat: add domain types and environment configuration"
```

---

### Task 5: API client core — fetch wrapper and error normalizer

**Files:**
- Create: `src/api/client.ts`
- Create: `src/api/errors.ts`

**Interfaces:**
- Consumes: `import.meta.env.VITE_MVC_API_BASE_URL`, `VITE_MVC_API_TIMEOUT_MS` (Task 4).
- Produces: `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` — throws a `NormalizedApiError` on any non-2xx response or network/timeout failure. `normalizeApiError(err: unknown): NormalizedApiError` and the `NormalizedApiError` type, both consumed by Task 9's `ToastContext` and every `use*` hook from Task 6 onward.

- [ ] **Step 1: Write the error normalizer**

Create `src/api/errors.ts`:
```typescript
export interface NormalizedApiError {
  status: number | undefined;
  message: string;
  detail?: unknown;
}

export function normalizeApiError(err: unknown): NormalizedApiError {
  const anyErr = err as {
    status?: number;
    detail?: unknown;
    response?: { status?: number; data?: { detail?: unknown } };
  };
  const status = anyErr?.status ?? anyErr?.response?.status;
  const detail = anyErr?.detail ?? anyErr?.response?.data?.detail;

  if (typeof detail === "string") {
    return { status, message: detail, detail };
  }

  if (detail && typeof detail === "object") {
    const msg =
      (detail as { message?: string }).message ??
      (Array.isArray(detail) && detail[0]?.message) ??
      "Request failed";
    return { status, message: msg, detail };
  }

  if (err instanceof Error) {
    return { status, message: err.message, detail };
  }

  return { status, message: "Unexpected API error", detail };
}
```

- [ ] **Step 2: Write the fetch wrapper**

Create `src/api/client.ts`:
```typescript
import { normalizeApiError, type NormalizedApiError } from "./errors";

const BASE_URL = import.meta.env.VITE_MVC_API_BASE_URL as string;
const TIMEOUT_MS = Number(import.meta.env.VITE_MVC_API_TIMEOUT_MS ?? 60000);

export class ApiClientError extends Error {
  status?: number;
  detail?: unknown;
  constructor(normalized: NormalizedApiError) {
    super(normalized.message);
    this.status = normalized.status;
    this.detail = normalized.detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers:
        init?.body instanceof FormData
          ? init?.headers
          : { "Content-Type": "application/json", ...init?.headers },
    });

    if (!res.ok) {
      let detail: unknown;
      try {
        const body = await res.json();
        detail = body?.detail ?? body;
      } catch {
        detail = res.statusText;
      }
      throw new ApiClientError(normalizeApiError({ status: res.status, detail }));
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiClientError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiClientError({
        status: undefined,
        message: `Request timed out after ${TIMEOUT_MS}ms`,
      });
    }
    throw new ApiClientError(normalizeApiError(err));
  } finally {
    clearTimeout(timeout);
  }
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function apiPostForm<T>(path: string, form: FormData): Promise<T> {
  return request<T>(path, { method: "POST", body: form });
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/api`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/api/client.ts src/api/errors.ts
git commit -m "feat: add API fetch wrapper and error normalizer"
```

---

### Task 6: Resource-grouped API endpoint functions

**Files:**
- Create: `src/api/health.ts`, `src/api/documents.ts`, `src/api/code.ts`, `src/api/compare.ts`

**Interfaces:**
- Consumes: `apiGet`, `apiPost`, `apiPostForm` (Task 5); all types from `src/types/domain.ts` (Task 4).
- Produces: `getHealth()`, `getDomains()`, `listDocuments()`, `uploadDocument()`, `queryDocuments()`, `listCodeRuns()`, `extractCode()`, `ingestCode()`, `runCompare()` — the exact function names every hook in Tasks 7 and screen tasks import.

- [ ] **Step 1: Health endpoint**

Create `src/api/health.ts`:
```typescript
import { apiGet } from "./client";
import type { HealthStatus, DomainsResponse } from "../types/domain";

export function getHealth(): Promise<{ status: string }> {
  return apiGet("/api/v1/health");
}

export function getDomains(): Promise<DomainsResponse> {
  return apiGet("/api/v1/documents/domains");
}

export type { HealthStatus };
```

- [ ] **Step 2: Documents endpoints**

Create `src/api/documents.ts`:
```typescript
import { apiGet, apiPost, apiPostForm } from "./client";
import type {
  DocumentRecord,
  UploadResponse,
  AskRequest,
  AskResponse,
} from "../types/domain";

export function listDocuments(): Promise<{ documents: DocumentRecord[] }> {
  return apiGet("/api/v1/documents/list");
}

export function uploadDocument(file: File, domain: string): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("domain", domain);
  return apiPostForm("/api/v1/documents/upload", form);
}

export function queryDocuments(payload: AskRequest): Promise<AskResponse> {
  return apiPost("/api/v1/documents/query", payload);
}
```

- [ ] **Step 3: Code endpoints**

Create `src/api/code.ts`:
```typescript
import { apiGet, apiPost } from "./client";
import type {
  CodeRun,
  ExtractRequest,
  ExtractResponse,
  IngestResponse,
} from "../types/domain";

export function listCodeRuns(): Promise<{ runs: CodeRun[] }> {
  return apiGet("/api/v1/code/runs");
}

export function extractCode(payload: ExtractRequest): Promise<ExtractResponse> {
  return apiPost("/api/v1/code/extract", payload);
}

export function ingestCode(payload: ExtractRequest): Promise<IngestResponse> {
  return apiPost("/api/v1/code/ingest", payload);
}
```

- [ ] **Step 4: Compare endpoint**

Create `src/api/compare.ts`:
```typescript
import { apiPost } from "./client";
import type { CompareRequest, CompareResponse } from "../types/domain";

export function runCompare(payload: CompareRequest): Promise<CompareResponse> {
  return apiPost("/api/v1/compare", payload);
}
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/api`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/api/health.ts src/api/documents.ts src/api/code.ts src/api/compare.ts
git commit -m "feat: add resource-grouped API endpoint functions"
```

---

### Task 7: MSW fixtures and handlers for simple endpoints (health, domains, documents, code)

**Files:**
- Create: `src/mocks/fixtures/domains.ts`, `src/mocks/fixtures/documents.ts`, `src/mocks/fixtures/codeRuns.ts`, `src/mocks/fixtures/extract.ts`, `src/mocks/fixtures/ingest.ts`
- Create: `src/mocks/handlers/simple.ts`

**Interfaces:**
- Consumes: types from Task 4, the `/api/v1/*` paths documented in `frontend.md`.
- Produces: a `simpleHandlers: RequestHandler[]` array consumed by Task 8's `src/mocks/browser.ts`.

- [ ] **Step 1: Domains and health fixtures**

Create `src/mocks/fixtures/domains.ts`:
```typescript
import type { DomainsResponse } from "../../types/domain";

export const domainsFixture: DomainsResponse = {
  default_domain: "rtb",
  domains: ["rtb", "sbi", "exposure", "margin"],
};
```

- [ ] **Step 2: Documents fixture**

Create `src/mocks/fixtures/documents.ts`:
```typescript
import type { DocumentRecord } from "../../types/domain";

export const documentsFixture: DocumentRecord[] = [
  {
    filename: "RTB_Model_Policy_v3.pdf",
    domain: "rtb",
    uploaded_at: "2026-08-19T09:12:10.113Z",
    saved_path: "C:/data/uploads/documents/RTB_Model_Policy_v3.pdf",
    metadata_path: "C:/data/uploads/metadata/RTB_Model_Policy_v3_metadata.json",
    ingestion_status: "ingested",
    was_added: true,
  },
  {
    filename: "SBI_Margin_Framework.docx",
    domain: "sbi",
    uploaded_at: "2026-08-20T14:02:41.000Z",
    saved_path: "C:/data/uploads/documents/SBI_Margin_Framework.docx",
    metadata_path: "C:/data/uploads/metadata/SBI_Margin_Framework_metadata.json",
    ingestion_status: "pending",
    was_added: true,
  },
  {
    filename: "Exposure_Notes.txt",
    domain: "exposure",
    uploaded_at: "2026-08-21T11:30:00.000Z",
    saved_path: "C:/data/uploads/documents/Exposure_Notes.txt",
    metadata_path: "C:/data/uploads/metadata/Exposure_Notes_metadata.json",
    ingestion_status: "failed",
    was_added: false,
  },
];
```

- [ ] **Step 3: Code runs fixture**

Create `src/mocks/fixtures/codeRuns.ts`:
```typescript
import type { CodeRun } from "../../types/domain";

export const codeRunsFixture: CodeRun[] = [
  {
    run_id: "20260819_141851_market_risk_engine",
    created_at: "20260819_141851",
    file_path: "risk/market_risk_engine.py",
    language: "python",
    facts_total: 37,
    key_calculation_count: 9,
    llm_refined: true,
    llm_skip_reason: null,
    artifact_path: "C:/data/code/facts/20260819_141851_market_risk_engine_facts.json",
  },
  {
    run_id: "20260821_101200_margin_calculator",
    created_at: "20260821_101200",
    file_path: "risk/margin_calculator.py",
    language: "python",
    facts_total: 14,
    key_calculation_count: 5,
    llm_refined: false,
    llm_skip_reason: "LLM_TIMEOUT",
    artifact_path: "C:/data/code/facts/20260821_101200_margin_calculator_facts.json",
  },
];
```

- [ ] **Step 4: Extract fixture**

Create `src/mocks/fixtures/extract.ts`:
```typescript
import type { ExtractResponse } from "../../types/domain";

export const extractFixture: ExtractResponse = {
  file_path: "src/trade_handler.py",
  language: "python",
  metadata: {
    url: "https://gitlab.nomura.com/group/repo/-/blob/master/src/trade_handler.py",
    branch: "master",
    requested_at: "2026-08-23T09:20:10.000Z",
  },
  chunk_count: 2,
  key_calculation_count: 1,
  imports_in_file: ["import pandas as pd"],
  chunks: [
    {
      chunk_id: "src/trade_handler.py::TradeHandler::compute_margin",
      type: "method",
      name: "compute_margin",
      qualified_name: "TradeHandler.compute_margin",
      signature: "def compute_margin(self, exposure_df: pd.DataFrame) -> float:",
      docstring: "Computes margin for portfolio.",
      source_code: "def compute_margin(self, exposure_df):\n    return exposure_df['exposure'].sum() * self.haircut_rate",
      start_line: 117,
      end_line: 163,
      parent_context: {
        type: "class",
        name: "TradeHandler",
        docstring: null,
        bases: ["BaseHandler"],
      },
      decorators: [],
      is_key_calculation: true,
    },
    {
      chunk_id: "src/trade_handler.py::TradeHandler::log_trade",
      type: "method",
      name: "log_trade",
      qualified_name: "TradeHandler.log_trade",
      signature: "def log_trade(self, trade_id: str) -> None:",
      docstring: null,
      source_code: "def log_trade(self, trade_id):\n    logger.info('trade %s', trade_id)",
      start_line: 170,
      end_line: 173,
      parent_context: {
        type: "class",
        name: "TradeHandler",
        docstring: null,
        bases: ["BaseHandler"],
      },
      decorators: [],
      is_key_calculation: false,
    },
  ],
};
```

- [ ] **Step 5: Ingest fixture**

Create `src/mocks/fixtures/ingest.ts`:
```typescript
import type { IngestResponse } from "../../types/domain";

export const ingestFixture: IngestResponse = {
  source_metadata: {
    file_path: "src/trade_handler.py",
    language: "python",
    chunk_count: 2,
    key_calculation_count: 1,
    imports_in_file: ["import pandas as pd"],
  },
  normalization_summary: {
    facts_total: 2,
    formula_facts: 1,
    condition_facts: 0,
    aggregation_facts: 1,
    constant_facts: 0,
    data_dependency_facts: 0,
    function_dependency_facts: 0,
    unclassified_facts: 0,
  },
  code_facts: [
    {
      fact_id: "CF-0001",
      fact_type: "formula",
      name: "compute_margin",
      qualified_name: "TradeHandler.compute_margin",
      origin: {
        file_path: "src/trade_handler.py",
        qualified_name: "TradeHandler.compute_margin",
        start_line: 117,
        end_line: 163,
      },
      logic: {
        canonical_expression: "return exposure * haircut_rate",
        operators: ["*"],
        functions_called: ["sum"],
      },
      semantics: {
        business_intent: "Compute margin from exposure and haircut",
        is_key_calculation: true,
        confidence: 0.92,
      },
      evidence: {
        code_snippet: "def compute_margin(self, exposure_df):\n    return exposure_df['exposure'].sum() * self.haircut_rate",
        decorators: [],
      },
      embedding_text: "Type: formula. Computes margin from exposure and haircut.",
    },
  ],
  chunk_index: [
    {
      chunk_id: "src/trade_handler.py::TradeHandler::compute_margin",
      qualified_name: "TradeHandler.compute_margin",
      type: "method",
      start_line: 117,
      end_line: 163,
      fact_ids: ["CF-0001"],
    },
  ],
  normalization_warnings: [],
  llm_refined: true,
  llm_skip_reason: null,
};
```

- [ ] **Step 6: Register handlers**

Create `src/mocks/handlers/simple.ts`:
```typescript
import { http, HttpResponse } from "msw";
import { domainsFixture } from "../fixtures/domains";
import { documentsFixture } from "../fixtures/documents";
import { codeRunsFixture } from "../fixtures/codeRuns";
import { extractFixture } from "../fixtures/extract";
import { ingestFixture } from "../fixtures/ingest";

const BASE = import.meta.env.VITE_MVC_API_BASE_URL as string;

export const simpleHandlers = [
  http.get(`${BASE}/api/v1/health`, () => HttpResponse.json({ status: "ok" })),
  http.get(`${BASE}/api/v1/documents/domains`, () => HttpResponse.json(domainsFixture)),
  http.get(`${BASE}/api/v1/documents/list`, () =>
    HttpResponse.json({ documents: documentsFixture })
  ),
  http.post(`${BASE}/api/v1/documents/upload`, async ({ request }) => {
    const form = await request.formData();
    const domain = String(form.get("domain") ?? "rtb");
    if (!domainsFixture.domains.includes(domain)) {
      return HttpResponse.json(
        {
          detail: [
            {
              message: `Unsupported domain '${domain}'.`,
              allowed_domains: domainsFixture.domains,
            },
          ],
        },
        { status: 422 }
      );
    }
    const file = form.get("file") as File | null;
    const filename = file?.name ?? "unknown";
    return HttpResponse.json(
      {
        filename,
        domain,
        saved_path: `C:/data/uploads/documents/${filename}`,
        metadata_path: `C:/data/uploads/metadata/${filename}_metadata.json`,
        ingestion_result: { status: "ingested", was_added: true, filename },
      },
      { status: 201 }
    );
  }),
  http.get(`${BASE}/api/v1/code/runs`, () => HttpResponse.json({ runs: codeRunsFixture })),
  http.post(`${BASE}/api/v1/code/extract`, async ({ request }) => {
    const body = (await request.json()) as { url: string };
    if (!/^https:\/\/.+\/-\/blob\/.+/.test(body.url)) {
      return HttpResponse.json(
        {
          detail:
            "Cannot parse GitLab URL. Expected: https://gitlab.nomura.com/group/repo/-/blob/branch/path/to/file",
        },
        { status: 400 }
      );
    }
    return HttpResponse.json(extractFixture);
  }),
  http.post(`${BASE}/api/v1/code/ingest`, () => HttpResponse.json(ingestFixture)),
];
```

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/mocks`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/mocks/fixtures/domains.ts src/mocks/fixtures/documents.ts src/mocks/fixtures/codeRuns.ts src/mocks/fixtures/extract.ts src/mocks/fixtures/ingest.ts src/mocks/handlers/simple.ts
git commit -m "feat: add MSW fixtures and handlers for health, domains, documents, and code endpoints"
```

---

### Task 8: MSW compare fixture (with edge cases) and worker bootstrap

**Files:**
- Create: `src/mocks/fixtures/compare.ts`
- Create: `src/mocks/handlers/compare.ts`
- Create: `src/mocks/browser.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `simpleHandlers` (Task 7), `CompareResponse`/`FactVerdict` types (Task 4).
- Produces: `compareHandlers`, and `enableMocking(): Promise<void>` — awaited in `main.tsx` before `ReactDOM.createRoot(...).render(...)` when `VITE_MVC_USE_MOCKS === "true"`.

- [ ] **Step 1: Write the compare fixture with required edge cases**

Create `src/mocks/fixtures/compare.ts`. This is the 37-fact fixture DESIGN.md's Iteration Guide (step 7) calls for, including: a fact with six discrepancies, a fact with `rule_reference: null`, a fact with a 200-line snippet, and a `qualified_name` long enough to force truncation. To keep the file readable, most of the 37 verdicts are generated programmatically and the four edge-case facts are written out explicitly:

```typescript
import type { CompareResponse, FactVerdict, Verdict } from "../../types/domain";

const LONG_SNIPPET = Array.from(
  { length: 200 },
  (_, i) => `    step_${i} = intermediate_${i} * factor_${i}  # line ${i + 1}`
).join("\n");

const sixDiscrepancyFact: FactVerdict = {
  fact_id: "CF-0007",
  qualified_name: "RiskEngine.calculate_rwa",
  fact_type: "formula",
  verdict: "Misaligned",
  confidence: 0.74,
  reasoning:
    "The implementation diverges from the policy on multiple points: the floor, the operator used for the exposure haircut, and two missing conditional branches.",
  discrepancies: [
    {
      type: "missing_constraint",
      description: "Code does not apply the regulatory minimum floor of 0.15.",
      rule_text: "Risk weight floor shall be 15% of gross exposure.",
      code_location: "calculate_rwa: return risk_weight * exposure",
    },
    {
      type: "wrong_operator",
      description: "Uses '>' where policy requires '>=' for the threshold check.",
      rule_text: "Positions at or above the threshold shall be flagged.",
      code_location: "calculate_rwa: if exposure > threshold",
    },
    {
      type: "wrong_value",
      description: "Haircut constant is 0.08 in code but 0.10 in policy.",
      rule_text: "Haircut rate shall be 10% for Tier 2 collateral.",
      code_location: "calculate_rwa: haircut = 0.08",
    },
    {
      type: "missing_logic",
      description: "No handling for negative exposure adjustment.",
      rule_text: "Negative exposures shall be floored to zero before weighting.",
      code_location: "calculate_rwa: risk_weight * exposure",
    },
    {
      type: "wrong_formula",
      description: "Aggregation uses simple sum instead of the weighted sum required.",
      rule_text: "Aggregate exposure shall be a duration-weighted sum.",
      code_location: "calculate_rwa: sum(exposures)",
    },
    {
      type: "unimplemented",
      description: "Stress-scenario multiplier from the policy is not applied anywhere.",
      rule_text: "A 1.25x multiplier shall apply under stress scenarios.",
      code_location: "calculate_rwa: (not present)",
    },
  ],
  rule_reference: {
    document_name: "RTB_Model_Policy_v3.pdf",
    chunk_index: 77,
    similarity_score: 0.91,
    rule_text: "Risk weight floor shall be 15% of gross exposure.",
  },
};

const nullRuleReferenceFact: FactVerdict = {
  fact_id: "CF-0021",
  qualified_name: "MarketDataCache.refresh",
  fact_type: "unclassified",
  verdict: "Unrelated",
  confidence: 0.4,
  reasoning: "No corresponding rule text was found in the document corpus for this fact.",
  discrepancies: [],
  rule_reference: null,
};

const longSnippetFact: FactVerdict = {
  fact_id: "CF-0030",
  qualified_name: "PortfolioRiskEngine.compute_stressed_var",
  fact_type: "formula",
  verdict: "Partial",
  confidence: 0.68,
  reasoning:
    "The core VaR computation matches policy, but several intermediate scaling steps are not traceable to a documented requirement.",
  discrepancies: [
    {
      type: "missing_constraint",
      description: "Intermediate scaling steps 40-60 have no documented basis.",
      rule_text: "All intermediate risk scalars must derive from Section 4.2.",
      code_location: "compute_stressed_var: step_40..step_60",
    },
  ],
  rule_reference: {
    document_name: "RTB_Model_Policy_v3.pdf",
    chunk_index: 102,
    similarity_score: 0.83,
    rule_text: "All intermediate risk scalars must derive from Section 4.2.",
  },
};

const longNameFact: FactVerdict = {
  fact_id: "CF-0035",
  qualified_name:
    "RiskEngine.MarketRisk.ExposureAggregation.compute_duration_weighted_net_exposure_across_all_tenor_buckets",
  fact_type: "aggregation",
  verdict: "Aligned",
  confidence: 0.95,
  reasoning: "Duration-weighted aggregation matches the documented methodology exactly.",
  discrepancies: [],
  rule_reference: {
    document_name: "RTB_Model_Policy_v3.pdf",
    chunk_index: 12,
    similarity_score: 0.97,
    rule_text: "Net exposure shall be aggregated as a duration-weighted sum across all tenor buckets.",
  },
};

function makeFact(index: number, verdict: Verdict): FactVerdict {
  const confidence = Number((0.55 + ((index * 7) % 40) / 100).toFixed(2));
  return {
    fact_id: `CF-${String(index).padStart(4, "0")}`,
    qualified_name: `RiskEngine.metric_${index}`,
    fact_type: index % 3 === 0 ? "condition" : "formula",
    verdict,
    confidence,
    reasoning: `Auto-generated fixture reasoning for metric_${index}.`,
    discrepancies:
      verdict === "Aligned" || verdict === "Unrelated"
        ? []
        : [
            {
              type: "wrong_value",
              description: `metric_${index} constant differs from policy value.`,
              rule_text: `Policy fixture text for metric_${index}.`,
              code_location: `metric_${index}: constant = 0`,
            },
          ],
    rule_reference:
      verdict === "Unrelated"
        ? null
        : {
            document_name: "RTB_Model_Policy_v3.pdf",
            chunk_index: index,
            similarity_score: Number((0.6 + (index % 30) / 100).toFixed(2)),
            rule_text: `Policy fixture text for metric_${index}.`,
          },
  };
}

const generatedFacts: FactVerdict[] = [];
const verdictCycle: Verdict[] = ["Aligned", "Aligned", "Partial", "Misaligned", "Unrelated"];
for (let i = 1; i <= 37; i += 1) {
  if ([7, 21, 30, 35].includes(i)) continue;
  generatedFacts.push(makeFact(i, verdictCycle[i % verdictCycle.length]));
}

const allVerdicts = [
  ...generatedFacts,
  sixDiscrepancyFact,
  nullRuleReferenceFact,
  longSnippetFact,
  longNameFact,
].sort((a, b) => Number(a.fact_id.slice(3)) - Number(b.fact_id.slice(3)));

function summarize(verdicts: FactVerdict[]) {
  return {
    total: verdicts.length,
    aligned: verdicts.filter((v) => v.verdict === "Aligned").length,
    partial: verdicts.filter((v) => v.verdict === "Partial").length,
    misaligned: verdicts.filter((v) => v.verdict === "Misaligned").length,
    unrelated: verdicts.filter((v) => v.verdict === "Unrelated").length,
  };
}

export const compareFixture: CompareResponse = {
  run_id: "20260819_141851_market_risk_engine",
  domain: "rtb",
  compared_at: "2026-08-23T09:45:10.000000+00:00",
  total_facts_in_run: 37,
  facts_compared: allVerdicts.length,
  summary: summarize(allVerdicts),
  verdicts: allVerdicts,
  artifact_path: "C:/data/code/verdicts/20260823_094510_market_risk_engine_verdicts.json",
};

export const longSnippetSource = LONG_SNIPPET;
```

- [ ] **Step 2: Write the compare handler**

Create `src/mocks/handlers/compare.ts`:
```typescript
import { http, HttpResponse } from "msw";
import { compareFixture } from "../fixtures/compare";
import type { CompareRequest } from "../../types/domain";

const BASE = import.meta.env.VITE_MVC_API_BASE_URL as string;

export const compareHandlers = [
  http.post(`${BASE}/api/v1/compare`, async ({ request }) => {
    const body = (await request.json()) as CompareRequest;

    if (body.run_id !== compareFixture.run_id) {
      return HttpResponse.json(
        {
          detail: `No facts artifact found for run_id '${body.run_id}'. Expected: <artifacts>/code/facts/${body.run_id}_facts.json`,
        },
        { status: 404 }
      );
    }

    let verdicts = compareFixture.verdicts;
    if (body.fact_ids?.length) {
      verdicts = verdicts.filter((v) => body.fact_ids!.includes(v.fact_id));
    }
    if (body.key_only) {
      verdicts = verdicts.slice(0, Math.ceil(verdicts.length * 0.25));
    }

    if (verdicts.length === 0) {
      return HttpResponse.json(
        { detail: "No facts matched the given filters. Check run_id, fact_ids, and key_only." },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      ...compareFixture,
      domain: body.domain,
      facts_compared: verdicts.length,
      verdicts,
      summary: {
        total: verdicts.length,
        aligned: verdicts.filter((v) => v.verdict === "Aligned").length,
        partial: verdicts.filter((v) => v.verdict === "Partial").length,
        misaligned: verdicts.filter((v) => v.verdict === "Misaligned").length,
        unrelated: verdicts.filter((v) => v.verdict === "Unrelated").length,
      },
    });
  }),
];
```

- [ ] **Step 3: Write the worker bootstrap**

Create `src/mocks/browser.ts`:
```typescript
import { setupWorker } from "msw/browser";
import { simpleHandlers } from "./handlers/simple";
import { compareHandlers } from "./handlers/compare";

export const worker = setupWorker(...simpleHandlers, ...compareHandlers);

export async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_MVC_USE_MOCKS !== "true") return;
  await worker.start({ onUnhandledRequest: "bypass" });
}
```

- [ ] **Step 4: Wire into the app entry point**

Modify `src/main.tsx` so mocking starts before render:
```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { enableMocking } from "./mocks/browser";

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
```

- [ ] **Step 5: Verify mocking is live**

Run: `npm run dev`, open the dev server URL, open browser DevTools → Network tab, and (once Task 9's app shell exists enough to trigger a call) confirm requests to `/api/v1/*` show `(from ServiceWorker)`. For now, verify via the console: run `fetch(import.meta.env.VITE_MVC_API_BASE_URL + '/api/v1/health').then(r => r.json()).then(console.log)` in the browser console — Expected: logs `{status: "ok"}` with no network error, confirming the worker intercepted it.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/mocks src/main.tsx`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/mocks/fixtures/compare.ts src/mocks/handlers/compare.ts src/mocks/browser.ts src/main.tsx
git commit -m "feat: add compare fixture with edge cases and MSW worker bootstrap"
```

---

### Task 9: Data-fetching hooks

**Files:**
- Create: `src/hooks/useAsync.ts`
- Create: `src/hooks/useDomains.ts`, `useRuns.ts`, `useDocuments.ts`, `useHealth.ts`, `useUpload.ts`, `useExtractPreview.ts`, `useIngest.ts`, `useCompare.ts`, `useAsk.ts`

**Interfaces:**
- Consumes: `src/api/*.ts` functions (Task 6), `ApiClientError` (Task 5), domain types (Task 4).
- Produces: `useAsync<T, A>(fn)` returning `{ status: "idle"|"loading"|"success"|"error", data: T | null, error: NormalizedApiError | null, run: (...args: A) => Promise<T> }`. Every resource hook below returns this shape (auto-run hooks additionally start `run()` on mount). These are the only functions screens (Tasks 22+) use to talk to the API.

- [ ] **Step 1: Generic async hook**

Create `src/hooks/useAsync.ts`:
```typescript
import { useCallback, useReducer } from "react";
import { ApiClientError } from "../api/client";
import { normalizeApiError, type NormalizedApiError } from "../api/errors";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data: T | null;
  error: NormalizedApiError | null;
}

type Action<T> =
  | { type: "start" }
  | { type: "success"; data: T }
  | { type: "error"; error: NormalizedApiError };

function reducer<T>(state: AsyncState<T>, action: Action<T>): AsyncState<T> {
  switch (action.type) {
    case "start":
      return { status: "loading", data: state.data, error: null };
    case "success":
      return { status: "success", data: action.data, error: null };
    case "error":
      return { status: "error", data: state.data, error: action.error };
  }
}

export function useAsync<T, A extends unknown[]>(fn: (...args: A) => Promise<T>) {
  const [state, dispatch] = useReducer(reducer<T>, {
    status: "idle",
    data: null,
    error: null,
  });

  const run = useCallback(
    async (...args: A) => {
      dispatch({ type: "start" });
      try {
        const data = await fn(...args);
        dispatch({ type: "success", data });
        return data;
      } catch (err) {
        const normalized =
          err instanceof ApiClientError
            ? { status: err.status, message: err.message, detail: err.detail }
            : normalizeApiError(err);
        dispatch({ type: "error", error: normalized });
        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { ...state, run };
}
```

- [ ] **Step 2: Auto-loading hooks (fire on mount)**

Create `src/hooks/useDomains.ts`:
```typescript
import { useEffect } from "react";
import { useAsync } from "./useAsync";
import { getDomains } from "../api/health";

export function useDomains() {
  const async_ = useAsync(getDomains);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return async_;
}
```

`useAsync` returns a new `{...state, run}` object on every render (Step 1), so a `refresh` callback depending on that whole object (`[async_]`) would never actually memoize — `async_.run` itself is the one field on it guaranteed stable across renders (it's built with an empty-deps `useCallback` in Step 1), so `refresh` must depend on `[async_.run]`, not `[async_]`.

Create `src/hooks/useRuns.ts`:
```typescript
import { useCallback, useEffect } from "react";
import { useAsync } from "./useAsync";
import { listCodeRuns } from "../api/code";

export function useRuns() {
  const async_ = useAsync(listCodeRuns);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const refresh = useCallback(() => async_.run(), [async_.run]);
  return { ...async_, refresh };
}
```

Create `src/hooks/useDocuments.ts`:
```typescript
import { useCallback, useEffect } from "react";
import { useAsync } from "./useAsync";
import { listDocuments } from "../api/documents";

export function useDocuments() {
  const async_ = useAsync(listDocuments);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const refresh = useCallback(() => async_.run(), [async_.run]);
  return { ...async_, refresh };
}
```

Create `src/hooks/useHealth.ts`:
```typescript
import { useEffect } from "react";
import { useAsync } from "./useAsync";
import { getHealth } from "../api/health";

export function useHealth() {
  const async_ = useAsync(getHealth);
  useEffect(() => {
    async_.run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return async_;
}
```

- [ ] **Step 3: Manually-triggered hooks (screens call `.run(...)` explicitly)**

Create `src/hooks/useUpload.ts`:
```typescript
import { useAsync } from "./useAsync";
import { uploadDocument } from "../api/documents";

export function useUpload() {
  return useAsync((file: File, domain: string) => uploadDocument(file, domain));
}
```

Create `src/hooks/useExtractPreview.ts`:
```typescript
import { useAsync } from "./useAsync";
import { extractCode } from "../api/code";
import type { ExtractRequest } from "../types/domain";

export function useExtractPreview() {
  return useAsync((payload: ExtractRequest) => extractCode(payload));
}
```

Create `src/hooks/useIngest.ts`:
```typescript
import { useAsync } from "./useAsync";
import { ingestCode } from "../api/code";
import type { ExtractRequest } from "../types/domain";

export function useIngest() {
  return useAsync((payload: ExtractRequest) => ingestCode(payload));
}
```

Create `src/hooks/useCompare.ts`:
```typescript
import { useAsync } from "./useAsync";
import { runCompare } from "../api/compare";
import type { CompareRequest } from "../types/domain";

export function useCompare() {
  return useAsync((payload: CompareRequest) => runCompare(payload));
}
```

Create `src/hooks/useAsk.ts`:
```typescript
import { useAsync } from "./useAsync";
import { queryDocuments } from "../api/documents";
import type { AskRequest } from "../types/domain";

export function useAsk() {
  return useAsync((payload: AskRequest) => queryDocuments(payload));
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/hooks`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/hooks
git commit -m "feat: add per-resource data-fetching hooks"
```

---

### Task 10: Theme, Run, and Toast contexts

**Files:**
- Create: `src/context/ThemeContext.tsx`, `src/context/RunContext.tsx`, `src/context/ToastContext.tsx`

**Interfaces:**
- Consumes: nothing beyond React and `localStorage`.
- Produces: `ThemeProvider`, `useTheme(): { mode: "light"|"dark"|"system", resolved: "light"|"dark", setMode: (m) => void }`; `RunProvider`, `useRun(): { activeRun: {runId: string, domain: string} | null, setActiveRun }`; `ToastProvider`, `useToast(): { toasts: ToastItem[], showToast: (t: Omit<ToastItem,"id">) => void, dismissToast: (id: string) => void }` and the `ToastItem` type (`{ id, kind: "success"|"error", message, detail?: unknown }`) consumed by Task 14's `Toast` component and by every hook-driven screen for error reporting.

- [ ] **Step 1: Theme context**

Create `src/context/ThemeContext.tsx`:
```typescript
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("mvc.theme");
    return stored === "light" || stored === "dark" ? stored : "system";
  });
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(mode));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
  }, [resolved]);

  useEffect(() => {
    setResolved(resolveTheme(mode));
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(resolveTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    localStorage.setItem("mvc.theme", next);
  }, []);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

- [ ] **Step 2: Run context**

Create `src/context/RunContext.tsx`:
```typescript
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface ActiveRun {
  runId: string;
  domain: string;
}

interface RunContextValue {
  activeRun: ActiveRun | null;
  setActiveRun: (run: ActiveRun | null) => void;
}

const RunContext = createContext<RunContextValue | null>(null);

export function RunProvider({ children }: { children: ReactNode }) {
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const value = useMemo(() => ({ activeRun, setActiveRun }), [activeRun]);
  return <RunContext.Provider value={value}>{children}</RunContext.Provider>;
}

export function useRun(): RunContextValue {
  const ctx = useContext(RunContext);
  if (!ctx) throw new Error("useRun must be used within RunProvider");
  return ctx;
}
```

- [ ] **Step 3: Toast context**

Create `src/context/ToastContext.tsx`:
```typescript
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export interface ToastItem {
  id: string;
  kind: "success" | "error";
  message: string;
  detail?: unknown;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { ...toast, id }]);
      if (toast.kind === "success") {
        setTimeout(() => dismissToast(id), 6000);
      }
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/context`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/context
git commit -m "feat: add theme, run, and toast contexts"
```

---

### Task 11: Button primitives (`button-primary`, `-outline`, `-quiet`, `-icon`, `-danger`)

**Files:**
- Create: `src/components/primitives/Button.tsx`

**Interfaces:**
- Consumes: Tailwind token classes (Task 3).
- Produces: `Button` component with `variant: "primary" | "outline" | "quiet" | "danger"`, and `IconButton` component — both imported by every later primitive, signature, and screen task that needs an action.

- [ ] **Step 1: Write the button component**

Create `src/components/primitives/Button.tsx`:
```typescript
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "quiet" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center h-9 px-4 rounded-md text-label-md font-sans transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink text-on-fill hover:bg-body active:brightness-90 disabled:bg-surface-sunken disabled:text-faint",
  outline:
    "bg-transparent text-ink border border-hairline-strong hover:bg-surface disabled:text-faint disabled:border-hairline",
  quiet: "bg-transparent text-mute hover:bg-surface disabled:text-faint",
  danger:
    "bg-transparent text-verdict-misaligned border border-verdict-misaligned hover:bg-verdict-misaligned-tint disabled:text-faint disabled:border-hairline",
};

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? loadingLabel ?? "Working…" : children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  children: ReactNode;
}

export function IconButton({ className = "", children, ...rest }: IconButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-mute hover:bg-surface transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Add the `duration-fast`/`duration-base`/`duration-slow` motion utilities used above**

Modify `tailwind.config.js` — add to `theme.extend`:
```js
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "260ms",
      },
```
(Insert this block alongside `fontSize` inside `theme.extend` from Task 3.)

- [ ] **Step 3: Verify with a throwaway render**

Temporarily render `<Button>Compare</Button>` and `<IconButton aria-label="Close">×</IconButton>` inside `src/App.tsx`, run `npm run dev`, confirm both render with correct colors/height in the browser, then revert `App.tsx` (App.tsx's real content is built in Task 15).

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/primitives`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/primitives/Button.tsx tailwind.config.js
git commit -m "feat: add button primitives (primary, outline, quiet, danger, icon)"
```

---

### Task 12: Input primitives — select, text/url input, segmented control, toggle

**Files:**
- Create: `src/components/primitives/SelectField.tsx`, `src/components/primitives/TextInput.tsx`, `src/components/primitives/SegmentedControl.tsx`, `src/components/primitives/Toggle.tsx`

**Interfaces:**
- Consumes: Tailwind token classes.
- Produces: `SelectField<T>` (generic option list with a rich-option render slot), `TextInput`/`UrlInput` (via a shared `mono` prop), `SegmentedControl<T>`, `Toggle` — consumed by the Compare and Sources screen tasks.

- [ ] **Step 1: Select field**

Create `src/components/primitives/SelectField.tsx`:
```typescript
import type { ReactNode } from "react";

export interface SelectOption<T extends string> {
  value: T;
  label: ReactNode;
  secondary?: ReactNode;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  id: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
  id,
}: SelectFieldProps<T>) {
  return (
    <div className="flex flex-col gap-xxs">
      <label htmlFor={id} className="text-label-md text-mute">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 px-md rounded-md border border-hairline-strong bg-canvas text-ink text-body-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {typeof opt.label === "string" ? opt.label : opt.value}
          </option>
        ))}
      </select>
    </div>
  );
}
```

Note: the native `<select>` cannot render rich multi-line options (secondary metadata lines). The run selector in the Compare screen (Task 22) uses a separate `RunSelectPopover` composed from `SelectOption.secondary`, built in that task, rather than extending this primitive — the native element stays for simple domain/profile pickers where DESIGN.md does not require rich rows.

- [ ] **Step 2: Text and URL inputs**

Create `src/components/primitives/TextInput.tsx`:
```typescript
import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  mono?: boolean;
  error?: string;
}

export function TextInput({ label, id, mono = false, error, className = "", ...rest }: TextInputProps) {
  return (
    <div className="flex flex-col gap-xxs">
      <label htmlFor={id} className="text-label-md text-mute">
        {label}
      </label>
      <input
        id={id}
        className={`h-9 px-md rounded-md border bg-canvas text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          mono ? "font-mono font-mono-noliga text-mono-code-sm" : "text-body-md"
        } ${error ? "border-verdict-misaligned" : "border-hairline-strong"} ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {error && <p className="text-body-sm text-verdict-misaligned">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 3: Segmented control**

Create `src/components/primitives/SegmentedControl.tsx`:
```typescript
interface Segment<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  "aria-label": string;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  ...rest
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      className="inline-flex h-9 rounded-md bg-surface-sunken p-xxs gap-xxs"
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(seg.value)}
            className={`px-md rounded-sm text-label-md transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? "bg-surface-raised border border-hairline text-ink font-medium"
                : "text-mute"
            }`}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Toggle**

Create `src/components/primitives/Toggle.tsx`:
```typescript
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id: string;
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-sm cursor-pointer">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          checked ? "bg-accent" : "bg-hairline-strong"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-canvas transition-transform duration-fast ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-label-md text-ink">{label}</span>
    </label>
  );
}
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/primitives`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/primitives/SelectField.tsx src/components/primitives/TextInput.tsx src/components/primitives/SegmentedControl.tsx src/components/primitives/Toggle.tsx
git commit -m "feat: add select, text input, segmented control, and toggle primitives"
```

---

### Task 13: Chip, badge, and confidence-meter primitives

**Files:**
- Create: `src/components/primitives/VerdictChip.tsx`, `src/components/primitives/ContextChip.tsx`, `src/components/primitives/StatusChip.tsx`, `src/components/primitives/MetaBadge.tsx`, `src/components/primitives/ConfidenceMeter.tsx`

**Interfaces:**
- Consumes: `Verdict`, `IngestionStatus` types (Task 4).
- Produces: `VerdictChip`, `verdictGlyph(verdict): string`, `verdictColorClass(verdict): { fill, tint }` (a shared color-lookup helper other signature components reuse — `TriageRow`, `VerdictSpine`, `CompareLedger`, `DiscrepancyItem`, `CodeBlock` all import `verdictColorClass` instead of re-deriving verdict → class mappings), `ContextChip`, `StatusChip`, `MetaBadge`, `ConfidenceMeter`.

- [ ] **Step 1: Shared verdict → color/glyph helper**

Create `src/components/primitives/verdict.ts`:
```typescript
import type { Verdict } from "../../types/domain";

export const VERDICT_GLYPH: Record<Verdict, string> = {
  Aligned: "=",
  Partial: "≈",
  Misaligned: "≠",
  Unrelated: "·",
};

export const VERDICT_ORDER: Verdict[] = ["Misaligned", "Partial", "Unrelated", "Aligned"];

interface VerdictClassSet {
  text: string;
  tint: string;
  bar: string;
}

const VERDICT_CLASSES: Record<Verdict, VerdictClassSet> = {
  Aligned: { text: "text-verdict-aligned", tint: "bg-verdict-aligned-tint", bar: "bg-verdict-aligned" },
  Partial: { text: "text-verdict-partial", tint: "bg-verdict-partial-tint", bar: "bg-verdict-partial" },
  Misaligned: {
    text: "text-verdict-misaligned",
    tint: "bg-verdict-misaligned-tint",
    bar: "bg-verdict-misaligned",
  },
  Unrelated: {
    text: "text-verdict-unrelated",
    tint: "bg-verdict-unrelated-tint",
    bar: "bg-verdict-unrelated",
  },
};

export function verdictColorClass(verdict: Verdict): VerdictClassSet {
  return VERDICT_CLASSES[verdict];
}
```

This replaces the original `` `bg-verdict-${key}-tint` ``-style string interpolation, which has a real bug: Tailwind's build-time content scanner only generates CSS for class names that appear as complete literal strings somewhere in the source. `bg-verdict-unrelated-tint` never appears as a literal string anywhere else in the codebase (unlike the other three verdicts' tints, which happen to also appear literally in `StatusChip.tsx`), so it was silently dropped from the production build — the "Unrelated" verdict's tint background rendered as nothing everywhere `verdictColorClass` is used (`StatCard`, `TriageRow`, `VerdictChip`, `VerdictSpine`, `CodeBlock`'s evidence highlight, `DiscrepancyItem`). The static `VERDICT_CLASSES` record above is the same fix pattern already used correctly elsewhere in this plan (`ACTIVE_BORDER` in Task 16, `EVIDENCE_BORDER` in Task 17) — every class name Tailwind must generate now appears as a complete literal string in the source.

- [ ] **Step 2: Verdict chip**

Create `src/components/primitives/VerdictChip.tsx`:
```typescript
import type { Verdict } from "../../types/domain";
import { VERDICT_GLYPH, verdictColorClass } from "./verdict";

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const { text, tint } = verdictColorClass(verdict);
  return (
    <span
      className={`inline-flex items-center gap-xxs h-5 px-sm rounded-sm text-mono-eyebrow uppercase font-mono font-mono-noliga tracking-wide ${text} ${tint}`}
    >
      <span aria-hidden="true">{VERDICT_GLYPH[verdict]}</span>
      {verdict}
    </span>
  );
}
```

- [ ] **Step 3: Context chip**

Create `src/components/primitives/ContextChip.tsx`:
```typescript
export function ContextChip({ runId, domain }: { runId: string; domain: string }) {
  return (
    <span className="inline-flex items-center gap-sm h-6 px-sm rounded-sm bg-surface border border-hairline">
      <span className="font-mono font-mono-noliga text-mono-id text-ink">{runId}</span>
      <span className="text-label-sm text-mute">{domain}</span>
    </span>
  );
}
```

- [ ] **Step 4: Status chip**

Create `src/components/primitives/StatusChip.tsx`:
```typescript
import type { IngestionStatus } from "../../types/domain";

const STATUS_MAP: Record<IngestionStatus, { text: string; tint: string; label: string }> = {
  ingested: { text: "text-verdict-aligned", tint: "bg-verdict-aligned-tint", label: "INGESTED" },
  pending: { text: "text-verdict-partial", tint: "bg-verdict-partial-tint", label: "PENDING" },
  failed: { text: "text-verdict-misaligned", tint: "bg-verdict-misaligned-tint", label: "FAILED" },
};

export function StatusChip({ status }: { status: IngestionStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      className={`inline-flex items-center h-5 px-sm rounded-sm text-mono-eyebrow uppercase font-mono font-mono-noliga tracking-wide ${s.text} ${s.tint}`}
    >
      {s.label}
    </span>
  );
}
```

- [ ] **Step 5: Meta badge**

Create `src/components/primitives/MetaBadge.tsx`:
```typescript
interface MetaBadgeProps {
  label: string;
  tooltip?: string;
}

export function MetaBadge({ label, tooltip }: MetaBadgeProps) {
  return (
    <span
      title={tooltip}
      className="inline-flex items-center h-5 px-xs rounded-sm bg-surface-sunken text-mute text-mono-eyebrow uppercase font-mono font-mono-noliga tracking-wide"
    >
      {label}
    </span>
  );
}
```

- [ ] **Step 6: Confidence meter**

Create `src/components/primitives/ConfidenceMeter.tsx`:
```typescript
import type { Verdict } from "../../types/domain";
import { verdictColorClass } from "./verdict";

export function ConfidenceMeter({ confidence, verdict }: { confidence: number; verdict: Verdict }) {
  const { bar } = verdictColorClass(verdict);
  const pct = Math.round(confidence * 100);
  return (
    <div className="inline-flex items-center gap-sm" aria-label={`Confidence ${confidence.toFixed(2)}`}>
      <div className="w-12 h-[3px] rounded-full bg-hairline overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono font-mono-noliga text-mono-id tabular-nums text-stone">
        {confidence.toFixed(2)}
      </span>
    </div>
  );
}
```

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/primitives`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/primitives/verdict.ts src/components/primitives/VerdictChip.tsx src/components/primitives/ContextChip.tsx src/components/primitives/StatusChip.tsx src/components/primitives/MetaBadge.tsx src/components/primitives/ConfidenceMeter.tsx
git commit -m "feat: add verdict chip, context/status chips, meta badge, and confidence meter primitives"
```

---

### Task 14: JsonViewer, Toast, HealthDot, Skeleton, EmptyState

**Files:**
- Create: `src/components/signature/JsonViewer.tsx`, `src/components/signature/HealthDot.tsx`, `src/components/signature/Skeleton.tsx`, `src/components/signature/EmptyState.tsx`, `src/layout/Toast.tsx`
- Modify: `tailwind.config.js`, `src/index.css`

**Interfaces:**
- Consumes: `useToast`/`ToastItem` (Task 10), `useHealth` (Task 9), `Button` (Task 11).
- Produces: `JsonViewer` (used again by Sources' extract-preview in Task 24), `HealthDot`, `Skeleton`, `EmptyState`, and a `ToastViewport` component rendered once in `AppLayout` (Task 15).

- [ ] **Step 1: Global reduced-motion rule**

Modify `src/index.css`, append after the `@layer base` block from Task 3:
```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
This single rule satisfies DESIGN.md's "respect `prefers-reduced-motion`" requirement for the skeleton pulse, the progress bar, and all transitions at once, rather than a per-component check.

- [ ] **Step 2: Skeleton pulse animation**

Modify `tailwind.config.js`, add to `theme.extend` (alongside `transitionDuration` from Task 11):
```js
      keyframes: {
        "skeleton-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
      },
      animation: {
        "skeleton-pulse": "skeleton-pulse 1.4s ease-in-out infinite",
      },
```

Create `src/components/signature/Skeleton.tsx`:
```typescript
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-surface-sunken rounded-md animate-skeleton-pulse ${className}`} />;
}
```

- [ ] **Step 3: JsonViewer**

Create `src/components/signature/JsonViewer.tsx`:
```typescript
import { useState } from "react";

function JsonNode({ value, path, depth }: { value: unknown; path: string; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) return <span className="text-code-number">null</span>;
  if (typeof value === "string") return <span className="text-code-string">"{value}"</span>;
  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-code-number">{String(value)}</span>;
  }

  const isArray = Array.isArray(value);
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  if (entries.length === 0) return <span className="text-code-punct">{isArray ? "[]" : "{}"}</span>;

  return (
    <span>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="text-code-punct font-mono font-mono-noliga hover:text-ink"
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse ${path}` : `Expand ${path}`}
      >
        {expanded ? "▾" : "▸"} {isArray ? "[" : "{"}
      </button>
      {expanded && (
        <div className="pl-md border-l border-hairline ml-xxs">
          {entries.map(([key, val]) => (
            <div key={key}>
              {!isArray && <span className="text-code-keyword">"{key}"</span>}
              {!isArray && <span className="text-code-punct">: </span>}
              <JsonNode value={val} path={`${path}.${key}`} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
      <span className="text-code-punct font-mono font-mono-noliga">{isArray ? "]" : "}"}</span>
    </span>
  );
}

export function JsonViewer({ data }: { data: unknown }) {
  return (
    <pre className="bg-code-bg rounded-lg p-md text-mono-code-sm font-mono font-mono-noliga overflow-auto whitespace-pre-wrap">
      <JsonNode value={data} path="root" depth={0} />
    </pre>
  );
}
```

- [ ] **Step 4: HealthDot**

Create `src/components/signature/HealthDot.tsx`:
```typescript
import { useHealth } from "../../hooks/useHealth";

export function HealthDot() {
  const { status, data } = useHealth();
  const colorClass =
    status === "success" && data?.status === "ok"
      ? "bg-verdict-aligned"
      : status === "error"
        ? "bg-verdict-misaligned"
        : "bg-faint";
  const label =
    status === "success" && data?.status === "ok"
      ? "Backend reachable"
      : status === "error"
        ? "Backend unreachable"
        : "Checking backend…";
  return (
    <span
      role="status"
      title={`${label} — ${import.meta.env.VITE_MVC_API_BASE_URL}`}
      className={`inline-block h-2 w-2 rounded-full ${colorClass}`}
    />
  );
}
```

- [ ] **Step 5: EmptyState**

Create `src/components/signature/EmptyState.tsx`:
```typescript
import { Button } from "../primitives/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-sm max-w-[380px] mx-auto py-xxl">
      <h3 className="text-title-sm font-medium text-ink">{title}</h3>
      <p className="text-body-sm text-mute">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className="mt-sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Toast viewport**

Create `src/layout/Toast.tsx`:
```typescript
import { useState } from "react";
import { useToast, type ToastItem } from "../context/ToastContext";
import { JsonViewer } from "../components/signature/JsonViewer";
import { IconButton } from "../components/primitives/Button";

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [showDetails, setShowDetails] = useState(false);
  const barClass = toast.kind === "success" ? "bg-verdict-aligned" : "bg-verdict-misaligned";
  return (
    <div className="relative bg-surface-raised border border-hairline rounded-lg shadow-pop max-w-[380px] overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${barClass}`} />
      <div className="pl-lg pr-md py-md flex items-start gap-sm">
        <p className="flex-1 text-body-md text-ink">{toast.message}</p>
        <IconButton aria-label="Dismiss notification" onClick={onDismiss}>
          ×
        </IconButton>
      </div>
      {toast.kind === "error" && toast.detail !== undefined && (
        <div className="px-lg pb-md">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="text-label-sm text-accent hover:underline"
          >
            {showDetails ? "Hide details" : "Details"}
          </button>
          {showDetails && (
            <div className="mt-sm">
              <JsonViewer data={toast.detail} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className="fixed bottom-lg right-lg flex flex-col gap-sm z-50" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/signature src/layout`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/index.css tailwind.config.js src/components/signature/JsonViewer.tsx src/components/signature/HealthDot.tsx src/components/signature/Skeleton.tsx src/components/signature/EmptyState.tsx src/layout/Toast.tsx
git commit -m "feat: add JsonViewer, HealthDot, Skeleton, EmptyState, and toast viewport"
```

---

### Task 15: App shell — TopBar, NavRail, AppLayout, and routing

**Files:**
- Create: `src/layout/TopBar.tsx`, `src/layout/NavRail.tsx`, `src/layout/AppLayout.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `ThemeProvider`/`useTheme` (Task 10), `RunProvider`/`useRun` (Task 10), `ToastProvider` + `ToastViewport` (Tasks 10/14), `HealthDot` (Task 14), `IconButton` (Task 11), `ContextChip` (Task 13).
- Produces: the routed app shell every screen task (19+) plugs a screen component into, at routes `/`, `/sources`, `/ask`, `/history`, `/settings`.

- [ ] **Step 1: NavRail**

Create `src/layout/NavRail.tsx`:
```typescript
import { NavLink } from "react-router";

const ITEMS = [
  { to: "/", label: "Compare", icon: "⇄" },
  { to: "/sources", label: "Sources", icon: "▤" },
  { to: "/ask", label: "Ask", icon: "?" },
  { to: "/history", label: "History", icon: "↺" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function NavRail() {
  return (
    <nav className="w-[72px] shrink-0 bg-surface border-r border-hairline-strong flex flex-col py-md">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `h-14 flex flex-col items-center justify-center gap-xxs border-l-2 ${
              isActive ? "border-accent text-ink" : "border-transparent text-mute"
            } hover:text-ink`
          }
        >
          <span aria-hidden="true" className="text-lg leading-none">
            {item.icon}
          </span>
          <span className="text-label-sm">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: TopBar**

Create `src/layout/TopBar.tsx`:
```typescript
import { HealthDot } from "../components/signature/HealthDot";
import { ContextChip } from "../components/primitives/ContextChip";
import { IconButton } from "../components/primitives/Button";
import { useRun } from "../context/RunContext";
import { useTheme } from "../context/ThemeContext";

const CYCLE: Record<string, "light" | "dark" | "system"> = {
  system: "light",
  light: "dark",
  dark: "system",
};

export function TopBar() {
  const { activeRun } = useRun();
  const { mode, setMode } = useTheme();

  return (
    <header className="h-[52px] shrink-0 bg-canvas border-b border-hairline flex items-center px-lg sticky top-0 z-40">
      <div className="text-title-sm">
        <span className="font-mono font-mono-noliga font-medium">MVC</span>{" "}
        <span className="font-sans">Compare</span>
      </div>
      <div className="flex-1 flex justify-center">
        {activeRun && <ContextChip runId={activeRun.runId} domain={activeRun.domain} />}
      </div>
      <div className="flex items-center gap-md">
        <HealthDot />
        <IconButton aria-label={`Theme: ${mode}. Click to change.`} onClick={() => setMode(CYCLE[mode])}>
          {mode === "dark" ? "☾" : mode === "light" ? "☀" : "◐"}
        </IconButton>
        <IconButton aria-label="Keyboard shortcuts">?</IconButton>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: AppLayout**

Create `src/layout/AppLayout.tsx`:
```typescript
import { Outlet } from "react-router";
import { TopBar } from "./TopBar";
import { NavRail } from "./NavRail";
import { ToastViewport } from "./Toast";

export function AppLayout() {
  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <NavRail />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ToastViewport />
    </div>
  );
}
```

- [ ] **Step 4: Wire routing and providers into App.tsx**

Replace `src/App.tsx` (stub screens are placeholders that Tasks 22–28 replace one at a time — each is a real component, not a TODO comment, satisfying the "no placeholders" rule as a genuine, if minimal, initial screen):
```typescript
import { BrowserRouter, Routes, Route } from "react-router";
import { ThemeProvider } from "./context/ThemeContext";
import { RunProvider } from "./context/RunContext";
import { ToastProvider } from "./context/ToastContext";
import { AppLayout } from "./layout/AppLayout";
import { EmptyState } from "./components/signature/EmptyState";

function StubScreen({ name }: { name: string }) {
  return (
    <div className="p-xl">
      <EmptyState title={`${name} screen`} description={`${name} is built in a later task.`} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RunProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<StubScreen name="Compare" />} />
                <Route path="sources" element={<StubScreen name="Sources" />} />
                <Route path="ask" element={<StubScreen name="Ask" />} />
                <Route path="history" element={<StubScreen name="History" />} />
                <Route path="settings" element={<StubScreen name="Settings" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </RunProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 5: Verify the shell renders and routes**

Run: `npm run dev`, open the app. Expected: TopBar with "MVC Compare" wordmark, health dot (grey then green once the mocked `/api/v1/health` resolves), theme toggle icon that cycles system→light→dark→system on click (canvas background flips accordingly), and a 72px nav rail with 5 items. Click each nav item and confirm the URL and the stub screen title change, and the active item shows the blue left edge.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/layout src/App.tsx`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/layout/TopBar.tsx src/layout/NavRail.tsx src/layout/AppLayout.tsx src/App.tsx
git commit -m "feat: add app shell with routing, top bar, and nav rail"
```

---

### Task 16: StatCard

**Files:**
- Create: `src/components/signature/StatCard.tsx`

**Interfaces:**
- Consumes: `verdictColorClass` (Task 13), `Verdict` type.
- Produces: `StatCard`, `StatKey = Verdict | "total"` — consumed by the Compare screen's summary strip (Task 22).

- [ ] **Step 1: Write the component**

Create `src/components/signature/StatCard.tsx`:
```typescript
import type { Verdict } from "../../types/domain";
import { verdictColorClass } from "../primitives/verdict";

export type StatKey = Verdict | "total";

interface StatCardProps {
  statKey: StatKey;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function colorFor(statKey: StatKey) {
  if (statKey === "total") {
    return { text: "text-ink", tint: "bg-surface-sunken", bar: "bg-ink" };
  }
  return verdictColorClass(statKey);
}

export function StatCard({ statKey, label, count, active, onClick }: StatCardProps) {
  const { text, tint, bar } = colorFor(statKey);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-1 h-[88px] flex flex-col justify-center gap-xxs px-lg rounded-lg border border-hairline text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? `${tint} border-b-2 border-b-${bar.replace("bg-", "")}` : "bg-surface-raised"
      }`}
    >
      <span className={`text-stat-xl font-mono font-mono-noliga tabular-nums ${text}`}>{count}</span>
      <span className="text-mono-eyebrow uppercase tracking-wide text-stone font-mono font-mono-noliga">
        {label}
      </span>
    </button>
  );
}
```

Note on the active bottom-border: Tailwind cannot interpolate a dynamic class like `border-b-${bar.replace(...)}` at build time (its JIT scanner needs static class strings). Replace that line with an explicit switch so every class Tailwind must generate is statically present in source:
```typescript
const ACTIVE_BORDER: Record<StatKey, string> = {
  total: "border-b-ink",
  Aligned: "border-b-verdict-aligned",
  Partial: "border-b-verdict-partial",
  Misaligned: "border-b-verdict-misaligned",
  Unrelated: "border-b-verdict-unrelated",
};
```
and use `active ? \`${tint} border-b-2 ${ACTIVE_BORDER[statKey]}\` : "bg-surface-raised"` in the className. Use this corrected version as the actual file content (the `colorFor`/interpolated version above is superseded by this fix).

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/signature/StatCard.tsx`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/signature/StatCard.tsx
git commit -m "feat: add stat-card summary component"
```

---

### Task 17: CodeBlock and InlineCode

**Files:**
- Create: `src/components/signature/tokenize.ts`, `src/components/signature/CodeBlock.tsx`, `src/components/signature/InlineCode.tsx`

**Interfaces:**
- Consumes: `IconButton` (Task 11), `verdictColorClass` (Task 13).
- Produces: `CodeBlock` (props: `code: string`, `startLine: number`, `qualifiedName: string`, `language: string`, `evidenceLines?: [number, number]`, `evidenceVerdict?: Verdict`), `InlineCode` — both consumed by `CompareLedger` (Task 19) and the discrepancy stack (Task 18).

- [ ] **Step 1: A small regex-based tokenizer**

Full language parsing is out of scope; a regex tokenizer covering DESIGN.md's syntax roles (comment, string, number, keyword, operator, punctuation, plain) is sufficient for read-only evidence display.

Create `src/components/signature/tokenize.ts`:
```typescript
const KEYWORDS = new Set([
  "def", "return", "if", "elif", "else", "for", "while", "import", "from",
  "class", "in", "not", "and", "or", "is", "None", "True", "False", "pass",
  "raise", "try", "except", "finally", "with", "as", "lambda", "yield",
  "function", "const", "let", "var", "new", "this", "export", "default",
  "async", "await", "interface", "type", "extends", "implements",
]);

const TOKEN_RE =
  /(#.*$|\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|([+\-*/%=<>!&|^~]+)|([.,:;()[\]{}])|(\s+)/gm;

export interface Token {
  text: string;
  className: string;
}

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, match.index), className: "text-code-plain" });
    }
    const [full, comment, str, num, word, op, punct, ws] = match;
    if (comment) tokens.push({ text: comment, className: "text-code-comment" });
    else if (str) tokens.push({ text: str, className: "text-code-string" });
    else if (num) tokens.push({ text: num, className: "text-code-number" });
    else if (word) {
      const followedByParen = line[match.index + full.length] === "(";
      const className = KEYWORDS.has(word)
        ? "text-code-keyword"
        : followedByParen
          ? "text-code-function font-medium"
          : "text-code-plain";
      tokens.push({ text: word, className });
    } else if (op) tokens.push({ text: op, className: "text-code-operator" });
    else if (punct) tokens.push({ text: punct, className: "text-code-punct" });
    else if (ws) tokens.push({ text: ws, className: "" });
    else tokens.push({ text: full, className: "text-code-plain" });
    lastIndex = match.index + full.length;
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), className: "text-code-plain" });
  }
  return tokens;
}
```

- [ ] **Step 2: CodeBlock**

Create `src/components/signature/CodeBlock.tsx`:
```typescript
import { useState } from "react";
import { tokenizeLine } from "./tokenize";
import { IconButton } from "../primitives/Button";
import type { Verdict } from "../../types/domain";
import { verdictColorClass } from "../primitives/verdict";

interface CodeBlockProps {
  code: string;
  startLine: number;
  qualifiedName: string;
  language: string;
  evidenceLines?: [number, number];
  evidenceVerdict?: Verdict;
}

const COLLAPSE_AT = 24;

const EVIDENCE_BORDER: Record<Verdict, string> = {
  Aligned: "border-l-verdict-aligned",
  Partial: "border-l-verdict-partial",
  Misaligned: "border-l-verdict-misaligned",
  Unrelated: "border-l-verdict-unrelated",
};

export function CodeBlock({
  code,
  startLine,
  qualifiedName,
  language,
  evidenceLines,
  evidenceVerdict,
}: CodeBlockProps) {
  const [wrap, setWrap] = useState<boolean>(() => localStorage.getItem("mvc.codewrap") === "true");
  const [expanded, setExpanded] = useState(false);
  const lines = code.split("\n");
  const visibleLines = expanded ? lines : lines.slice(0, COLLAPSE_AT);
  const evidenceClass = evidenceVerdict ? verdictColorClass(evidenceVerdict) : null;

  function toggleWrap() {
    setWrap((w) => {
      localStorage.setItem("mvc.codewrap", String(!w));
      return !w;
    });
  }

  return (
    <div className="border border-hairline rounded-lg overflow-hidden bg-code-bg">
      <div className="h-8 flex items-center justify-between px-md bg-surface border-b border-hairline">
        <span className="text-mono-id font-mono font-mono-noliga text-stone truncate">
          {language} · {qualifiedName}
        </span>
        <div className="flex items-center gap-xxs">
          <IconButton aria-label={wrap ? "Disable soft wrap" : "Enable soft wrap"} onClick={toggleWrap}>
            ↵
          </IconButton>
          <IconButton aria-label="Copy code" onClick={() => navigator.clipboard.writeText(code)}>
            ⧉
          </IconButton>
        </div>
      </div>
      <div
        role="region"
        aria-label={`Code for ${qualifiedName}`}
        tabIndex={0}
        className={`code-block font-mono-noliga text-mono-code ${wrap ? "" : "overflow-x-auto"}`}
        style={{ tabSize: 4 }}
      >
        {visibleLines.map((line, i) => {
          const absoluteLine = startLine + i;
          const isEvidence =
            evidenceLines && absoluteLine >= evidenceLines[0] && absoluteLine <= evidenceLines[1];
          return (
            <div
              key={absoluteLine}
              className={`flex ${
                isEvidence && evidenceClass && evidenceVerdict
                  ? `${evidenceClass.tint} border-l-2 ${EVIDENCE_BORDER[evidenceVerdict]}`
                  : ""
              }`}
            >
              <span className="w-11 shrink-0 bg-code-gutter text-code-line-no text-right pr-sm select-none border-r border-hairline">
                {absoluteLine}
              </span>
              <span className={`pl-sm ${wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`}>
                {tokenizeLine(line).map((tok, idx) => (
                  <span key={idx} className={tok.className}>
                    {tok.text}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
      {lines.length > COLLAPSE_AT && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full text-label-sm text-accent hover:underline py-sm border-t border-hairline"
        >
          Show all ({lines.length} lines)
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: InlineCode**

Create `src/components/signature/InlineCode.tsx`:
```typescript
export function InlineCode({ children }: { children: string }) {
  return (
    <code className="inline-code font-mono font-mono-noliga text-mono-code-sm bg-surface-sunken rounded-xs px-[5px] py-px">
      {children}
    </code>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/signature`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/signature/tokenize.ts src/components/signature/CodeBlock.tsx src/components/signature/InlineCode.tsx
git commit -m "feat: add code-block with line-numbered evidence highlighting and inline-code"
```

---

### Task 18: RuleQuote, EvidenceBlock, DiscrepancyItem

**Files:**
- Create: `src/components/signature/RuleQuote.tsx`, `src/components/signature/EvidenceBlock.tsx`, `src/components/signature/DiscrepancyItem.tsx`

**Interfaces:**
- Consumes: `MetaBadge` (Task 13), `InlineCode` (Task 17), `Discrepancy` type (Task 4).
- Produces: `RuleQuote`, `EvidenceBlock`, `DiscrepancyItem` (prop `onLocationClick?: (location: string) => void`) — consumed by `CompareLedger` (Task 19) and the Compare screen's discrepancy stack (Task 23).

- [ ] **Step 1: RuleQuote**

Create `src/components/signature/RuleQuote.tsx`:
```typescript
export function RuleQuote({ text }: { text: string }) {
  return (
    <blockquote className="bg-surface-sunken border-l-2 border-hairline-strong rounded-r-xs px-lg py-md text-body-lg text-body not-italic">
      {text}
    </blockquote>
  );
}
```

- [ ] **Step 2: EvidenceBlock**

Create `src/components/signature/EvidenceBlock.tsx`:
```typescript
import type { ReactNode } from "react";

export function EvidenceBlock({ children }: { children: ReactNode }) {
  return <div className="bg-surface-raised border border-hairline rounded-lg p-lg">{children}</div>;
}
```

- [ ] **Step 3: DiscrepancyItem**

Create `src/components/signature/DiscrepancyItem.tsx`:
```typescript
import type { Discrepancy, Verdict } from "../../types/domain";
import { MetaBadge } from "../primitives/MetaBadge";
import { RuleQuote } from "./RuleQuote";
import { verdictColorClass } from "../primitives/verdict";

interface DiscrepancyItemProps {
  discrepancy: Discrepancy;
  verdict: Verdict;
  onLocationClick?: (location: string) => void;
}

export function DiscrepancyItem({ discrepancy, verdict, onLocationClick }: DiscrepancyItemProps) {
  const { bar } = verdictColorClass(verdict);
  return (
    <div className={`relative bg-surface-raised border border-hairline rounded-lg p-lg pl-xl overflow-hidden`}>
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${bar}`} />
      <div className="flex items-center gap-sm mb-sm">
        <MetaBadge label={discrepancy.type.toUpperCase()} />
      </div>
      <p className="text-body-md text-ink mb-md">{discrepancy.description}</p>
      <div className="flex flex-col min-[1024px]:flex-row gap-md">
        {discrepancy.rule_text && (
          <div className="flex-1">
            <RuleQuote text={discrepancy.rule_text} />
          </div>
        )}
        {discrepancy.code_location && (
          <div className="flex-1">
            <button
              type="button"
              onClick={() => onLocationClick?.(discrepancy.code_location!)}
              className="w-full text-left font-mono font-mono-noliga text-mono-code-sm bg-surface-sunken rounded-md px-md py-sm hover:bg-surface-sunken/80"
            >
              {discrepancy.code_location}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/signature`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/signature/RuleQuote.tsx src/components/signature/EvidenceBlock.tsx src/components/signature/DiscrepancyItem.tsx
git commit -m "feat: add rule-quote, evidence-block, and discrepancy-item components"
```

---

### Task 19: VerdictSpine and CompareLedger

**Files:**
- Create: `src/components/signature/VerdictSpine.tsx`, `src/components/signature/CompareLedger.tsx`

**Interfaces:**
- Consumes: `VERDICT_GLYPH`, `verdictColorClass` (Task 13), `CodeBlock` (Task 17), `MetaBadge` (Task 13), `FactVerdict` type (Task 4).
- Produces: `VerdictSpine`, `CompareLedger` (props: `fact: FactVerdict`, `code: { snippet: string; startLine: number; endLine: number; qualifiedName: string; language: string; filePath: string; factType: string }`, `highlightedLocation?: string | null`) — the primary component the Compare screen (Task 23) renders.

- [ ] **Step 1: VerdictSpine**

Create `src/components/signature/VerdictSpine.tsx`:
```typescript
import type { Verdict } from "../../types/domain";
import { VERDICT_GLYPH, verdictColorClass } from "../primitives/verdict";

export function VerdictSpine({ verdict, confidence }: { verdict: Verdict; confidence: number }) {
  const { text, tint, bar } = verdictColorClass(verdict);
  return (
    <div
      className={`relative w-full min-[900px]:w-14 h-11 min-[900px]:h-auto shrink-0 ${tint} flex items-center justify-center`}
    >
      <div
        className={`absolute ${bar} min-[900px]:left-1/2 min-[900px]:-translate-x-1/2 min-[900px]:top-0 min-[900px]:bottom-0 min-[900px]:w-1 min-[900px]:h-auto left-0 right-0 top-1/2 -translate-y-1/2 h-1 w-auto`}
      />
      <div className="relative flex min-[900px]:flex-col flex-row items-center gap-xs min-[900px]:gap-xxs">
        <div className={`h-7 w-7 rounded-xs flex items-center justify-center ${bar} text-on-accent`} aria-hidden="true">
          {VERDICT_GLYPH[verdict]}
        </div>
        <div
          className={`text-mono-eyebrow uppercase tracking-wide font-mono font-mono-noliga ${text} min-[900px]:[writing-mode:vertical-rl] min-[900px]:rotate-180`}
        >
          {verdict}
        </div>
        <div className="text-mono-id tabular-nums font-mono font-mono-noliga text-stone">
          {confidence.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: CompareLedger**

Create `src/components/signature/CompareLedger.tsx`. Beyond the two-column grid and spine, this includes three details easy to miss from a first skim of DESIGN.md but present in its *Typography → Hierarchy* and *Data → UI Mapping* tables: a `{typography.title-lg}` detail header carrying the selected fact's `qualified_name` (the table's own words: "Detail header — the selected fact's `qualified_name`"), reasoning set at `{typography.body-lg}` capped to 72ch (not `body-md`), and `fact_type` rendered as a `{component.meta-badge}` (not plain text) in the code column's origin footer:
```typescript
import { useEffect, useRef } from "react";
import { CodeBlock } from "./CodeBlock";
import { VerdictSpine } from "./VerdictSpine";
import { MetaBadge } from "../primitives/MetaBadge";
import type { FactVerdict } from "../../types/domain";

export interface LedgerCode {
  snippet: string;
  startLine: number;
  endLine: number;
  qualifiedName: string;
  language: string;
  filePath: string;
  factType: string;
}

interface CompareLedgerProps {
  fact: FactVerdict;
  code: LedgerCode;
  highlightedLocation?: string | null;
}

export function CompareLedger({ fact, code, highlightedLocation }: CompareLedgerProps) {
  const codeColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedLocation) {
      codeColumnRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightedLocation]);

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`Ledger: ${fact.verdict} verdict for ${fact.qualified_name}, confidence ${fact.confidence}`}
      className="flex flex-col min-h-0"
    >
      <div className="px-lg pt-lg pb-md border-b border-hairline">
        <h2 className="text-title-lg text-ink font-mono font-mono-noliga font-medium break-words">
          {fact.qualified_name}
        </h2>
      </div>
      <div className="flex flex-col min-[900px]:flex-row bg-canvas flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-[900px]:min-w-[340px] flex flex-col min-h-0 border-b min-[900px]:border-b-0 min-[900px]:border-r border-hairline-strong">
          <div className="h-8 shrink-0 sticky top-0 bg-surface flex items-center px-md text-mono-eyebrow uppercase tracking-wide text-stone font-mono font-mono-noliga">
            Model Rule
          </div>
          <div className="flex-1 overflow-auto p-lg flex flex-col gap-md">
            {fact.rule_reference ? (
              <>
                <p className="text-body-lg text-body max-w-[72ch]">{fact.rule_reference.rule_text}</p>
                <p className="text-mono-id font-mono font-mono-noliga text-stone">
                  {fact.rule_reference.document_name} · chunk {fact.rule_reference.chunk_index} · sim{" "}
                  {fact.rule_reference.similarity_score.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-body-md text-mute">No matching rule text was found for this fact.</p>
            )}
            <p className="text-body-lg text-ink max-w-[72ch] mt-md">{fact.reasoning}</p>
          </div>
        </div>

        <VerdictSpine verdict={fact.verdict} confidence={fact.confidence} />

        <div
          ref={codeColumnRef}
          className={`flex-1 min-w-0 min-[900px]:min-w-[340px] min-[900px]:border-l border-hairline-strong flex flex-col min-h-0 transition-colors duration-base ${
            highlightedLocation ? "bg-code-evidence-bg" : ""
          }`}
        >
          <div className="h-8 shrink-0 sticky top-0 bg-surface flex items-center px-md text-mono-eyebrow uppercase tracking-wide text-stone font-mono font-mono-noliga">
            Code
          </div>
          <div className="flex-1 overflow-auto p-lg flex flex-col gap-md">
            <CodeBlock
              code={code.snippet}
              startLine={code.startLine}
              qualifiedName={code.qualifiedName}
              language={code.language}
              evidenceLines={[code.startLine, code.endLine]}
              evidenceVerdict={fact.verdict}
            />
            <p className="text-mono-id font-mono font-mono-noliga text-stone flex items-center gap-sm">
              <span>
                {code.filePath} · {code.startLine}–{code.endLine}
              </span>
              <MetaBadge label={code.factType.toUpperCase()} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

The left column's `min-[900px]:border-r` and the right column's `min-[900px]:border-l` (both `border-hairline-strong`) implement DESIGN.md's "both flanking columns are `{colors.canvas}` with a `{colors.hairline-strong}` inner edge against the spine channel" at desktop widths — below 900px the spine itself becomes a horizontal band between the stacked columns, so the mobile `border-b` already visually separates them without needing this rule too.

`highlightedLocation` is a best-effort implementation of DESIGN.md's "clicking `code_location` scrolls the code panel to the matching region and applies `{colors.code-evidence-bg}`" rule. `frontend.md`'s `CompareResponse.verdicts[]` does not carry per-discrepancy line numbers (only a free-text `code_location` string) — the same documented gap noted in Task 23 — so an exact line-level scroll target isn't derivable from the API contract as specified. This implementation scrolls the whole code column into view and washes it in the evidence tint as an honest approximation, rather than fabricating a line number. If the compare endpoint is later extended with per-discrepancy line ranges, tighten this to scroll/highlight only those lines the same way `evidenceLines` already does for the overall fact.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/signature`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/signature/VerdictSpine.tsx src/components/signature/CompareLedger.tsx
git commit -m "feat: add verdict-spine and compare-ledger signature components"
```

---

### Task 20: TriageRow and TriageList

**Files:**
- Create: `src/components/signature/TriageRow.tsx`, `src/components/signature/TriageList.tsx`

**Interfaces:**
- Consumes: `VERDICT_GLYPH`, `verdictColorClass`, `VERDICT_ORDER` (Task 13), `ConfidenceMeter` (Task 13), `FactVerdict` type.
- Produces: `TriageRow`, `TriageList` (props: `facts: FactVerdict[]`, `selectedFactId: string | null`, `onSelectFact: (id: string) => void`, `searchValue: string`, `onSearchChange: (v: string) => void`, `searchInputRef?: React.RefObject<HTMLInputElement | null>`) — consumed by the Compare screen (Task 23), which owns verdict-filter and sort state and passes in the already-sorted/filtered `facts` array per DESIGN.md's *Sort contract*. Note the `| null` in the ref type: `useRef<HTMLInputElement>(null)` resolves to `RefObject<HTMLInputElement | null>` under React 19's type overloads, not the bare `RefObject<HTMLInputElement>` — get this right the first time, since a solution-style root `tsconfig.json` (see Global Constraints) means a bare `npx tsc --noEmit` will NOT catch this mismatch; only `npm run build`'s `tsc -b` will.

- [ ] **Step 1: TriageRow**

Create `src/components/signature/TriageRow.tsx`:
```typescript
import type { FactVerdict } from "../../types/domain";
import { VERDICT_GLYPH, verdictColorClass } from "../primitives/verdict";
import { ConfidenceMeter } from "../primitives/ConfidenceMeter";

interface TriageRowProps {
  fact: FactVerdict;
  selected: boolean;
  onSelect: () => void;
  id: string;
}

export function TriageRow({ fact, selected, onSelect, id }: TriageRowProps) {
  const { text, bar } = verdictColorClass(fact.verdict);
  return (
    <div
      id={id}
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={`relative h-11 min-[1024px]:h-11 max-[1023px]:h-14 flex items-center gap-sm pl-lg pr-lg border-b border-hairline cursor-pointer hover:bg-surface ${
        selected ? "bg-accent-tint" : ""
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${bar}`} />
      {selected && <div className="absolute left-[3px] top-0 bottom-0 w-[2px] bg-accent" />}
      <span className={`font-mono font-mono-noliga ${text}`} aria-hidden="true">
        {VERDICT_GLYPH[fact.verdict]}
      </span>
      <span className="font-mono font-mono-noliga text-mono-id text-stone shrink-0">{fact.fact_id}</span>
      <span dir="rtl" className="flex-1 min-w-0 text-left truncate text-body-md text-ink">
        {fact.qualified_name}
      </span>
      <ConfidenceMeter confidence={fact.confidence} verdict={fact.verdict} />
    </div>
  );
}
```

- [ ] **Step 2: TriageList**

Create `src/components/signature/TriageList.tsx`:
```typescript
import { useRef } from "react";
import type { RefObject } from "react";
import type { FactVerdict } from "../../types/domain";
import { TriageRow } from "./TriageRow";

interface TriageListProps {
  facts: FactVerdict[];
  selectedFactId: string | null;
  onSelectFact: (id: string) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

export function TriageList({
  facts,
  selectedFactId,
  onSelectFact,
  searchValue,
  onSearchChange,
  searchInputRef,
}: TriageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef ?? fallbackRef;

  function moveSelection(delta: 1 | -1) {
    if (facts.length === 0) return;
    const currentIndex = facts.findIndex((f) => f.fact_id === selectedFactId);
    const nextIndex =
      currentIndex === -1 ? 0 : Math.min(facts.length - 1, Math.max(0, currentIndex + delta));
    onSelectFact(facts[nextIndex].fact_id);
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "Enter" && selectedFactId) {
      onSelectFact(selectedFactId);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 w-full min-[1600px]:w-[420px] min-[1280px]:w-[380px] min-[1024px]:w-[320px] shrink-0 border-r border-hairline">
      <div className="h-10 shrink-0 sticky top-0 bg-surface flex items-center gap-sm px-md border-b border-hairline">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by fact_id or qualified_name"
          aria-label="Filter triage list"
          className="flex-1 min-w-0 bg-transparent text-body-sm placeholder:text-faint focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <span className="font-mono font-mono-noliga text-mono-id text-stone">{facts.length}</span>
      </div>
      <div
        ref={listRef}
        role="listbox"
        aria-activedescendant={selectedFactId ? `triage-row-${selectedFactId}` : undefined}
        tabIndex={0}
        onKeyDown={onListKeyDown}
        className="flex-1 overflow-auto focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {facts.map((fact) => (
          <TriageRow
            key={fact.fact_id}
            id={`triage-row-${fact.fact_id}`}
            fact={fact}
            selected={fact.fact_id === selectedFactId}
            onSelect={() => onSelectFact(fact.fact_id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/signature`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/signature/TriageRow.tsx src/components/signature/TriageList.tsx
git commit -m "feat: add triage-row and triage-list with listbox keyboard navigation"
```

---

### Task 21: ProgressCompare, FactMultiselect, FileDrop

**Files:**
- Create: `src/components/signature/ProgressCompare.tsx`, `src/components/signature/FactMultiselect.tsx`, `src/components/signature/FileDrop.tsx`

**Interfaces:**
- Consumes: `Verdict` type, `VERDICT_GLYPH` (Task 13).
- Produces: `ProgressCompare` (props: `factsTotal: number`, `domain: string`, `profile: string`), `FactMultiselect` (props: `facts: { factId: string; qualifiedName: string; verdict?: Verdict }[]`, `selected: string[] | null`, `onChange: (ids: string[] | null) => void`), `FileDrop` (props: `allowedExtensions: string[]`, `domain: string`, `onFileSelected: (file: File) => void`) — consumed by the Compare screen (Task 22) and Sources screen (Task 24).

- [ ] **Step 1: ProgressCompare**

Create `src/components/signature/ProgressCompare.tsx`:
```typescript
import { useEffect, useState } from "react";

interface ProgressCompareProps {
  factsTotal: number;
  domain: string;
  profile: string;
}

export function ProgressCompare({ factsTotal, domain, profile }: ProgressCompareProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - start), 1000);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.floor(elapsedMs / 1000);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex-1 h-[88px] flex flex-col justify-center gap-sm px-lg rounded-lg border border-hairline bg-surface-raised"
    >
      <div className="h-[2px] w-full bg-hairline overflow-hidden rounded-full">
        <div className="h-full w-1/3 bg-accent animate-[indeterminate_1.2s_ease-in-out_infinite]" />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-body-md text-ink">
          Comparing {factsTotal} facts against {domain} · {profile}
        </p>
        <span className="font-mono font-mono-noliga text-mono-id tabular-nums text-stone">{seconds}s</span>
      </div>
      {seconds > 30 && (
        <p className="text-body-sm text-mute">Comprehensive search takes longer. Still working.</p>
      )}
    </div>
  );
}
```

Add the indeterminate-bar keyframe used above to `tailwind.config.js`'s `theme.extend.keyframes` (alongside `skeleton-pulse` from Task 14):
```js
        indeterminate: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
```

- [ ] **Step 2: FactMultiselect**

Create `src/components/signature/FactMultiselect.tsx`:
```typescript
import { useState } from "react";
import type { Verdict } from "../../types/domain";
import { VERDICT_GLYPH } from "../primitives/verdict";

interface FactOption {
  factId: string;
  qualifiedName: string;
  verdict?: Verdict;
}

interface FactMultiselectProps {
  facts: FactOption[];
  selected: string[] | null;
  onChange: (ids: string[] | null) => void;
}

export function FactMultiselect({ facts, selected, onChange }: FactMultiselectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const triggerLabel =
    selected === null ? "All facts" : `${selected.length} fact${selected.length === 1 ? "" : "s"} selected`;

  const visible = facts.filter(
    (f) =>
      f.qualifiedName.toLowerCase().includes(filter.toLowerCase()) ||
      f.factId.toLowerCase().includes(filter.toLowerCase())
  );

  function toggle(factId: string) {
    const current = selected ?? [];
    const next = current.includes(factId) ? current.filter((id) => id !== factId) : [...current, factId];
    onChange(next.length === 0 ? null : next);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="h-9 px-md rounded-md border border-hairline-strong bg-canvas text-body-md text-ink"
      >
        {triggerLabel}
      </button>
      {open && (
        <div className="absolute z-30 mt-xs w-80 max-h-96 overflow-auto rounded-lg border border-hairline bg-surface-raised shadow-pop p-sm">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter facts"
            className="w-full h-8 px-sm mb-sm rounded-sm border border-hairline-strong bg-canvas text-body-sm"
          />
          {visible.map((f) => (
            <label key={f.factId} className="flex items-center gap-sm px-sm py-xs hover:bg-surface rounded-sm">
              <input
                type="checkbox"
                checked={(selected ?? []).includes(f.factId)}
                onChange={() => toggle(f.factId)}
              />
              <span className="font-mono font-mono-noliga text-mono-id text-stone">{f.factId}</span>
              <span className="flex-1 truncate text-body-sm text-ink">{f.qualifiedName}</span>
              {f.verdict && <span aria-hidden="true">{VERDICT_GLYPH[f.verdict]}</span>}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: FileDrop**

Create `src/components/signature/FileDrop.tsx`:
```typescript
import { useRef, useState } from "react";

interface FileDropProps {
  allowedExtensions: string[];
  domain: string;
  onFileSelected: (file: File) => void;
}

export function FileDrop({ allowedExtensions, domain, onFileSelected }: FileDropProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateAndEmit(file: File) {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Allowed: ${allowedExtensions.join(", ")}`);
      return;
    }
    setError(null);
    onFileSelected(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) validateAndEmit(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        className={`h-[140px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-xs cursor-pointer ${
          dragOver ? "border-accent bg-accent-tint" : "border-hairline-strong bg-surface"
        }`}
      >
        <span className={`text-2xl ${dragOver ? "text-accent" : "text-mute"}`} aria-hidden="true">
          ⬆
        </span>
        <p className="text-body-sm text-mute">
          Drop a document for <strong className="text-ink">{domain}</strong>, or click to browse
        </p>
        <p className="text-caption text-faint">Allowed: {allowedExtensions.join(", ")}</p>
        <input
          ref={inputRef}
          type="file"
          accept={allowedExtensions.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndEmit(file);
          }}
        />
      </div>
      {error && <p className="text-body-sm text-verdict-misaligned mt-xs">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/components/signature`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/signature/ProgressCompare.tsx src/components/signature/FactMultiselect.tsx src/components/signature/FileDrop.tsx tailwind.config.js
git commit -m "feat: add progress-compare, fact-multiselect, and file-drop components"
```

---

### Task 22: Compare screen — state, control bar, and summary strip

**Files:**
- Create: `src/screens/Compare/sort.ts`, `src/screens/Compare/useCompareState.ts`, `src/screens/Compare/ControlBar.tsx`, `src/screens/Compare/SummaryStrip.tsx`, `src/screens/Compare/CompareScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useDomains`, `useRuns`, `useCompare` (Task 9), `useRun`/`useToast` (Task 10), `SelectField` (Task 12), `Toggle`/`SegmentedControl` (Task 12), `StatCard` (Task 16), `FactMultiselect`/`ProgressCompare` (Task 21), `EmptyState` (Task 14), `VERDICT_ORDER` (Task 13).
- Produces: `sortFacts(facts): FactVerdict[]` (the sort contract, reused verbatim by Task 23), `useCompareState()` (owns all Compare screen state), `CompareScreen` — mounted at `/` in place of `StubScreen`. Task 23 imports and extends `CompareScreen`'s body; it does not redefine any of this task's exports.

- [ ] **Step 1: Sort contract**

Create `src/screens/Compare/sort.ts`:
```typescript
import type { FactVerdict } from "../../types/domain";
import { VERDICT_ORDER } from "../../components/primitives/verdict";

export function sortFacts(facts: FactVerdict[]): FactVerdict[] {
  return [...facts].sort((a, b) => {
    const verdictDelta = VERDICT_ORDER.indexOf(a.verdict) - VERDICT_ORDER.indexOf(b.verdict);
    if (verdictDelta !== 0) return verdictDelta;
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return a.fact_id.localeCompare(b.fact_id);
  });
}
```

- [ ] **Step 2: Screen state hook**

Create `src/screens/Compare/useCompareState.ts`:
```typescript
import { useState } from "react";
import type { SearchProfile, Verdict } from "../../types/domain";

export function useCompareState() {
  const [domain, setDomain] = useState("");
  const [runId, setRunId] = useState("");
  const [keyOnly, setKeyOnly] = useState(false);
  const [searchProfile, setSearchProfile] = useState<SearchProfile>("balanced");
  const [factIds, setFactIds] = useState<string[] | null>(null);
  const [controlBarCollapsed, setControlBarCollapsed] = useState(false);
  const [verdictFilters, setVerdictFilters] = useState<Set<Verdict>>(new Set());
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [highlightedLocation, setHighlightedLocation] = useState<string | null>(null);

  function toggleVerdictFilter(v: Verdict) {
    setVerdictFilters((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  function setSingleVerdictFilter(v: Verdict) {
    setVerdictFilters(new Set([v]));
  }

  function clearVerdictFilters() {
    setVerdictFilters(new Set());
  }

  return {
    domain, setDomain,
    runId, setRunId,
    keyOnly, setKeyOnly,
    searchProfile, setSearchProfile,
    factIds, setFactIds,
    controlBarCollapsed, setControlBarCollapsed,
    verdictFilters, toggleVerdictFilter, setSingleVerdictFilter, clearVerdictFilters,
    selectedFactId, setSelectedFactId,
    searchValue, setSearchValue,
    highlightedLocation, setHighlightedLocation,
  };
}

export type CompareState = ReturnType<typeof useCompareState>;
```

- [ ] **Step 3: Control bar**

Create `src/screens/Compare/ControlBar.tsx`:
```typescript
import type { CodeRun, SearchProfile, Verdict } from "../../types/domain";
import { SelectField } from "../../components/primitives/SelectField";
import { Toggle } from "../../components/primitives/Toggle";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { Button } from "../../components/primitives/Button";
import { FactMultiselect } from "../../components/signature/FactMultiselect";

interface FactOption {
  factId: string;
  qualifiedName: string;
  verdict?: Verdict;
}

interface ControlBarProps {
  domains: string[];
  domain: string;
  onDomainChange: (d: string) => void;
  runs: CodeRun[];
  runId: string;
  onRunIdChange: (id: string) => void;
  keyOnly: boolean;
  onKeyOnlyChange: (v: boolean) => void;
  searchProfile: SearchProfile;
  onSearchProfileChange: (p: SearchProfile) => void;
  factOptions: FactOption[];
  factIds: string[] | null;
  onFactIdsChange: (ids: string[] | null) => void;
  onCompare: () => void;
  comparing: boolean;
  collapsed: boolean;
  onEdit: () => void;
}

export function ControlBar(props: ControlBarProps) {
  const selectedRun = props.runs.find((r) => r.run_id === props.runId);
  const keyCount = selectedRun?.key_calculation_count ?? 0;
  const totalCount = selectedRun?.facts_total ?? 0;

  if (props.collapsed) {
    return (
      <div className="h-10 flex items-center gap-sm px-lg bg-surface border-b border-hairline">
        <span className="font-mono font-mono-noliga text-mono-id text-ink">
          {props.domain} · {props.runId} · {props.searchProfile}
          {props.keyOnly ? " · key only" : ""}
        </span>
        <Button variant="quiet" onClick={props.onEdit}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-md p-lg bg-surface border-b border-hairline">
      <SelectField
        id="compare-domain"
        label="Domain"
        value={props.domain as never}
        placeholder="Select domain"
        options={props.domains.map((d) => ({ value: d as never, label: d }))}
        onChange={(v) => props.onDomainChange(v)}
      />
      <SelectField
        id="compare-run"
        label="Run"
        value={props.runId as never}
        placeholder="Select run"
        options={props.runs.map((r) => ({
          value: r.run_id as never,
          label: `${r.run_id} — ${r.file_path} (${r.facts_total} facts${r.llm_refined ? ", llm-refined" : ""})`,
        }))}
        onChange={(v) => props.onRunIdChange(v)}
      />
      <Toggle
        id="compare-key-only"
        checked={props.keyOnly}
        onChange={props.onKeyOnlyChange}
        label={`Key calculations only (${keyCount} of ${totalCount})`}
      />
      <div className="flex flex-col gap-xxs">
        <span className="text-label-md text-mute">Search profile</span>
        <SegmentedControl
          aria-label="Search profile"
          value={props.searchProfile}
          onChange={props.onSearchProfileChange}
          segments={[
            { value: "precise", label: "Precise" },
            { value: "balanced", label: "Balanced" },
            { value: "comprehensive", label: "Comprehensive" },
          ]}
        />
        <span className="text-caption text-mute max-w-[32ch]">
          Comprehensive searches more of the corpus and takes longer.
        </span>
      </div>
      {props.factOptions.length > 0 && (
        <FactMultiselect facts={props.factOptions} selected={props.factIds} onChange={props.onFactIdsChange} />
      )}
      <Button
        variant="primary"
        onClick={props.onCompare}
        loading={props.comparing}
        loadingLabel={`Comparing ${totalCount || "…"} facts…`}
        disabled={!props.domain || !props.runId}
        className="ml-auto"
      >
        Compare
      </Button>
    </div>
  );
}
```

Note: the `as never` casts on `SelectField`'s generic `value`/`option.value` exist because `SelectField<T extends string>` needs a concrete literal type per call site; passing plain `string` through a generic parameterized by itself requires this cast at the boundary. This is a narrow, intentional cast at a component boundary, not a suppressed type error — do not spread `as never` anywhere else.

- [ ] **Step 4: Summary strip**

Create `src/screens/Compare/SummaryStrip.tsx`:
```typescript
import type { CompareSummary, Verdict } from "../../types/domain";
import { StatCard, type StatKey } from "../../components/signature/StatCard";

interface SummaryStripProps {
  summary: CompareSummary;
  activeFilters: Set<Verdict>;
  onToggleFilter: (v: Verdict) => void;
  onClearFilters: () => void;
}

const CARDS: { key: StatKey; label: string }[] = [
  { key: "total", label: "Total" },
  { key: "Misaligned", label: "Misaligned" },
  { key: "Partial", label: "Partial" },
  { key: "Unrelated", label: "Unrelated" },
  { key: "Aligned", label: "Aligned" },
];

export function SummaryStrip({ summary, activeFilters, onToggleFilter, onClearFilters }: SummaryStripProps) {
  const counts: Record<StatKey, number> = {
    total: summary.total,
    Misaligned: summary.misaligned,
    Partial: summary.partial,
    Unrelated: summary.unrelated,
    Aligned: summary.aligned,
  };

  return (
    <div className="flex gap-md p-lg overflow-x-auto">
      {CARDS.map((c) => (
        <StatCard
          key={c.key}
          statKey={c.key}
          label={c.label}
          count={counts[c.key]}
          active={c.key === "total" ? activeFilters.size === 0 : activeFilters.has(c.key)}
          onClick={() => (c.key === "total" ? onClearFilters() : onToggleFilter(c.key))}
        />
      ))}
    </div>
  );
}
```

DESIGN.md's *Cards & Containers → stat-card* entry states explicitly "The Misaligned card is first among the four verdicts, left to right. Reading order matches triage order" — this is followed over the earlier *Compare Screen Geometry* ASCII mock (which sketches Total/Aligned/Partial/Misaligned/Unrelated as a rough illustration, not a literal ordering spec); `CARDS` above implements the explicit rule.

- [ ] **Step 5: Compare screen**

Create `src/screens/Compare/CompareScreen.tsx`:
```typescript
import { useEffect } from "react";
import { useDomains } from "../../hooks/useDomains";
import { useRuns } from "../../hooks/useRuns";
import { useCompare } from "../../hooks/useCompare";
import { ApiClientError } from "../../api/client";
import { useRun } from "../../context/RunContext";
import { useToast } from "../../context/ToastContext";
import { useCompareState } from "./useCompareState";
import { ControlBar } from "./ControlBar";
import { SummaryStrip } from "./SummaryStrip";
import { ProgressCompare } from "../../components/signature/ProgressCompare";
import { EmptyState } from "../../components/signature/EmptyState";

export function CompareScreen() {
  const domainsQuery = useDomains();
  const runsQuery = useRuns();
  const compare = useCompare();
  const { setActiveRun } = useRun();
  const { showToast } = useToast();
  const state = useCompareState();

  useEffect(() => {
    if (domainsQuery.data && !state.domain) {
      state.setDomain(domainsQuery.data.default_domain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainsQuery.data]);

  async function handleCompare() {
    try {
      const result = await compare.run({
        run_id: state.runId,
        domain: state.domain,
        fact_ids: state.factIds,
        key_only: state.keyOnly,
        search_profile: state.searchProfile,
      });
      setActiveRun({ runId: result.run_id, domain: result.domain });
      state.setControlBarCollapsed(true);
      state.clearVerdictFilters();
      state.setSelectedFactId(result.verdicts[0]?.fact_id ?? null);
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Compare failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  const factOptions =
    compare.data?.verdicts.map((v) => ({
      factId: v.fact_id,
      qualifiedName: v.qualified_name,
      verdict: v.verdict,
    })) ?? [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <ControlBar
        domains={domainsQuery.data?.domains ?? []}
        domain={state.domain}
        onDomainChange={state.setDomain}
        runs={runsQuery.data?.runs ?? []}
        runId={state.runId}
        onRunIdChange={state.setRunId}
        keyOnly={state.keyOnly}
        onKeyOnlyChange={state.setKeyOnly}
        searchProfile={state.searchProfile}
        onSearchProfileChange={state.setSearchProfile}
        factOptions={factOptions}
        factIds={state.factIds}
        onFactIdsChange={state.setFactIds}
        onCompare={handleCompare}
        comparing={compare.status === "loading"}
        collapsed={state.controlBarCollapsed}
        onEdit={() => state.setControlBarCollapsed(false)}
      />

      {compare.status === "loading" ? (
        <div className="p-lg">
          <ProgressCompare
            factsTotal={runsQuery.data?.runs.find((r) => r.run_id === state.runId)?.facts_total ?? 0}
            domain={state.domain}
            profile={state.searchProfile}
          />
        </div>
      ) : compare.data ? (
        <SummaryStrip
          summary={compare.data.summary}
          activeFilters={state.verdictFilters}
          onToggleFilter={state.toggleVerdictFilter}
          onClearFilters={state.clearVerdictFilters}
        />
      ) : null}

      <div className="flex-1 min-h-0">
        {!compare.data && compare.status !== "loading" && (
          <EmptyState
            title="No compare run yet"
            description="Select a domain and run above, then choose Compare to see verdicts."
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Mount the real Compare screen**

Modify `src/App.tsx` — replace the `index` route's element and remove `"Compare"` from the stub usages (the other four routes keep using `StubScreen` until their tasks land):
```typescript
import { CompareScreen } from "./screens/Compare/CompareScreen";
```
and change:
```typescript
<Route index element={<StubScreen name="Compare" />} />
```
to:
```typescript
<Route index element={<CompareScreen />} />
```

- [ ] **Step 7: Verify manually**

Run: `npm run dev`, open `/`. Expected: domain select pre-filled with `rtb` (the fixture's `default_domain`), run select populated with the two fixture runs, Compare button disabled until a run is chosen. Select the `20260819_141851_market_risk_engine` run, click Compare — expect the progress state to show briefly ("Comparing 37 facts against rtb · balanced"), then the control bar collapses to a chip row, the summary strip shows 5 stat cards with counts summing to 37, and clicking a non-Total card visually activates it (tinted background, coloured bottom border).

- [ ] **Step 8: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/screens/Compare src/App.tsx`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/screens/Compare src/App.tsx
git commit -m "feat: add Compare screen control bar, summary strip, and state wiring"
```

---

### Task 23: Compare screen — Ledger, triage list, discrepancy stack, and keyboard triage

**Files:**
- Modify: `src/screens/Compare/CompareScreen.tsx`
- Create: `src/screens/Compare/DiscrepancyStack.tsx`, `src/screens/Compare/useKeyboardTriage.ts`, `src/screens/Compare/ledgerCode.ts`

**Interfaces:**
- Consumes: `TriageList` (Task 20), `CompareLedger`/`LedgerCode` (Task 19), `DiscrepancyItem` (Task 18), `sortFacts` (Task 22), all of `useCompareState`'s returned setters (Task 22).
- Produces: a fully assembled Compare screen; `useKeyboardTriage` (a hook wiring the global keys `1`-`4`, `0`, `/`, `Esc`, `c` — `j`/`k`/`Enter` already live inside `TriageList` from Task 20); `buildLedgerCode(fact, filePath): LedgerCode` — the single place that derives `CompareLedger`'s `code` prop from a `FactVerdict` (see Task 19's note on the missing `evidence.code_snippet` field). Task 27's `HistoryScreen` imports this instead of re-deriving the same fallback logic.

- [ ] **Step 1: Shared Ledger code-prop builder**

`frontend.md`'s `CompareResponse.verdicts[]` has no `evidence.code_snippet`/`start_line`/`end_line` (only `fact_id`, `qualified_name`, `fact_type`, and free-text `code_location` strings inside `discrepancies[]`) — see Task 19's note on `CompareLedger`. Both this screen and Task 27's `HistoryScreen` need to build a `LedgerCode` from that same limited data; factor it out once here rather than duplicating the fallback logic in both places.

Create `src/screens/Compare/ledgerCode.ts`:
```typescript
import type { FactVerdict } from "../../types/domain";
import type { LedgerCode } from "../../components/signature/CompareLedger";

export function buildLedgerCode(fact: FactVerdict, filePath: string): LedgerCode {
  return {
    snippet: fact.discrepancies[0]?.code_location ?? fact.reasoning,
    startLine: 1,
    endLine: 1,
    qualifiedName: fact.qualified_name,
    language: "python",
    filePath,
    factType: fact.fact_type,
  };
}
```

- [ ] **Step 2: Discrepancy stack**

Create `src/screens/Compare/DiscrepancyStack.tsx`:
```typescript
import type { FactVerdict } from "../../types/domain";
import { DiscrepancyItem } from "../../components/signature/DiscrepancyItem";

interface DiscrepancyStackProps {
  fact: FactVerdict;
  onLocationClick: (location: string) => void;
}

export function DiscrepancyStack({ fact, onLocationClick }: DiscrepancyStackProps) {
  if (fact.discrepancies.length === 0) return null;
  return (
    <div className="p-lg flex flex-col gap-md">
      <h3 className="text-title-sm text-ink">Discrepancies ({fact.discrepancies.length})</h3>
      {fact.discrepancies.map((d, i) => (
        <DiscrepancyItem key={i} discrepancy={d} verdict={fact.verdict} onLocationClick={onLocationClick} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Global keyboard triage hook**

Create `src/screens/Compare/useKeyboardTriage.ts`:
```typescript
import { useEffect, type RefObject } from "react";
import type { Verdict } from "../../types/domain";

const NUMBER_TO_VERDICT: Record<string, Verdict> = {
  "1": "Misaligned",
  "2": "Partial",
  "3": "Unrelated",
  "4": "Aligned",
};

interface Params {
  onSetSingleFilter: (v: Verdict) => void;
  onClearFilters: () => void;
  onCopyFactId: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export function useKeyboardTriage({ onSetSingleFilter, onClearFilters, onCopyFactId, searchInputRef }: Params) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (isTyping) {
        if (e.key === "Escape") target.blur();
        return;
      }
      if (e.key in NUMBER_TO_VERDICT) {
        onSetSingleFilter(NUMBER_TO_VERDICT[e.key]);
      } else if (e.key === "0") {
        onClearFilters();
      } else if (e.key === "c") {
        onCopyFactId();
      } else if (e.key === "Escape") {
        onClearFilters();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSetSingleFilter, onClearFilters, onCopyFactId, searchInputRef]);
}
```

- [ ] **Step 4: Assemble the full screen**

Replace `src/screens/Compare/CompareScreen.tsx` — add the imports, the derived `visibleFacts`/`selectedFact` values, the `TriageList` + `CompareLedger` + `DiscrepancyStack` layout, and the keyboard hook, on top of everything Task 22 already wrote:
```typescript
import { useEffect, useRef } from "react";
import { useDomains } from "../../hooks/useDomains";
import { useRuns } from "../../hooks/useRuns";
import { useCompare } from "../../hooks/useCompare";
import { ApiClientError } from "../../api/client";
import { useRun } from "../../context/RunContext";
import { useToast } from "../../context/ToastContext";
import { useCompareState } from "./useCompareState";
import { ControlBar } from "./ControlBar";
import { SummaryStrip } from "./SummaryStrip";
import { ProgressCompare } from "../../components/signature/ProgressCompare";
import { EmptyState } from "../../components/signature/EmptyState";
import { TriageList } from "../../components/signature/TriageList";
import { CompareLedger } from "../../components/signature/CompareLedger";
import { DiscrepancyStack } from "./DiscrepancyStack";
import { useKeyboardTriage } from "./useKeyboardTriage";
import { sortFacts } from "./sort";
import { buildLedgerCode } from "./ledgerCode";

export function CompareScreen() {
  const domainsQuery = useDomains();
  const runsQuery = useRuns();
  const compare = useCompare();
  const { setActiveRun } = useRun();
  const { showToast } = useToast();
  const state = useCompareState();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (domainsQuery.data && !state.domain) {
      state.setDomain(domainsQuery.data.default_domain);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainsQuery.data]);

  async function handleCompare() {
    try {
      const result = await compare.run({
        run_id: state.runId,
        domain: state.domain,
        fact_ids: state.factIds,
        key_only: state.keyOnly,
        search_profile: state.searchProfile,
      });
      setActiveRun({ runId: result.run_id, domain: result.domain });
      state.setControlBarCollapsed(true);
      state.clearVerdictFilters();
      state.setSelectedFactId(result.verdicts[0]?.fact_id ?? null);
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Compare failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  const factOptions =
    compare.data?.verdicts.map((v) => ({
      factId: v.fact_id,
      qualifiedName: v.qualified_name,
      verdict: v.verdict,
    })) ?? [];

  const filtered =
    compare.data?.verdicts.filter((v) => {
      const matchesVerdict = state.verdictFilters.size === 0 || state.verdictFilters.has(v.verdict);
      const q = state.searchValue.toLowerCase();
      const matchesSearch =
        q === "" || v.qualified_name.toLowerCase().includes(q) || v.fact_id.toLowerCase().includes(q);
      return matchesVerdict && matchesSearch;
    }) ?? [];
  const visibleFacts = sortFacts(filtered);
  const selectedFact = compare.data?.verdicts.find((v) => v.fact_id === state.selectedFactId) ?? null;

  useKeyboardTriage({
    onSetSingleFilter: state.setSingleVerdictFilter,
    onClearFilters: () => {
      state.clearVerdictFilters();
      state.setSearchValue("");
    },
    onCopyFactId: () => {
      if (state.selectedFactId) navigator.clipboard.writeText(state.selectedFactId);
    },
    searchInputRef,
  });

  useEffect(() => {
    state.setHighlightedLocation(null);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedFactId]);

  function handleLocationClick(location: string) {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    state.setHighlightedLocation(location);
    highlightTimeoutRef.current = setTimeout(() => {
      state.setHighlightedLocation(null);
      highlightTimeoutRef.current = null;
    }, 1600);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <ControlBar
        domains={domainsQuery.data?.domains ?? []}
        domain={state.domain}
        onDomainChange={state.setDomain}
        runs={runsQuery.data?.runs ?? []}
        runId={state.runId}
        onRunIdChange={state.setRunId}
        keyOnly={state.keyOnly}
        onKeyOnlyChange={state.setKeyOnly}
        searchProfile={state.searchProfile}
        onSearchProfileChange={state.setSearchProfile}
        factOptions={factOptions}
        factIds={state.factIds}
        onFactIdsChange={state.setFactIds}
        onCompare={handleCompare}
        comparing={compare.status === "loading"}
        collapsed={state.controlBarCollapsed}
        onEdit={() => state.setControlBarCollapsed(false)}
      />

      {compare.status === "loading" ? (
        <div className="p-lg">
          <ProgressCompare
            factsTotal={runsQuery.data?.runs.find((r) => r.run_id === state.runId)?.facts_total ?? 0}
            domain={state.domain}
            profile={state.searchProfile}
          />
        </div>
      ) : compare.data ? (
        <SummaryStrip
          summary={compare.data.summary}
          activeFilters={state.verdictFilters}
          onToggleFilter={state.toggleVerdictFilter}
          onClearFilters={state.clearVerdictFilters}
        />
      ) : null}

      <div className="flex-1 min-h-0 flex flex-col min-[1024px]:flex-row">
        {!compare.data && compare.status !== "loading" && (
          <EmptyState
            title="No compare run yet"
            description="Select a domain and run above, then choose Compare to see verdicts."
          />
        )}

        {compare.data && (
          <>
            <TriageList
              facts={visibleFacts}
              selectedFactId={state.selectedFactId}
              onSelectFact={state.setSelectedFactId}
              searchValue={state.searchValue}
              onSearchChange={state.setSearchValue}
              searchInputRef={searchInputRef}
            />
            <div className="flex-1 min-h-0 flex flex-col overflow-auto">
              {selectedFact ? (
                <>
                  <CompareLedger
                    fact={selectedFact}
                    code={buildLedgerCode(
                      selectedFact,
                      runsQuery.data?.runs.find((r) => r.run_id === state.runId)?.file_path ?? ""
                    )}
                    highlightedLocation={state.highlightedLocation}
                  />
                  <DiscrepancyStack fact={selectedFact} onLocationClick={handleLocationClick} />
                </>
              ) : (
                <EmptyState title="No fact selected" description="Choose a row from the triage list on the left." />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

`handleCompare`'s `catch (err)` reads the freshly-thrown `err` directly rather than the hook's `compare.error` — this matters. `compare.run(...)` dispatches its error into `useAsync`'s reducer state before re-throwing, but that dispatch only takes effect on React's *next* render; the `compare` object this render's `handleCompare` closure captured stays frozen at whatever it was when the closure was created, so `compare.error` read synchronously in the same `catch` block is always one render stale (`null` on the very first failure). Reading `err` — the value the `catch` clause actually receives — sidesteps the render-timing gap entirely. Apply the same fix everywhere else this codebase shows `<hook>.error?.message` inside a `catch` block right after `await <hook>.run(...)` (Task 25's `GitLabIngest`, Task 26's `AskScreen`) — each is written using this same corrected pattern in this plan already, and should not be reverted back to reading the hook's `.error` field.

`buildLedgerCode`'s fallback (Step 1 above) exists because `frontend.md`'s `CompareResponse` does not embed the full `code_facts[].evidence.code_snippet` on each verdict (only `code_location` strings inside discrepancies and the `qualified_name`/`fact_type`). A real backend integration will need either (a) the compare endpoint extended to include `evidence.code_snippet`/`start_line`/`end_line` per verdict, or (b) a follow-up fetch to the run's ingest artifact by `fact_id`. Document this as a known integration gap rather than inventing data: for now the Ledger's code column shows the best available text (`discrepancies[0].code_location` when present) — this is called out explicitly in Task 29's final verification pass, not hidden.

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, run a compare (Task 22's flow). Expected: triage list appears on the left (380px at desktop width), sorted Misaligned → Partial → Unrelated → Aligned then by confidence descending; clicking a row loads the Ledger on the right with the verdict spine showing the correct glyph/colour/confidence; pressing `j`/`k` moves the triage selection; pressing `1` filters to Misaligned only and the Misaligned stat card shows active; pressing `0` clears filters; pressing `/` focuses the triage search box; typing in the search box and pressing `Escape` clears both search and filters.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/screens/Compare`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/screens/Compare/CompareScreen.tsx src/screens/Compare/DiscrepancyStack.tsx src/screens/Compare/useKeyboardTriage.ts src/screens/Compare/ledgerCode.ts
git commit -m "feat: assemble Compare screen with triage list, ledger, discrepancies, and keyboard triage"
```

---

### Task 24: Sources screen — document upload and document list

**Files:**
- Create: `src/utils/formatRelativeTime.ts`, `src/screens/Sources/UploadPanel.tsx`, `src/screens/Sources/DocumentList.tsx`, `src/screens/Sources/SourcesScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useDomains` (Task 9), `useDocuments`/`useUpload` (Task 9), `useToast` (Task 10), `FileDrop` (Task 21), `StatusChip` (Task 13), `SelectField` (Task 12).
- Produces: `formatRelativeTime(iso: string): { relative: string; absolute: string }` (reused by Task 25's `RunsList` and Task 27's `HistoryScreen`), `SourcesScreen` mounted at `/sources`. Task 25 imports and extends this file to add the GitLab ingest section below the document list.

- [ ] **Step 1: Relative time formatter**

Create `src/utils/formatRelativeTime.ts`:
```typescript
export function formatRelativeTime(iso: string): { relative: string; absolute: string } {
  const date = new Date(iso);
  const absolute = date.toLocaleString();
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return { relative: "just now", absolute };
  if (diffMin < 60) return { relative: `${diffMin} min ago`, absolute };
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return { relative: `${diffHr} hr ago`, absolute };
  const diffDay = Math.floor(diffHr / 24);
  return { relative: `${diffDay} day${diffDay === 1 ? "" : "s"} ago`, absolute };
}
```

- [ ] **Step 2: Upload panel**

Create `src/screens/Sources/UploadPanel.tsx`:
```typescript
import { useState } from "react";
import { useDomains } from "../../hooks/useDomains";
import { useUpload } from "../../hooks/useUpload";
import { useToast } from "../../context/ToastContext";
import { SelectField } from "../../components/primitives/SelectField";
import { FileDrop } from "../../components/signature/FileDrop";
import { ApiClientError } from "../../api/client";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

interface UploadPanelProps {
  onUploaded: () => void;
}

export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const domainsQuery = useDomains();
  const upload = useUpload();
  const { showToast } = useToast();
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState<string | null>(null);

  const activeDomain = domain || domainsQuery.data?.default_domain || "";

  async function handleFile(file: File) {
    setDomainError(null);
    try {
      const result = await upload.run(file, activeDomain);
      showToast({ kind: "success", message: `${result.filename} uploaded to ${result.domain}.` });
      onUploaded();
    } catch (err) {
      const detail = err instanceof ApiClientError ? err.detail : undefined;
      const message = err instanceof ApiClientError ? err.message : "Upload failed";
      const allowedDomains =
        Array.isArray(detail) && detail[0]?.allowed_domains ? (detail[0].allowed_domains as string[]) : null;
      if (allowedDomains) {
        setDomainError(`Unsupported domain. Allowed: ${allowedDomains.join(", ")}`);
      }
      showToast({ kind: "error", message, detail });
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <SelectField
        id="upload-domain"
        label="Target domain"
        value={activeDomain as never}
        options={(domainsQuery.data?.domains ?? []).map((d) => ({ value: d as never, label: d }))}
        onChange={(v) => setDomain(v)}
      />
      {domainError && <p className="text-body-sm text-verdict-misaligned">{domainError}</p>}
      <FileDrop allowedExtensions={ALLOWED_EXTENSIONS} domain={activeDomain} onFileSelected={handleFile} />
    </div>
  );
}
```

- [ ] **Step 3: Document list**

Create `src/screens/Sources/DocumentList.tsx`:
```typescript
import { useState } from "react";
import type { DocumentRecord } from "../../types/domain";
import { StatusChip } from "../../components/primitives/StatusChip";
import { SelectField } from "../../components/primitives/SelectField";
import { EmptyState } from "../../components/signature/EmptyState";
import { Skeleton } from "../../components/signature/Skeleton";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

interface DocumentListProps {
  documents: DocumentRecord[];
  loading: boolean;
  domains: string[];
}

export function DocumentList({ documents, loading, domains }: DocumentListProps) {
  const [domainFilter, setDomainFilter] = useState<string>("");

  const visible = domainFilter ? documents.filter((d) => d.domain === domainFilter) : documents;

  if (loading) {
    return (
      <div className="flex flex-col gap-sm">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    );
  }

  if (documents.length === 0) {
    return <EmptyState title="No documents yet" description="Upload a model document above to get started." />;
  }

  return (
    <div className="flex flex-col gap-md">
      <SelectField
        id="document-domain-filter"
        label="Filter by domain"
        value={domainFilter as never}
        placeholder="All domains"
        options={domains.map((d) => ({ value: d as never, label: d }))}
        onChange={(v) => setDomainFilter(v)}
      />
      <div className="border border-hairline rounded-lg overflow-hidden">
        {visible.map((doc) => {
          const { relative, absolute } = formatRelativeTime(doc.uploaded_at);
          return (
            <div
              key={doc.saved_path}
              className="h-11 flex items-center gap-md px-lg border-b border-hairline last:border-b-0"
            >
              <span className="flex-1 truncate text-body-md text-ink">{doc.filename}</span>
              <span className="text-label-sm text-mute">{doc.domain}</span>
              <StatusChip status={doc.ingestion_status} />
              <time dateTime={doc.uploaded_at} title={absolute} className="text-caption text-stone w-20 text-right">
                {relative}
              </time>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Sources screen (document section only — Task 25 appends the GitLab section)**

Create `src/screens/Sources/SourcesScreen.tsx`:
```typescript
import { useDomains } from "../../hooks/useDomains";
import { useDocuments } from "../../hooks/useDocuments";
import { UploadPanel } from "./UploadPanel";
import { DocumentList } from "./DocumentList";

export function SourcesScreen() {
  const domainsQuery = useDomains();
  const documentsQuery = useDocuments();

  return (
    <div className="max-w-[960px] mx-auto p-xl flex flex-col gap-xxl">
      <div>
        <h1 className="text-title-xl text-ink mb-lg">Sources</h1>
        <UploadPanel onUploaded={documentsQuery.refresh} />
      </div>
      <div>
        <h2 className="text-title-md text-ink mb-lg">Uploaded documents</h2>
        <DocumentList
          documents={documentsQuery.data?.documents ?? []}
          loading={documentsQuery.status === "loading" || documentsQuery.status === "idle"}
          domains={domainsQuery.data?.domains ?? []}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Mount the screen**

Modify `src/App.tsx` — import `SourcesScreen` and replace:
```typescript
<Route path="sources" element={<StubScreen name="Sources" />} />
```
with:
```typescript
<Route path="sources" element={<SourcesScreen />} />
```

- [ ] **Step 6: Verify manually**

Run: `npm run dev`, open `/sources`. Expected: domain select defaults to `rtb`, dropping a `.pdf`/`.docx`/`.txt` file (or clicking to browse and picking one) triggers the mocked upload, shows a success toast, and the new document appears at the top of the list with an `INGESTED` status chip. Try uploading a `.exe`-renamed file (or any disallowed extension) — expect the inline client-side rejection message before any network request fires (check the Network tab shows no request).

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/screens/Sources src/utils src/App.tsx`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/utils/formatRelativeTime.ts src/screens/Sources/UploadPanel.tsx src/screens/Sources/DocumentList.tsx src/screens/Sources/SourcesScreen.tsx src/App.tsx
git commit -m "feat: add Sources screen document upload and document list"
```

---

### Task 25: Sources screen — GitLab extract-first preview, ingest, and runs list

**Files:**
- Create: `src/utils/parseGitlabUrl.ts`, `src/screens/Sources/GitLabIngest.tsx`, `src/screens/Sources/RunsList.tsx`
- Modify: `src/screens/Sources/SourcesScreen.tsx`

**Interfaces:**
- Consumes: `useExtractPreview`/`useIngest`/`useRuns` (Task 9), `TextInput` (Task 12), `JsonViewer` (Task 14), `EvidenceBlock` (Task 18), `MetaBadge` (Task 13), `formatRelativeTime` (Task 24).
- Produces: `parseGitlabUrl(url): { group: string; repo: string; branch: string; path: string } | null`, `GitLabIngest`, `RunsList` — both mounted inside `SourcesScreen`.

- [ ] **Step 1: Client-side GitLab URL parser**

Create `src/utils/parseGitlabUrl.ts`, matching the format documented in `frontend.md` (`https://gitlab.nomura.com/group/repo/-/blob/branch/path/to/file`):
```typescript
export interface ParsedGitlabUrl {
  group: string;
  repo: string;
  branch: string;
  path: string;
}

const GITLAB_URL_RE = /^https:\/\/[^/]+\/([^/]+)\/([^/]+)\/-\/blob\/([^/]+)\/(.+)$/;

export function parseGitlabUrl(url: string): ParsedGitlabUrl | null {
  const match = GITLAB_URL_RE.exec(url.trim());
  if (!match) return null;
  const [, group, repo, branch, path] = match;
  return { group, repo, branch, path };
}
```

- [ ] **Step 2: GitLab ingest panel with extract-first preview**

Create `src/screens/Sources/GitLabIngest.tsx`:
```typescript
import { useState } from "react";
import { useExtractPreview } from "../../hooks/useExtractPreview";
import { useIngest } from "../../hooks/useIngest";
import { useToast } from "../../context/ToastContext";
import { TextInput } from "../../components/primitives/TextInput";
import { Toggle } from "../../components/primitives/Toggle";
import { Button } from "../../components/primitives/Button";
import { MetaBadge } from "../../components/primitives/MetaBadge";
import { EvidenceBlock } from "../../components/signature/EvidenceBlock";
import { JsonViewer } from "../../components/signature/JsonViewer";
import { parseGitlabUrl } from "../../utils/parseGitlabUrl";
import { ApiClientError } from "../../api/client";

interface GitLabIngestProps {
  onIngested: () => void;
}

export function GitLabIngest({ onIngested }: GitLabIngestProps) {
  const [url, setUrl] = useState("");
  const [keyOnly, setKeyOnly] = useState(false);
  const extract = useExtractPreview();
  const ingest = useIngest();
  const { showToast } = useToast();

  const parsed = parseGitlabUrl(url);

  async function handlePreview() {
    if (!parsed) return;
    try {
      await extract.run({ url, branch: parsed.branch, key_only: keyOnly });
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Extract failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  async function handleIngest() {
    if (!parsed) return;
    try {
      await ingest.run({ url, branch: parsed.branch, key_only: keyOnly });
      showToast({ kind: "success", message: `Ingested ${parsed.path}.` });
      onIngested();
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Ingest failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-md">
      <TextInput
        id="gitlab-url"
        label="GitLab file URL"
        mono
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://gitlab.nomura.com/group/repo/-/blob/master/src/trade_handler.py"
        error={url.length > 0 && !parsed ? "Cannot parse GitLab URL. Expected: .../group/repo/-/blob/branch/path" : undefined}
      />
      {parsed && (
        <p className="text-mono-code-sm font-mono font-mono-noliga text-stone">
          {parsed.group}/{parsed.repo} · {parsed.branch} · {parsed.path}
        </p>
      )}
      <Toggle id="gitlab-key-only" checked={keyOnly} onChange={setKeyOnly} label="Key calculations only" />
      <div className="flex gap-sm">
        <Button variant="outline" onClick={handlePreview} disabled={!parsed} loading={extract.status === "loading"}>
          Preview extract
        </Button>
        <Button variant="primary" onClick={handleIngest} disabled={!extract.data} loading={ingest.status === "loading"}>
          Ingest
        </Button>
      </div>

      {extract.data && (
        <EvidenceBlock>
          <div className="flex flex-col gap-sm">
            <p className="text-body-sm text-mute">
              {extract.data.chunk_count} chunks found, {extract.data.key_calculation_count} key calculations.
            </p>
            {extract.data.chunks.map((chunk) => (
              <div key={chunk.chunk_id} className="flex items-center gap-sm">
                <span className="font-mono font-mono-noliga text-mono-id text-ink flex-1 truncate">
                  {chunk.qualified_name}
                </span>
                {chunk.is_key_calculation && <MetaBadge label="KEY" />}
                <span className="text-caption text-stone">
                  {chunk.start_line}–{chunk.end_line}
                </span>
              </div>
            ))}
            <details>
              <summary className="text-label-sm text-accent hover:underline cursor-pointer">
                View raw JSON
              </summary>
              <div className="mt-sm">
                <JsonViewer data={extract.data} />
              </div>
            </details>
          </div>
        </EvidenceBlock>
      )}
    </div>
  );
}
```
`EvidenceBlock` and `JsonViewer` here satisfy DESIGN.md's two explicit call-outs for those components — "a bordered region inside the Ledger" applies to any bordered evidence surface, and json-viewer is named for exactly "the error drawer and the extract preview" in its own *Code Display* entry.

- [ ] **Step 3: Runs list**

Create `src/screens/Sources/RunsList.tsx`:
```typescript
import type { CodeRun } from "../../types/domain";
import { MetaBadge } from "../../components/primitives/MetaBadge";
import { EmptyState } from "../../components/signature/EmptyState";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

function parseRunTimestamp(createdAt: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/.exec(createdAt);
  if (!m) return createdAt;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

export function RunsList({ runs }: { runs: CodeRun[] }) {
  if (runs.length === 0) {
    return <EmptyState title="No code runs yet" description="Ingest a GitLab file above to create one." />;
  }

  return (
    <div className="border border-hairline rounded-lg overflow-hidden">
      {runs.map((run) => {
        const { relative, absolute } = formatRelativeTime(parseRunTimestamp(run.created_at));
        return (
          <div key={run.run_id} className="flex items-center gap-md px-lg py-md border-b border-hairline last:border-b-0">
            <div className="flex-1 min-w-0">
              <p className="font-mono font-mono-noliga text-mono-id text-ink truncate">{run.run_id}</p>
              <p className="text-body-sm text-mute truncate">{run.file_path}</p>
            </div>
            <span className="text-caption text-stone">{run.facts_total} facts</span>
            <span className="text-caption text-stone">{run.key_calculation_count} key</span>
            {run.llm_refined ? (
              <MetaBadge label="LLM REFINED" />
            ) : (
              <MetaBadge label={run.llm_skip_reason ?? "LLM SKIPPED"} tooltip={run.llm_skip_reason ?? undefined} />
            )}
            <time dateTime={parseRunTimestamp(run.created_at)} title={absolute} className="text-caption text-stone">
              {relative}
            </time>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Append the GitLab section to SourcesScreen**

Modify `src/screens/Sources/SourcesScreen.tsx` to add the `useRuns` hook and render `GitLabIngest` + `RunsList` after the documents section:
```typescript
import { useDomains } from "../../hooks/useDomains";
import { useDocuments } from "../../hooks/useDocuments";
import { useRuns } from "../../hooks/useRuns";
import { UploadPanel } from "./UploadPanel";
import { DocumentList } from "./DocumentList";
import { GitLabIngest } from "./GitLabIngest";
import { RunsList } from "./RunsList";

export function SourcesScreen() {
  const domainsQuery = useDomains();
  const documentsQuery = useDocuments();
  const runsQuery = useRuns();

  return (
    <div className="max-w-[960px] mx-auto p-xl flex flex-col gap-xxl">
      <div>
        <h1 className="text-title-xl text-ink mb-lg">Sources</h1>
        <UploadPanel onUploaded={documentsQuery.refresh} />
      </div>
      <div>
        <h2 className="text-title-md text-ink mb-lg">Uploaded documents</h2>
        <DocumentList
          documents={documentsQuery.data?.documents ?? []}
          loading={documentsQuery.status === "loading" || documentsQuery.status === "idle"}
          domains={domainsQuery.data?.domains ?? []}
        />
      </div>
      <div>
        <h2 className="text-title-md text-ink mb-lg">Ingest code from GitLab</h2>
        <GitLabIngest onIngested={runsQuery.refresh} />
      </div>
      <div>
        <h2 className="text-title-md text-ink mb-lg">Code runs</h2>
        <RunsList runs={runsQuery.data?.runs ?? []} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, open `/sources`. Paste `https://gitlab.nomura.com/group/repo/-/blob/master/src/trade_handler.py` into the GitLab URL field — expect the parsed preview line (`group/repo · master · src/trade_handler.py`) to appear immediately, client-side, with no network request. Click **Preview extract** — expect the 2-chunk fixture to render with `compute_margin` tagged `KEY`. Click **Ingest** — expect a success toast and the runs list to grow by one entry. Paste a malformed URL (e.g. `https://example.com/not-gitlab`) — expect the inline parse error and both buttons disabled, with no request fired.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/screens/Sources src/utils`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/utils/parseGitlabUrl.ts src/screens/Sources/GitLabIngest.tsx src/screens/Sources/RunsList.tsx src/screens/Sources/SourcesScreen.tsx
git commit -m "feat: add GitLab extract-first preview, ingest, and runs list to Sources screen"
```

---

### Task 26: Ask screen

**Files:**
- Create: `src/screens/Ask/SourceCard.tsx`, `src/screens/Ask/AskScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useDomains` (Task 9), `useAsk` (Task 9), `SelectField`/`SegmentedControl` (Task 12), `EmptyState`/`Skeleton` (Task 14), `AskSource`/`PromptType` types (Task 4).
- Produces: `AskScreen` mounted at `/ask`.

- [ ] **Step 1: Source card**

Create `src/screens/Ask/SourceCard.tsx`:
```typescript
import type { AskSource } from "../../types/domain";

export function SourceCard({ source }: { source: AskSource }) {
  const loc = source.source_location;
  return (
    <div className="bg-surface-raised border border-hairline rounded-lg p-lg flex flex-col gap-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono font-mono-noliga text-mono-id text-ink">{loc.document_name}</span>
        <span className="font-mono font-mono-noliga text-mono-id text-stone tabular-nums">
          chunk {loc.chunk_index} · sim {loc.similarity_score.toFixed(2)}
        </span>
      </div>
      <p className="text-body-md text-body">{loc.context}</p>
      {loc.url && (
        <a href={loc.url} target="_blank" rel="noreferrer" className="text-label-sm text-accent hover:underline">
          Open source
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Ask screen**

Create `src/screens/Ask/AskScreen.tsx`:
```typescript
import { useState } from "react";
import { useDomains } from "../../hooks/useDomains";
import { useAsk } from "../../hooks/useAsk";
import { useToast } from "../../context/ToastContext";
import { SelectField } from "../../components/primitives/SelectField";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { Button } from "../../components/primitives/Button";
import { EmptyState } from "../../components/signature/EmptyState";
import { Skeleton } from "../../components/signature/Skeleton";
import { SourceCard } from "./SourceCard";
import { ApiClientError } from "../../api/client";
import type { PromptType, SearchProfile } from "../../types/domain";

const PROMPT_TYPES: PromptType[] = [
  "default", "classification", "analysis", "audit", "business", "rtb", "user", "development",
];

export function AskScreen() {
  const domainsQuery = useDomains();
  const ask = useAsk();
  const { showToast } = useToast();
  const [question, setQuestion] = useState("");
  const [domain, setDomain] = useState("");
  const [promptType, setPromptType] = useState<PromptType>("default");
  const [searchProfile, setSearchProfile] = useState<SearchProfile>("balanced");

  const activeDomain = domain || domainsQuery.data?.default_domain || "";

  async function handleAsk() {
    try {
      await ask.run({ question, domain: activeDomain, prompt_type: promptType, search_profile: searchProfile });
    } catch (err) {
      showToast({
        kind: "error",
        message: err instanceof ApiClientError ? err.message : "Question failed",
        detail: err instanceof ApiClientError ? err.detail : undefined,
      });
    }
  }

  return (
    <div className="max-w-[960px] mx-auto p-xl flex flex-col gap-xxl">
      <h1 className="text-title-xl text-ink">Ask</h1>

      <div className="flex flex-col gap-md">
        <label htmlFor="ask-question" className="text-label-md text-mute">
          Question
        </label>
        <textarea
          id="ask-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          placeholder="What is the expected risk weighting approach for SBL positions?"
          className="rounded-md border border-hairline-strong bg-canvas text-body-md p-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        />
        <div className="flex flex-wrap items-end gap-md">
          <SelectField
            id="ask-domain"
            label="Domain"
            value={activeDomain as never}
            options={(domainsQuery.data?.domains ?? []).map((d) => ({ value: d as never, label: d }))}
            onChange={(v) => setDomain(v)}
          />
          <SelectField
            id="ask-prompt-type"
            label="Prompt type"
            value={promptType as never}
            options={PROMPT_TYPES.map((p) => ({ value: p as never, label: p }))}
            onChange={(v) => setPromptType(v as PromptType)}
          />
          <div className="flex flex-col gap-xxs">
            <span className="text-label-md text-mute">Search profile</span>
            <SegmentedControl
              aria-label="Search profile"
              value={searchProfile}
              onChange={setSearchProfile}
              segments={[
                { value: "precise", label: "Precise" },
                { value: "balanced", label: "Balanced" },
                { value: "comprehensive", label: "Comprehensive" },
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={handleAsk}
            loading={ask.status === "loading"}
            disabled={question.trim().length === 0}
            className="ml-auto"
          >
            Ask
          </Button>
        </div>
      </div>

      {ask.status === "loading" && (
        <div className="flex flex-col gap-sm">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {ask.data && (
        <div className="flex flex-col gap-lg">
          <p className="text-body-lg text-body max-w-[72ch]">{ask.data.answer}</p>
          <div className="flex flex-col gap-md">
            {ask.data.sources.map((s, i) => (
              <SourceCard key={i} source={s} />
            ))}
          </div>
        </div>
      )}

      {!ask.data && ask.status !== "loading" && (
        <EmptyState title="No question asked yet" description="Ask a question above to search the document corpus." />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Mount the screen**

Modify `src/App.tsx` — import `AskScreen` and replace:
```typescript
<Route path="ask" element={<StubScreen name="Ask" />} />
```
with:
```typescript
<Route path="ask" element={<AskScreen />} />
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`, open `/ask`, type a question, choose `rtb` domain, click **Ask**. Expected: the mocked `documents/query` handler is not yet registered by this plan — add it now as part of this task's verification requirement (see Step 5) before testing, otherwise the request 404s against MSW's `onUnhandledRequest: "bypass"` and falls through to a real network call that fails. See Step 5.

- [ ] **Step 5: Add the missing `documents/query` MSW handler**

This endpoint was not included in Task 7's `simpleHandlers` (an omission caught here). Modify `src/mocks/fixtures/domains.ts` is not needed; instead create `src/mocks/fixtures/ask.ts`:
```typescript
import type { AskResponse } from "../../types/domain";

export const askFixture: AskResponse = {
  question: "",
  answer:
    "The policy requires a minimum risk weight floor of 15% for RTB positions, with a duration-weighted aggregation methodology across all tenor buckets.",
  sources: [
    {
      source_location: {
        document_name: "RTB_Model_Policy_v3.pdf",
        chunk_index: 43,
        document_type: "pdf",
        match_type: "semantic",
        similarity_score: 0.89,
        context: "For securities borrowing/lending positions, the risk weight floor shall be 15% of gross exposure.",
        url: null,
      },
    },
  ],
};
```

Modify `src/mocks/handlers/simple.ts` — add the import and one handler (append to the exported array):
```typescript
import { askFixture } from "../fixtures/ask";
```
```typescript
  http.post(`${BASE}/api/v1/documents/query`, async ({ request }) => {
    const body = (await request.json()) as { question: string };
    return HttpResponse.json({ ...askFixture, question: body.question });
  }),
```

- [ ] **Step 6: Re-verify manually**

Run: `npm run dev`, repeat Step 4. Expected: after clicking **Ask**, the answer paragraph and one source card (`RTB_Model_Policy_v3.pdf`, chunk 43, similarity 0.89) render.

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/screens/Ask src/mocks src/App.tsx`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/screens/Ask src/mocks/fixtures/ask.ts src/mocks/handlers/simple.ts src/App.tsx
git commit -m "feat: add Ask screen and missing documents/query mock handler"
```

---

### Task 27: History screen — localStorage store, replay, and export

**Files:**
- Create: `src/history/store.ts`, `src/screens/History/HistoryScreen.tsx`
- Modify: `src/screens/Compare/CompareScreen.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `TriageList` (Task 20), `CompareLedger` (Task 19), `DiscrepancyStack`/`buildLedgerCode` (Task 23), `sortFacts` (Task 22), `Button` (Task 11), `formatRelativeTime` (Task 24).
- Produces: `recordHistory`, `getHistory`, `clearHistory`, `exportEntryAsJson`, `exportEntryAsCsv`, `HistoryEntry` type — `recordHistory` is called from `CompareScreen` on every successful compare; everything else is consumed only by `HistoryScreen`.

- [ ] **Step 1: History store**

Create `src/history/store.ts`:
```typescript
import type { CompareResponse, SearchProfile } from "../types/domain";

const STORAGE_KEY = "mvc.history";
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  id: string;
  response: CompareResponse;
  search_profile: SearchProfile;
  key_only: boolean;
  saved_at: string;
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function recordHistory(response: CompareResponse, searchProfile: SearchProfile, keyOnly: boolean): void {
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    response,
    search_profile: searchProfile,
    key_only: keyOnly,
    saved_at: new Date().toISOString(),
  };
  const next = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportEntryAsJson(entry: HistoryEntry): void {
  const blob = new Blob([JSON.stringify(entry.response, null, 2)], { type: "application/json" });
  downloadBlob(blob, `${entry.response.run_id}_${entry.id}.json`);
}

export function exportEntryAsCsv(entry: HistoryEntry): void {
  const header = "fact_id,qualified_name,fact_type,verdict,confidence,reasoning\n";
  const rows = entry.response.verdicts
    .map((v) =>
      [v.fact_id, v.qualified_name, v.fact_type, v.verdict, String(v.confidence), v.reasoning.replace(/"/g, '""')]
        .map((cell) => `"${cell}"`)
        .join(",")
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  downloadBlob(blob, `${entry.response.run_id}_${entry.id}.csv`);
}
```

- [ ] **Step 2: Record every successful compare**

Modify `src/screens/Compare/CompareScreen.tsx` — add the import:
```typescript
import { recordHistory } from "../../history/store";
```
and inside `handleCompare`'s try block, immediately after `setActiveRun(...)`:
```typescript
      recordHistory(result, state.searchProfile, state.keyOnly);
```

- [ ] **Step 3: History screen**

Create `src/screens/History/HistoryScreen.tsx`:
```typescript
import { useState } from "react";
import { getHistory, clearHistory, exportEntryAsJson, exportEntryAsCsv, type HistoryEntry } from "../../history/store";
import { Button } from "../../components/primitives/Button";
import { EmptyState } from "../../components/signature/EmptyState";
import { TriageList } from "../../components/signature/TriageList";
import { CompareLedger } from "../../components/signature/CompareLedger";
import { DiscrepancyStack } from "../Compare/DiscrepancyStack";
import { sortFacts } from "../Compare/sort";
import { buildLedgerCode } from "../Compare/ledgerCode";
import { formatRelativeTime } from "../../utils/formatRelativeTime";

export function HistoryScreen() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(entries[0]?.id ?? null);
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) ?? null;
  const visibleFacts = selectedEntry
    ? sortFacts(
        selectedEntry.response.verdicts.filter((v) => {
          const q = searchValue.toLowerCase();
          return (
            q === "" || v.qualified_name.toLowerCase().includes(q) || v.fact_id.toLowerCase().includes(q)
          );
        })
      )
    : [];
  const selectedFact = selectedEntry?.response.verdicts.find((v) => v.fact_id === selectedFactId) ?? null;

  function handleClear() {
    if (!window.confirm("Clear all local compare history? This cannot be undone.")) return;
    clearHistory();
    setEntries([]);
    setSelectedEntryId(null);
  }

  if (entries.length === 0) {
    return (
      <div className="p-xl">
        <EmptyState title="No compare history yet" description="Run a compare on the Compare screen to save it here." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-lg border-b border-hairline flex items-center justify-between">
        <div>
          <h1 className="text-title-md text-ink">History</h1>
          <p className="text-body-sm text-mute">
            Stored only in this browser — the API has no compare-artifact list endpoint.
          </p>
        </div>
        <Button variant="danger" onClick={handleClear}>
          Clear history
        </Button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col min-[1024px]:flex-row">
        <div className="w-full min-[1024px]:w-[320px] shrink-0 border-r border-hairline overflow-auto">
          {entries.map((entry) => {
            const { relative, absolute } = formatRelativeTime(entry.saved_at);
            const active = entry.id === selectedEntryId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setSelectedEntryId(entry.id);
                  setSelectedFactId(entry.response.verdicts[0]?.fact_id ?? null);
                }}
                className={`w-full text-left px-lg py-md border-b border-hairline ${active ? "bg-accent-tint" : "hover:bg-surface"}`}
              >
                <p className="font-mono font-mono-noliga text-mono-id text-ink">{entry.response.run_id}</p>
                <p className="text-body-sm text-mute">
                  {entry.response.domain} · {entry.response.summary.total} facts
                </p>
                <time dateTime={entry.saved_at} title={absolute} className="text-caption text-stone">
                  {relative}
                </time>
              </button>
            );
          })}
        </div>
        <div className="flex-1 min-h-0 flex flex-col min-[1024px]:flex-row">
          {selectedEntry && (
            <>
              <div className="flex items-center gap-sm px-lg py-sm border-b border-hairline min-[1024px]:hidden" />
              <TriageList
                facts={visibleFacts}
                selectedFactId={selectedFactId}
                onSelectFact={setSelectedFactId}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
              />
              <div className="flex-1 min-h-0 flex flex-col overflow-auto">
                <div className="flex justify-end gap-sm p-md border-b border-hairline">
                  <Button variant="outline" onClick={() => exportEntryAsJson(selectedEntry)}>
                    Export JSON
                  </Button>
                  <Button variant="outline" onClick={() => exportEntryAsCsv(selectedEntry)}>
                    Export CSV
                  </Button>
                </div>
                {selectedFact ? (
                  <>
                    <CompareLedger fact={selectedFact} code={buildLedgerCode(selectedFact, "")} />
                    <DiscrepancyStack fact={selectedFact} onLocationClick={() => {}} />
                  </>
                ) : (
                  <EmptyState title="No fact selected" description="Choose a row from the triage list." />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Mount the screen**

Modify `src/App.tsx` — import `HistoryScreen` and replace:
```typescript
<Route path="history" element={<StubScreen name="History" />} />
```
with:
```typescript
<Route path="history" element={<HistoryScreen />} />
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, run at least two compares from `/`, then open `/history`. Expected: both runs listed newest-first with relative timestamps; selecting one loads its triage list and Ledger (identical visual treatment to the Compare screen); **Export JSON** downloads a file containing the full `CompareResponse`; **Export CSV** downloads a file with one row per fact; **Clear history** prompts for confirmation and, once confirmed, empties the list and shows the empty state.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/history src/screens/History src/screens/Compare src/App.tsx`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/history/store.ts src/screens/History/HistoryScreen.tsx src/screens/Compare/CompareScreen.tsx src/App.tsx
git commit -m "feat: add History screen with localStorage-backed replay and JSON/CSV export"
```

---

### Task 28: Settings screen — theme, API configuration, and backend health

**Files:**
- Create: `src/api/config.ts`, `src/screens/Settings/SettingsScreen.tsx`
- Modify: `src/api/client.ts`, `src/App.tsx`

**Interfaces:**
- Consumes: `useTheme` (Task 10), `useHealth` (Task 9), `SegmentedControl`/`TextInput` (Task 12), `HealthDot` (Task 14).
- Produces: `getApiBaseUrl()`, `setApiBaseUrl()`, `getApiTimeoutMs()`, `setApiTimeoutMs()` — consumed by `src/api/client.ts`'s `request()` function from this point forward (replacing the frozen module-level constants Task 5 originally wrote).

- [ ] **Step 1: Runtime-editable API configuration**

Create `src/api/config.ts`:
```typescript
const BASE_URL_KEY = "mvc.apiBaseUrl";
const TIMEOUT_KEY = "mvc.apiTimeoutMs";

export function getApiBaseUrl(): string {
  return localStorage.getItem(BASE_URL_KEY) ?? (import.meta.env.VITE_MVC_API_BASE_URL as string);
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(BASE_URL_KEY, url);
}

export function getApiTimeoutMs(): number {
  const stored = localStorage.getItem(TIMEOUT_KEY);
  return stored ? Number(stored) : Number(import.meta.env.VITE_MVC_API_TIMEOUT_MS ?? 60000);
}

export function setApiTimeoutMs(ms: number): void {
  localStorage.setItem(TIMEOUT_KEY, String(ms));
}
```

- [ ] **Step 2: Point the fetch wrapper at the runtime config**

Modify `src/api/client.ts` — remove the module-level `const BASE_URL = ...` and `const TIMEOUT_MS = ...` lines from Task 5, add the import, and read both values inside `request()` on every call so a Settings change takes effect on the next request without a page reload:
```typescript
import { getApiBaseUrl, getApiTimeoutMs } from "./config";
```
```typescript
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const timeoutMs = getApiTimeoutMs();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers:
        init?.body instanceof FormData
          ? init?.headers
          : { "Content-Type": "application/json", ...init?.headers },
    });
    // ...unchanged from Task 5 below this line, except every remaining
    // reference to TIMEOUT_MS in the catch block becomes timeoutMs.
```
Apply this rename consistently: the `AbortError` branch's message template (`` `Request timed out after ${TIMEOUT_MS}ms` ``) becomes `` `Request timed out after ${timeoutMs}ms` ``.

- [ ] **Step 3: Settings screen**

Create `src/screens/Settings/SettingsScreen.tsx`:
```typescript
import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useHealth } from "../../hooks/useHealth";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { TextInput } from "../../components/primitives/TextInput";
import { getApiBaseUrl, setApiBaseUrl, getApiTimeoutMs, setApiTimeoutMs } from "../../api/config";

const MOCKS_ENABLED = import.meta.env.VITE_MVC_USE_MOCKS === "true";

export function SettingsScreen() {
  const { mode, setMode } = useTheme();
  const health = useHealth();
  const [baseUrl, setBaseUrlState] = useState(getApiBaseUrl());
  const [timeoutMs, setTimeoutState] = useState(String(getApiTimeoutMs()));
  const [saved, setSaved] = useState(false);

  function commitBaseUrl() {
    // `getApiBaseUrl()` only falls back to the env default on a missing localStorage key
    // (`??`, not a truthiness check) — persisting an empty string here would make every
    // future request resolve to a relative path against the frontend's own origin, silently
    // breaking the whole app until the user retypes a URL. Guard the same way `commitTimeout`
    // already guards against an invalid number: no-op and keep the last valid persisted value.
    if (baseUrl.trim().length === 0) return;
    setApiBaseUrl(baseUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function commitTimeout() {
    const parsed = Number(timeoutMs);
    if (!Number.isNaN(parsed) && parsed > 0) setApiTimeoutMs(parsed);
  }

  return (
    <div className="max-w-[960px] mx-auto p-xl flex flex-col gap-xxl">
      <h1 className="text-title-xl text-ink">Settings</h1>

      <section className="flex flex-col gap-md">
        <h2 className="text-title-md text-ink">Theme</h2>
        <SegmentedControl
          aria-label="Theme"
          value={mode}
          onChange={setMode}
          segments={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-title-md text-ink">API configuration</h2>
        {MOCKS_ENABLED && (
          <p className="text-body-sm text-mute">
            Mock data is enabled (<code className="inline-code font-mono font-mono-noliga">VITE_MVC_USE_MOCKS=true</code>).
            Changing the base URL below only takes effect once mocking is disabled.
          </p>
        )}
        <TextInput
          id="settings-base-url"
          label="API base URL"
          mono
          value={baseUrl}
          onChange={(e) => setBaseUrlState(e.target.value)}
          onBlur={commitBaseUrl}
        />
        {saved && <p className="text-body-sm text-verdict-aligned">Saved.</p>}
        <TextInput
          id="settings-timeout"
          label="Request timeout (ms)"
          mono
          value={timeoutMs}
          onChange={(e) => setTimeoutState(e.target.value)}
          onBlur={commitTimeout}
        />
      </section>

      <section className="flex flex-col gap-md">
        <h2 className="text-title-md text-ink">Backend health</h2>
        <p className="text-body-md text-ink">
          Status:{" "}
          {health.status === "success" && health.data?.status === "ok"
            ? "Reachable"
            : health.status === "error"
              ? "Unreachable"
              : "Checking…"}
        </p>
        <p className="text-body-sm text-mute font-mono font-mono-noliga">{getApiBaseUrl()}</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Mount the screen**

Modify `src/App.tsx` — import `SettingsScreen` and replace:
```typescript
<Route path="settings" element={<StubScreen name="Settings" />} />
```
with:
```typescript
<Route path="settings" element={<SettingsScreen />} />
```
At this point `StubScreen` has no remaining callers — remove its function definition and the now-unused `EmptyState` import from `App.tsx` if `eslint` flags them.

- [ ] **Step 5: Verify manually**

Run: `npm run dev`, open `/settings`. Expected: theme segmented control matches the current theme and switching it updates the canvas colour app-wide immediately; the API base URL field shows `http://localhost:8000` (from `.env.development`), editing it and blurring shows "Saved."; backend health shows "Reachable" once the mocked health check resolves.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint src/api src/screens/Settings src/App.tsx`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/api/config.ts src/api/client.ts src/screens/Settings/SettingsScreen.tsx src/App.tsx
git commit -m "feat: add Settings screen with runtime-editable API configuration and health status"
```

---

### Task 29: Responsive polish, shortcut overlay, and final verification pass

**Files:**
- Create: `src/layout/ShortcutOverlay.tsx`
- Modify: `src/layout/NavRail.tsx`, `src/layout/AppLayout.tsx`, `src/layout/TopBar.tsx`, `src/screens/Compare/ControlBar.tsx`, `src/components/signature/StatCard.tsx`, `src/screens/Compare/SummaryStrip.tsx`

**Interfaces:**
- Consumes: everything built in Tasks 1–28.
- Produces: the completed MVP. No further tasks depend on this one.

- [ ] **Step 1: Keyboard shortcut overlay**

Create `src/layout/ShortcutOverlay.tsx`:
```typescript
const SHORTCUTS: Array<[string, string]> = [
  ["j / k or ↓ / ↑", "Move through the triage list"],
  ["Enter", "Load the focused fact into the Ledger"],
  ["1 2 3 4", "Filter to Misaligned / Partial / Unrelated / Aligned"],
  ["0", "Clear verdict filters"],
  ["/", "Focus the triage search"],
  ["c", "Copy the focused fact's fact_id"],
  ["Esc", "Close the drawer, clear search, or blur"],
  ["?", "Shortcut overlay"],
];

export function ShortcutOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-overlay z-50 flex items-center justify-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-raised border border-hairline rounded-lg shadow-pop p-xl max-w-md w-full"
      >
        <h2 className="text-title-sm text-ink mb-lg">Keyboard shortcuts</h2>
        <dl className="flex flex-col gap-sm">
          {SHORTCUTS.map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-md">
              <dt className="font-mono font-mono-noliga text-mono-code-sm bg-surface-sunken rounded-xs px-sm py-xxs">
                {key}
              </dt>
              <dd className="text-body-sm text-mute text-right">{desc}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the overlay into AppLayout and TopBar**

Modify `src/layout/AppLayout.tsx`:
```typescript
import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { TopBar } from "./TopBar";
import { NavRail } from "./NavRail";
import { ToastViewport } from "./Toast";
import { ShortcutOverlay } from "./ShortcutOverlay";

export function AppLayout() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
      if (e.key === "?" && !isTyping) setShortcutsOpen(true);
      if (e.key === "Escape") setShortcutsOpen(false);
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <TopBar onOpenShortcuts={() => setShortcutsOpen(true)} />
      <div className="flex-1 flex min-h-0">
        <NavRail />
        <main className="flex-1 min-w-0 overflow-auto max-md:pb-14">
          <Outlet />
        </main>
      </div>
      <ToastViewport />
      <ShortcutOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
```

Modify `src/layout/TopBar.tsx` — accept the new prop and use it on the existing `?` button:
```typescript
export function TopBar({ onOpenShortcuts }: { onOpenShortcuts: () => void }) {
```
(add this parameter to the existing function signature) and change the last `IconButton`:
```typescript
        <IconButton aria-label="Keyboard shortcuts" onClick={onOpenShortcuts}>
          ?
        </IconButton>
```

- [ ] **Step 3: Nav rail becomes a bottom bar below 768px, and expands to 200px on hover/focus at desktop widths**

DESIGN.md's *App Shell* entry is specific: "Sidebar rail: 72px, icon + `{typography.label-sm}` label stacked, expands to 200px on hover/focus with labels inline." The resting state already shows the label (stacked under the icon, which is what Task 15 built); this step adds the hover/focus expansion to 200px with the icon and label laid out inline instead of stacked.

Modify `src/layout/NavRail.tsx`:
```typescript
import { NavLink } from "react-router";

const ITEMS = [
  { to: "/", label: "Compare", icon: "⇄" },
  { to: "/sources", label: "Sources", icon: "▤" },
  { to: "/ask", label: "Ask", icon: "?" },
  { to: "/history", label: "History", icon: "↺" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function NavRail() {
  return (
    <nav className="group w-[72px] hover:w-[200px] focus-within:w-[200px] transition-[width] duration-base max-md:!w-full max-md:h-14 max-md:fixed max-md:bottom-0 max-md:left-0 max-md:z-30 max-md:flex-row max-md:justify-around max-md:border-t max-md:border-r-0 shrink-0 bg-surface border-r border-hairline-strong flex flex-col py-md max-md:py-0 overflow-hidden">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `h-14 flex flex-col group-hover:flex-row group-focus-within:flex-row items-center justify-center group-hover:justify-start group-focus-within:justify-start gap-xxs group-hover:gap-sm group-focus-within:gap-sm group-hover:px-lg group-focus-within:px-lg border-l-2 max-md:border-l-0 max-md:border-t-2 ${
              isActive ? "border-accent text-ink" : "border-transparent text-mute"
            } hover:text-ink`
          }
        >
          <span aria-hidden="true" className="text-lg leading-none shrink-0">
            {item.icon}
          </span>
          <span className="text-label-sm max-md:hidden whitespace-nowrap">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
```
`max-md:!w-full` uses Tailwind's `!important` escape so the mobile width rule always wins over the `hover:`/`focus-within:` width rules regardless of source order — without it, a hovered nav item below 768px could get stuck at 200px instead of full-width.

- [ ] **Step 4: Control bar collapses to a bottom sheet below 768px**

Modify `src/screens/Compare/ControlBar.tsx` — factor the field set into `ControlBarFields` and render it inline on `md:` and up, or inside a bottom sheet triggered by a **Set up compare** button below `md`:
```typescript
import { useState } from "react";
import type { CodeRun, SearchProfile, Verdict } from "../../types/domain";
import { SelectField } from "../../components/primitives/SelectField";
import { Toggle } from "../../components/primitives/Toggle";
import { SegmentedControl } from "../../components/primitives/SegmentedControl";
import { Button } from "../../components/primitives/Button";
import { FactMultiselect } from "../../components/signature/FactMultiselect";

interface FactOption {
  factId: string;
  qualifiedName: string;
  verdict?: Verdict;
}

interface ControlBarProps {
  domains: string[];
  domain: string;
  onDomainChange: (d: string) => void;
  runs: CodeRun[];
  runId: string;
  onRunIdChange: (id: string) => void;
  keyOnly: boolean;
  onKeyOnlyChange: (v: boolean) => void;
  searchProfile: SearchProfile;
  onSearchProfileChange: (p: SearchProfile) => void;
  factOptions: FactOption[];
  factIds: string[] | null;
  onFactIdsChange: (ids: string[] | null) => void;
  onCompare: () => void;
  comparing: boolean;
  collapsed: boolean;
  onEdit: () => void;
}

function ControlBarFields(props: ControlBarProps) {
  const selectedRun = props.runs.find((r) => r.run_id === props.runId);
  const keyCount = selectedRun?.key_calculation_count ?? 0;
  const totalCount = selectedRun?.facts_total ?? 0;

  return (
    <>
      <SelectField
        id="compare-domain"
        label="Domain"
        value={props.domain as never}
        placeholder="Select domain"
        options={props.domains.map((d) => ({ value: d as never, label: d }))}
        onChange={(v) => props.onDomainChange(v)}
      />
      <SelectField
        id="compare-run"
        label="Run"
        value={props.runId as never}
        placeholder="Select run"
        options={props.runs.map((r) => ({
          value: r.run_id as never,
          label: `${r.run_id} — ${r.file_path} (${r.facts_total} facts${r.llm_refined ? ", llm-refined" : ""})`,
        }))}
        onChange={(v) => props.onRunIdChange(v)}
      />
      <Toggle
        id="compare-key-only"
        checked={props.keyOnly}
        onChange={props.onKeyOnlyChange}
        label={`Key calculations only (${keyCount} of ${totalCount})`}
      />
      <div className="flex flex-col gap-xxs">
        <span className="text-label-md text-mute">Search profile</span>
        <SegmentedControl
          aria-label="Search profile"
          value={props.searchProfile}
          onChange={props.onSearchProfileChange}
          segments={[
            { value: "precise", label: "Precise" },
            { value: "balanced", label: "Balanced" },
            { value: "comprehensive", label: "Comprehensive" },
          ]}
        />
        <span className="text-caption text-mute max-w-[32ch]">
          Comprehensive searches more of the corpus and takes longer.
        </span>
      </div>
      {props.factOptions.length > 0 && (
        <FactMultiselect facts={props.factOptions} selected={props.factIds} onChange={props.onFactIdsChange} />
      )}
      <Button
        variant="primary"
        onClick={props.onCompare}
        loading={props.comparing}
        loadingLabel={`Comparing ${totalCount || "…"} facts…`}
        disabled={!props.domain || !props.runId}
        className="md:ml-auto"
      >
        Compare
      </Button>
    </>
  );
}

export function ControlBar(props: ControlBarProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  if (props.collapsed) {
    return (
      <div className="h-10 flex items-center gap-sm px-lg bg-surface border-b border-hairline">
        <span className="font-mono font-mono-noliga text-mono-id text-ink">
          {props.domain} · {props.runId} · {props.searchProfile}
          {props.keyOnly ? " · key only" : ""}
        </span>
        <Button variant="quiet" onClick={props.onEdit}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-surface border-b border-hairline">
      <div className="hidden md:flex flex-wrap items-end gap-md p-lg">
        <ControlBarFields {...props} />
      </div>
      <div className="md:hidden p-lg">
        <Button variant="outline" onClick={() => setMobileSheetOpen(true)} className="w-full">
          Set up compare
        </Button>
      </div>
      {mobileSheetOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation" onClick={() => setMobileSheetOpen(false)}>
          <div className="absolute inset-0 bg-overlay" />
          <div
            className="absolute inset-x-0 bottom-0 bg-surface-raised rounded-t-lg shadow-pop p-lg flex flex-col gap-md max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ControlBarFields
              {...props}
              onCompare={() => {
                props.onCompare();
                setMobileSheetOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Summary strip becomes a snap-scroll rail below 768px**

Modify `src/components/signature/StatCard.tsx` — widen the root button's className to add mobile-specific sizing (keep the `ACTIVE_BORDER` fix from Task 16 Step 1's correction):
```typescript
      className={`flex-1 max-md:shrink-0 max-md:w-36 max-md:snap-start h-[88px] flex flex-col justify-center gap-xxs px-lg rounded-lg border border-hairline text-left transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        active ? `${tint} border-b-2 ${ACTIVE_BORDER[statKey]}` : "bg-surface-raised"
      }`}
```

Modify `src/screens/Compare/SummaryStrip.tsx` — add snap classes to the container:
```typescript
    <div className="flex gap-md p-lg overflow-x-auto max-md:snap-x max-md:snap-mandatory">
```

- [ ] **Step 6: Full-project typecheck and lint**

Run: `npx tsc --noEmit && npx eslint .`
Expected: zero errors across the entire project — this is the first whole-repo check since Task 1; fix any cross-task drift (e.g. an import path that changed in a later task but wasn't updated everywhere) before proceeding.

- [ ] **Step 7: Manual verification walkthrough**

Run: `npm run dev`. Work through DESIGN.md's own Iteration Guide (step 7) test list, using the fixture built in Task 8, in **both** themes (toggle via Settings or the TopBar icon) and at **each** breakpoint (resize to ≥1600px, 1280–1599px, 1024–1279px, 768–1023px, and ≤767px):

1. Run a compare on `/` with the `market_risk_engine` run. Confirm the triage list sorts Misaligned → Partial → Unrelated → Aligned, then by descending confidence.
2. Select `CF-0007` (the six-discrepancy fact) — confirm all six `discrepancy-item`s render below the Ledger.
3. Select `CF-0021` (`rule_reference: null`) — confirm the Ledger's left column shows "No matching rule text was found for this fact." instead of crashing.
4. Select `CF-0030` (200-line snippet) — confirm the code block collapses at 24 lines behind a "Show all (200 lines)" control.
5. Select `CF-0035` (long `qualified_name`) — confirm it truncates from the left in the triage row (the class/method suffix stays visible) and displays in full in the Ledger.
6. At ≤900px width, confirm the Ledger's spine rotates to a horizontal band between stacked Rule/Code sections.
7. At ≤767px, confirm: the nav rail is a bottom bar, the control bar is a "Set up compare" button opening a bottom sheet, and the summary strip scrolls horizontally as a snap rail.
8. Confirm dark mode: toggle in Settings, reload the page, and verify there is no flash of the light canvas before the themed background paints.
9. Tab through the Compare screen with the keyboard only — confirm every interactive element shows a visible 2px accent focus ring, and that `j`/`k`/`1`-`4`/`0`/`/`/`Esc`/`?` all behave as documented.
10. Trigger an error path (e.g. use Settings to point the API base URL at an unreachable host with mocking off, or temporarily edit `src/mocks/handlers/compare.ts` to always 404) and confirm the error toast appears with a non-auto-dismissing card and a working **Details** disclosure.

Record any deviations found and fix them before considering the MVP complete. Known, already-documented limitations that are **not** bugs: the Ledger's code column falls back to a discrepancy's `code_location` string or the fact's `reasoning` text when no full snippet is available (Task 23's note — `frontend.md`'s `CompareResponse` does not embed `code_facts[].evidence.code_snippet` per verdict); and editing the API base URL in Settings has no effect while `VITE_MVC_USE_MOCKS=true` (Task 28's note).

- [ ] **Step 8: Commit**

```bash
git add src/layout/ShortcutOverlay.tsx src/layout/NavRail.tsx src/layout/AppLayout.tsx src/layout/TopBar.tsx src/screens/Compare/ControlBar.tsx src/components/signature/StatCard.tsx src/screens/Compare/SummaryStrip.tsx
git commit -m "feat: add keyboard shortcut overlay and responsive polish for nav rail, control bar, and summary strip"
```

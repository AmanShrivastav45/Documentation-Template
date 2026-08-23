# MVC Compare Frontend — Implementation Design

Status: Approved
Date: 2026-08-23

## Purpose

This document is the **technical implementation design** for the MVC Compare
frontend. It does not restate visual or UX decisions — those are fully
specified in [`DESIGN.md`](../../../../../Downloads/DESIGN.md) (design system:
colors, typography, layout, components, motion, accessibility, responsive
rules) and [`frontend.md`](../../frontend.md) (API contract: endpoints,
payload shapes, error format). Both are authoritative and referenced by name,
never paraphrased. This document covers only what those two leave open: the
technology choices, code architecture, and data strategy needed to build
against them.

## Scope

Full MVP in one implementation plan: all 5 screens (Compare, Sources, Ask,
History, Settings) and the complete component set from DESIGN.md's
*Components* section, per the scope defined in DESIGN.md's *Product Scope &
MVP Feature Set*. Explicitly out of scope: everything listed under DESIGN.md's
*Explicitly out of MVP* and *Known Gaps* sections (human verdict override,
run-to-run delta, PDF export, auth, a compare-artifact list endpoint, etc.).

## Tech Stack

Added to the existing Vite + React 19 + TypeScript scaffold:

- **Tailwind CSS** — utility classes generated from the design tokens (see
  *Theming* below), not a parallel design vocabulary.
- **react-router** — client-side routing for the 5 screens.
- **msw** (Mock Service Worker) — intercepts `fetch` in development to serve
  fixture data matching `frontend.md` schemas exactly.
- No state-management library, no data-fetching library, no test runner —
  per explicit decision, plain hooks/Context cover state, and verification is
  manual.

## Theming

Every DESIGN.md token becomes a CSS custom property in a single `tokens.css`,
redefined under `[data-theme="dark"]`, implementing DESIGN.md's *Theme Modes*
mechanics verbatim (steps 1–5, including the blocking inline theme-resolution
script in `index.html` to prevent flash-of-wrong-theme, and the
`<meta name="color-scheme">` tag).

`tailwind.config.js` maps `theme.extend` (colors, spacing, borderRadius,
fontFamily, fontSize) to those CSS variables, so utility classes are the
token names in kebab-case (`bg-canvas`, `text-verdict-misaligned`,
`rounded-lg`, `text-body-lg`). Dark mode changes are free — the CSS variable
value flips, not the class. No hex value is ever written outside
`tokens.css`, matching DESIGN.md's own rule ("never hard-code a hex in a
component").

Roboto (400/500/700) and Fira Code (400/500) are self-hosted WOFF2 subsets
with `font-display: swap`. Ligatures are disabled globally on
`.code-block, .fact-id, .operator-list, .inline-code` per the exact CSS block
in DESIGN.md's *Typography → Ligatures* section.

## Data Layer

The API client (`src/api/`) implements every endpoint in `frontend.md`'s
*Endpoint Contracts* section as if the backend is live: one function per
endpoint, the exact request/response shapes documented there, and
`normalizeApiError` implemented verbatim from `frontend.md`.

**Mocking strategy:** MSW intercepts these requests during development and
serves fixtures that match the documented schemas exactly, including the
edge cases DESIGN.md's *Iteration Guide* (step 7) calls for:

- A 37-fact compare response (the doc's own running example).
- A fact with six discrepancies.
- A fact with `rule_reference: null`.
- A fact with a 200-line code snippet (exercises the `code-block` "Show all"
  collapse).
- A `qualified_name` long enough to force left-truncation.
- Both a 401 GitLab-token error and a 422 domain error, to exercise the
  toast/error-normalizer path.

Switching to a live backend later requires no application code changes:
disable the MSW worker registration and point `VITE_MVC_API_BASE_URL` at the
real host. The application never branches on "is this mocked."

## State Pattern

Per-resource custom hooks (`useDomains`, `useRuns`, `useCompare`,
`useDocuments`, `useExtractPreview`, `useAsk`, `useHealth`) each own their own
`{data, status, error}` via `useReducer`, called directly from the screens
that need them. No global server-state cache.

Three small React Contexts hold cross-cutting client state:

- `ThemeContext` — resolved theme (`light|dark|system`), persisted to
  `localStorage` as `mvc.theme`.
- `RunContext` — the active run shown in the top bar's `context-chip`.
- `ToastContext` — the toast queue, feeding `{component.toast}`.

`localStorage`-backed compare history (DESIGN.md's *Known Gaps*: no
compare-artifact list endpoint exists) is a plain module under
`src/history/`, not a Context, since only the History screen and the
post-compare "save" action touch it.

## Routing

A layout route renders `TopBar` + `NavRail` + `<Outlet/>`. Five leaf routes
match the table in DESIGN.md's *Product Scope*: `/`, `/sources`, `/ask`,
`/history`, `/settings`.

## Component Layering

1. **Primitives** (`src/components/primitives/`) — `button-primary/outline/
   quiet/icon/danger`, `select-field`, `text-input`, `url-input`,
   `segmented-control`, `toggle`, `confidence-meter`, `verdict-chip`,
   `context-chip`, `status-chip`, `meta-badge`.
2. **Signature/composed** (`src/components/signature/`) — `compare-ledger`,
   `verdict-spine`, `triage-row`, `discrepancy-item`, `rule-quote`,
   `code-block`, `inline-code`, `json-viewer`, `stat-card`, `evidence-block`,
   `empty-state`, `skeleton`, `health-dot`, `progress-compare`,
   `fact-multiselect`, `file-drop`.
3. **Screens** (`src/screens/`) — Compare, Sources, Ask, History, Settings —
   compose the above per the ASCII layouts in DESIGN.md's *App Shell* and
   *Compare Screen Geometry*.

Each component is a standalone, independently reviewable unit per DESIGN.md's
own component-entry structure (variants as separate named entries, not prose
exceptions).

## Error Handling

One `normalizeApiError` (from `frontend.md`, implemented in
`src/api/errors.ts`) feeds `ToastContext`. Every error toast carries the
`Details` disclosure opening `{component.json-viewer}` with the raw `detail`
payload, per DESIGN.md's `toast` entry. 422 domain errors focus the domain
selector and list allowed domains; 401 GitLab errors address the admin
hint — both copy rules are specified verbatim in DESIGN.md's `toast` section
and `frontend.md`'s *Error Handling Strategy*.

## Accessibility & Keyboard

Implemented exactly as specified in DESIGN.md's *Accessibility* and
*Keyboard Triage* sections: `listbox` + `aria-activedescendant` triage list,
`aria-live="polite"` Ledger region and compare-progress announcements, the
full keyboard table (`j/k`, `Enter`, `1`-`4`, `0`, `/`, `c`, `Esc`, `?`),
visible 2px focus rings on every interactive element in both themes, and
`prefers-reduced-motion` / `prefers-color-scheme` respected throughout.

## Verification

Manual only, no automated test suite. After each screen is built, walk
DESIGN.md's own test payload (Iteration Guide step 7) across both themes and
the breakpoints in DESIGN.md's *Responsive Behavior* table, using the dev
server.

## Open Questions / Risks

None outstanding — all technology and scope decisions were resolved during
brainstorming. The one dependency risk is MSW's browser service-worker
registration in Vite; if it proves awkward, the fallback is a manual
`fetch` override in a dev-only bootstrap module with the same fixtures,
with no change to the API client or components.

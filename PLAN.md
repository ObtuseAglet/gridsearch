# GridSearch — Project Plan

A structured, sequential plan for GitHub agents to complete the GridSearch project
to 100% production-ready functionality.

## Project Overview

GridSearch is a Next.js 15 / React 19 / TypeScript spreadsheet application with
integrated web search. Users enter `=SEARCH("query")` into any cell and view
extracted page content in a side panel (Reader Mode). The current codebase has a
working UI skeleton and a demo/mock search API.

---

## Phase 1 — Tooling & Infrastructure ✅ (Completed in this PR)

### 1.1 Replace ESLint with Biome.js
- [x] Remove `eslint` and `eslint-config-next` from dependencies
- [x] Install `@biomejs/biome` as a dev dependency
- [x] Create `biome.json` with project-appropriate rules (spaces, double quotes,
      warnings for a11y/any/array-index-key)
- [x] Update `package.json` scripts: `lint`, `lint:fix`, `format`
- [x] Disable Next.js built-in ESLint via `next.config.js`
- [x] Remove `.eslintrc.json`
- [x] Apply Biome auto-fixes (formatting, import sorting, safe code fixes)
- [x] Fix `useExhaustiveDependencies` — move `getCellKey` to module scope in Grid.tsx
- [x] Fix `noStaticElementInteractions` — add `role="gridcell"`, `tabIndex`, and
      `onKeyDown` to Cell.tsx
- [x] Fix `useKeyWithClickEvents` — add keyboard handler (`Enter`/`Space`) to Cell.tsx

### 1.2 Docker / docker-compose
- [x] Create multi-stage `Dockerfile` (deps → builder → runner) using `node:22-alpine`
- [x] Enable `output: "standalone"` in `next.config.js` for Docker deployment
- [x] Create `docker-compose.yml` with health-check
- [x] Create `.dockerignore`

---

## Phase 2 — Real Search API Integration

**Goal:** Replace the mock/demo search API with real web search results and
content extraction.

### 2.1 Search Provider

| Task | Detail |
|------|--------|
| Add search provider abstraction | Create `lib/search/provider.ts` interface |
| Implement SearXNG adapter | Self-hosted, privacy-respecting; use `/search?format=json` |
| Implement Brave Search adapter (optional) | Requires `BRAVE_API_KEY` env var |
| Implement DuckDuckGo Instant Answers adapter (optional) | No API key required |
| Add environment-based provider switching | `SEARCH_PROVIDER=searxng\|brave\|duck` |
| Add `SEARXNG_BASE_URL` env var | Configurable endpoint for self-hosted SearXNG |

**Files to create/modify:**
- `lib/search/provider.ts` — interface `SearchProvider`
- `lib/search/searxng.ts` — SearXNG implementation
- `lib/search/brave.ts` — Brave Search implementation
- `app/api/search/route.ts` — update to use provider abstraction

### 2.2 Web Content Extraction

| Task | Detail |
|------|--------|
| Real HTTP fetching | Use `node-fetch` or built-in `fetch` to retrieve URLs |
| HTML parsing | Integrate `@mozilla/readability` + `jsdom` (already in deps) |
| Content sanitisation | Strip scripts, inline styles, iframes before returning |
| Image extraction | Extract `<img>` src values from the parsed article |
| Error handling | Handle network errors, non-HTML responses, paywalls |
| Rate limiting | Add per-IP rate limiting to the API route |

**Files to modify:**
- `app/api/search/route.ts` — add real fetch + readability extraction
- `lib/content/extractor.ts` — new file with extraction logic

### 2.3 docker-compose for SearXNG (self-hosted search)

Add a `searxng` service to `docker-compose.yml`:

```yaml
services:
  searxng:
    # Pin to a specific immutable tag; update deliberately when upgrading.
    # Find available tags at: https://hub.docker.com/r/searxng/searxng/tags
    image: searxng/searxng:2026.2.16-8e824017d
    ports:
      - "8080:8080"
    volumes:
      - ./searxng:/etc/searxng
  gridsearch:
    environment:
      - SEARCH_PROVIDER=searxng
      - SEARXNG_BASE_URL=http://searxng:8080
```

**Files to create:**
- `searxng/settings.yml` — minimal SearXNG config
- Update `docker-compose.yml`
- Update `.env.example`

---

## Phase 3 — Spreadsheet Core Features

**Goal:** Make GridSearch a functional spreadsheet, not just a search tool.

### 3.1 Cell Navigation & Keyboard Shortcuts

| Task | Detail |
|------|--------|
| Arrow key navigation | Move selected cell with arrow keys |
| Tab / Shift+Tab | Move right/left between cells |
| Enter / Shift+Enter | Commit edit and move down/up |
| Home / End | Move to first/last cell in row |
| Ctrl+Home / Ctrl+End | Move to A1 / last used cell |
| Escape | Cancel edit |
| Delete / Backspace | Clear cell content |
| Ctrl+C / Ctrl+V / Ctrl+X | Copy, paste, cut cells |
| Ctrl+Z / Ctrl+Y | Undo / Redo |

**Files to modify:**
- `components/Cell.tsx`
- `components/Grid.tsx` — add keyboard navigation state

### 3.2 Cell Ranges & Multi-Selection

| Task | Detail |
|------|--------|
| Shift+click | Select cell range |
| Shift+arrow | Extend selection |
| Highlight selected range | Blue border + light blue fill |
| Copy/paste range | Multi-cell clipboard operations |

### 3.3 Formula Engine

| Task | Detail |
|------|--------|
| Create formula parser | Tokenise and evaluate simple formulas |
| `=SEARCH("query")` | Existing functionality (keep) |
| `=SUM(A1:A10)` | Sum a range |
| `=AVERAGE(A1:A10)` | Average a range |
| `=COUNT(A1:A10)` | Count non-empty cells |
| `=MIN(A1:A10)` / `=MAX(A1:A10)` | Min/max of range |
| `=CONCAT(A1, " ", B1)` | String concatenation |
| `=IF(condition, trueVal, falseVal)` | Conditional |
| Circular reference detection | Prevent infinite loops |

**Files to create:**
- `lib/formulas/parser.ts`
- `lib/formulas/evaluator.ts`
- `lib/formulas/functions.ts`

**Files to modify:**
- `components/Grid.tsx` — integrate formula evaluation on cell commit

### 3.4 Cell Formatting

| Task | Detail |
|------|--------|
| Bold / Italic / Underline | Toggle text formatting per cell |
| Font family & size | Apply from Toolbar dropdowns (wire up existing UI) |
| Text colour & fill colour | Colour picker in Toolbar |
| Text alignment | Left / Centre / Right |
| Number formatting | Plain number, currency, percentage, date |
| Cell borders | Individual border sides |

**Files to modify:**
- `components/Cell.tsx` — apply format styles
- `components/Toolbar.tsx` — wire up existing buttons to dispatch actions
- `components/Grid.tsx` — add `CellFormat` state

### 3.5 Dynamic Grid

| Task | Detail |
|------|--------|
| Variable column width | Drag column header border to resize |
| Variable row height | Drag row header border to resize |
| Insert / delete rows | Right-click context menu |
| Insert / delete columns | Right-click context menu |
| Freeze rows / columns | Via View menu |
| Add / rename / delete sheets | Wire up existing StatusBar sheet tabs |

---

## Phase 4 — Save, Load & Export

### 4.1 Local Persistence

| Task | Detail |
|------|--------|
| Auto-save to localStorage | Debounced save on cell change |
| Load from localStorage on mount | Restore spreadsheet state |
| Named sheets stored separately | Each sheet saved under a unique key |

**Files to modify:**
- `components/Grid.tsx` — add `useEffect` for persistence
- `lib/storage/local.ts` — new file with localStorage helpers

### 4.2 File Import / Export

| Task | Detail |
|------|--------|
| Export to CSV | Convert cells to CSV and trigger download |
| Export to JSON | Full spreadsheet state as JSON |
| Import from CSV | Parse CSV and populate cells |
| Export to Excel (.xlsx) | Use `xlsx` (SheetJS) npm package |
| Import from Excel (.xlsx) | Use `xlsx` (SheetJS) npm package |

**Files to create:**
- `lib/export/csv.ts`
- `lib/export/json.ts`
- `lib/export/xlsx.ts`
- `lib/import/csv.ts`
- `lib/import/xlsx.ts`

---

## Phase 5 — Reader Mode Enhancements

### 5.1 Next.js Image Optimisation

| Task | Detail |
|------|--------|
| Replace `<img>` with Next.js `<Image>` | Address `noImgElement` Biome warning |
| Configure `remotePatterns` in next.config.js | Allow any domain (use `**` wildcard) |
| Add width / height estimates | Use `fill` layout mode for unknown dimensions |

**Files to modify:**
- `components/ContentViewer.tsx`
- `next.config.js`

### 5.2 Reader Mode UX

| Task | Detail |
|------|--------|
| Close / toggle panel button | Add a ✕ button to ContentViewer header |
| Keyboard shortcut to close | Escape key closes panel |
| Loading skeleton | Show skeleton while content is loading |
| Error state | Show friendly error if extraction fails |
| Open original URL button | Already present; ensure `rel="noopener noreferrer"` |
| Print / save article | Add print button |
| Panel resize handle | Drag handle to adjust panel width |

---

## Phase 6 — Accessibility & Quality

### 6.1 Accessibility (addresses Biome warnings)

| Task | Detail |
|------|--------|
| Add `type="button"` to all toolbar/status bar buttons | Fix `useButtonType` warnings |
| Add `<title>` to all SVG icons | Fix `noSvgWithoutTitle` warnings |
| Replace `role="gridcell"` div with semantic markup | Either use `<table>` layout or keep ARIA |
| Announce cell selection to screen readers | Add `aria-live` region |
| Keyboard-accessible context menus | Use roving tabindex |

### 6.2 TypeScript Strict Mode

| Task | Detail |
|------|--------|
| Replace all `any` types in `route.ts` | Define explicit types for demo data |
| Enable `strict: true` in tsconfig (already on) | Keep it on; address any type errors |
| Add Zod validation for API inputs | Validate search query shape |

### 6.3 Testing

| Task | Detail |
|------|--------|
| Install Vitest + React Testing Library | `npm install -D vitest @testing-library/react @testing-library/user-event` |
| Unit tests for formula parser | Test each formula function |
| Unit tests for CSV export/import | Test round-trip fidelity |
| Component tests for Cell.tsx | Test editing, search query detection, keyboard nav |
| Component tests for Grid.tsx | Test cell navigation, selection, formula evaluation |
| API route tests | Test search route with mocked fetch |
| E2E tests with Playwright | Test full user flows end-to-end |

---

## Phase 7 — Collaborative Editing (Future / Optional)

| Task | Detail |
|------|--------|
| WebSocket server | Add `/api/collab` WebSocket route in Next.js |
| CRDT state sync | Use `Yjs` for conflict-free replicated data types |
| Presence indicators | Show which cell other users are editing |
| Named sessions | Join a shared spreadsheet by URL |

---

## Phase 8 — Data Visualisation (Future / Optional)

| Task | Detail |
|------|--------|
| Chart types | Bar, line, pie, scatter |
| Chart from range | Select a cell range and insert a chart |
| Chart editor | Title, axis labels, colours |
| Embed in sheet | Chart floats over cells as an overlay |

---

## Environment Variables

Create a `.env.example` file:

```
# Search provider: "demo" | "searxng" | "brave"
SEARCH_PROVIDER=demo

# SearXNG self-hosted base URL (only when SEARCH_PROVIDER=searxng)
SEARXNG_BASE_URL=http://localhost:8080

# Brave Search API key (only when SEARCH_PROVIDER=brave)
BRAVE_API_KEY=

# Optional: API rate limiting (requests per minute per IP)
API_RATE_LIMIT_RPM=60
```

---

## Completion Criteria

The project is considered 100% functional when:

1. **Search** returns real web results (not mock data) via a configurable provider
2. **Content extraction** uses Readability to show clean article text
3. **Spreadsheet** supports full cell navigation, copy/paste, and basic formulas
   (SUM, AVERAGE, COUNT, IF, CONCAT)
4. **Formatting** allows bold/italic/colour per cell, wired to the Toolbar
5. **Persistence** auto-saves to localStorage; import/export works for CSV & Excel
6. **Docker** — `docker compose up` starts a fully functional production instance
7. **Linting** — `npm run lint` reports 0 errors
8. **Tests** — unit and integration test suite exists and passes
9. **Accessibility** — all Biome a11y warnings resolved; keyboard-navigable grid
10. **TypeScript** — no `any` types; all API inputs validated with Zod

# StadiumSync

A GenAI-powered companion for attendees, organizers, and venue staff at Estadio Azteca during the FIFA World Cup 2026 — built for the PromptWars Challenge 4: *Smart Stadiums & Tournament Operations*.

**Live demo:** https://stadiumsync-sigma.vercel.app
**Repo:** https://github.com/J-S28/stadiumsync

---

## Challenge 4 requirement mapping

Every capability called for in *Smart Stadiums & Tournament Operations* is implemented and live, not mocked:

| Requirement | Implemented as | Where |
|---|---|---|
| AI-powered navigation | Live GPS-style wayfinding with an animated position marker and a step-free routing toggle | `NavigateTab` in [`src/StadiumSync.jsx`](src/StadiumSync.jsx) |
| Multilingual assistant | Claude-backed chat that detects and replies in the attendee's typed language (EN/ES/PT/FR/DE tested, any language via the live API) | `AssistantTab` + [`api/assistant.js`](api/assistant.js) |
| Crowd / queue prediction | Live zone-density thresholds surfaced to attendees as reroute suggestions, and to staff as a spike-detection signal ("47 attendees asked about Gate 4 in 6 minutes — a 5x spike") | Zone bars in `NavigateTab`; `OpsPulseTab` in [`src/tabs/OpsPulseTab.jsx`](src/tabs/OpsPulseTab.jsx) |
| Transport recommendation | An AI-suggested route with one-tap selection that highlights it on a live map, plus surge-timing guidance | `TransportTab` in [`src/StadiumSync.jsx`](src/StadiumSync.jsx) |
| Tournament operations dashboard | A real-time Ops Console: zone density, vendor wait/stock alerts, sustainability/waste diversion, all with actionable one-tap responses | `OpsPulseTab`, `VendorLoadTab`, `SustainabilityTab` in [`src/tabs/`](src/tabs/) |
| Accessibility assistance | A real step-free routing toggle and Audio wayfinding that speaks directions aloud via the Speech Synthesis API — not just a settings checkbox | Accessibility card in `NavigateTab`, [`src/StadiumSync.jsx`](src/StadiumSync.jsx) |
| Real-time attendee↔operations feedback loop | Attendee assistant questions feed the same congestion signal the Ops Console surfaces as an actionable alert — one data model, two views | `AssistantTab` ↔ `OpsPulseTab` |

## The problem

A World Cup stadium is one of the hardest real-time coordination problems in live events: 68,000+ people need directions, food, transport, and safety information at once, while staff need the same signal in aggregate to act on it — a gate approaching capacity, a vendor running low on stock, a spike in "nearest exit" questions that predicts a crowd surge before it happens. Static signage and a generic help desk can't keep up with conditions that change minute to minute.

## The solution

StadiumSync is one AI layer serving two audiences from the same live data — same underlying intelligence, two different jobs to do with it.

| Capability | Attendee experience | Staff / Operations experience |
|---|---|---|
| **AI navigation** | Live, GPS-tracked wayfinding (animated position marker, growing route trail — Rapido/Uber-style) with a step-free routing toggle | Zone density heatmap staff use to see *why* a route was suggested |
| **Multilingual AI assistant** | Auto-detects the language typed (EN/ES/PT/FR/DE, or any language once the live Claude backend is wired) and answers grounded in real venue state — restrooms, exits, food, accessibility | Same assistant traffic is the input to the crowd-prediction signal below |
| **Crowd / queue prediction** | Zone crowd bars flag Gate 4 at 97% and steer attendees to Concourse S before they hit the bottleneck | Ops Pulse surfaces the same congestion as an actionable "AI-flagged signal": *"47 attendees asked about the nearest exit near Gate 4 in 6 minutes — a 5x spike"* with a one-tap **Deploy marshals** action |
| **Transport recommendation** | A stadium-relative map of Shuttle/Metro/Rideshare routes; tapping a route (or the AI suggestion) highlights it live, like tapping a place in Google Maps | — |
| **Emergency / exit guidance** | The assistant and the Navigate tab both proactively route around the congested gate rather than defaulting to the nearest one | The same congestion signal drives the marshal-deployment recommendation |
| **Accessibility assistance** | A real step-free routing toggle and **Audio wayfinding** that actually speaks directions aloud via the browser's Speech Synthesis API | — |
| **Real-time operational intelligence** | Attendee actions (chat questions, routes taken) feed the same backend staff are watching | Vendor wait/stock alerts and sustainability (waste diversion, compost routing) round out the Ops Console |

Role selection happens once, at the landing page — not inside the app. There's no Attendee/Operations toggle once you're in; each session commits to one role, and a small exit icon next to the "Live" pill returns to the landing page to switch:

- **Attendee tab:** pick an avatar (mascot-style illustrated characters), a name, and a ticket ID. Real ticket IDs are unique per attendee, so there's no single "correct" value — any input that looks like a ticket ID (6+ letters/digits/dashes, e.g. `WC26-118014`) is accepted, the same way a lightweight client-side format check would work before hitting a real ticketing system.
- **Operations tab:** enter the operations passcode and go straight to the Ops Console, no ticket required. The demo passcode (`2026`) is shown right on the form, since — unlike an attendee's ticket — it's one real shared credential a venue would actually hand out to staff, not something to hide behind a README.

| Role | Gate | How to pass it |
|---|---|---|
| Attendee | Ticket ID format check | Any ID-shaped string, 6+ letters/digits/dashes (e.g. `WC26-118014`) |
| Operations | Fixed passcode | `2026` (shown on the form) |

These are stand-ins for real ticket verification and staff authentication — enough to show the access boundary exists without building a full auth backend for a hackathon demo.

## How GenAI is used

The in-app assistant (`AssistantTab`) is backed by **Claude (`claude-opus-4-8`)** via the Anthropic API — called from a Vercel serverless function (`api/assistant.js`), never directly from the browser, so the API key is never exposed to the client.

- The system prompt grounds every answer in the stadium's actual live state (zone density, gate congestion, vendor wait times, transit ETAs, accessibility routes) — so answers like "what's my fastest exit" are consistent with what the Ops dashboard is showing staff, not generic advice.
- Genuinely multilingual, not just a language picker: the system prompt tells Claude to reply in whatever language the attendee just wrote in, so it isn't limited to the five UI pills (EN/ES/PT/FR/DE) — anyone can type in any language and get an answer back in kind.
- The frontend auto-detects the attendee's language from what they type (no need to tap a pill first) to pick the right scripted fallback bank and highlight the matching pill — this only affects the offline fallback; the live Claude path already replies in-language by default.
- If the API is unreachable (no key configured, offline, rate-limited), the UI falls back gracefully to a scripted responder so the demo never breaks mid-presentation.

## Architecture

```
Browser (React SPA)
  │
  ├─ Attendee tabs: Navigate · Order · Assistant · Transport
  ├─ Operations tabs: Ops Pulse · Vendors · Sustainability  (code-split, lazy-loaded)
  │
  └─ POST /api/assistant  ──────────────►  Vercel serverless function
                                              │  · Zod-validates the request body
                                              │  · rate-limits per client
                                              │  · calls Claude with a system prompt
                                              │    grounded in the live venue state
                                              ▼
                                            Anthropic API (claude-opus-4-8)
```

The Recharts-based Operations tabs (Ops Pulse, Vendors, Sustainability) are dynamically `import()`ed — attendees never load the charting library at all, and staff only pay for it once they open a tab that needs it. See [Performance](#performance) below.

## Tech stack

- **Frontend:** Vite + React 19, Tailwind CSS v4
- **Charts:** Recharts (zone density bars, vendor wait times, sustainability donut) — code-split, loaded on demand
- **Icons:** lucide-react
- **AI:** Anthropic Claude API (`claude-opus-4-8`) via `@anthropic-ai/sdk`, called server-side only
- **Backend:** Vercel serverless function (`api/assistant.js`), request validation via **Zod**
- **Testing:** Vitest + React Testing Library (unit/component), Playwright + axe-core (E2E + accessibility)
- **CI:** GitHub Actions (lint → test → coverage → build → E2E)
- **Deployment:** Vercel

## Running locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

The dev server serves the frontend only — the `/api/assistant` route needs the Vercel dev server (`vercel dev`) or a deployed environment to respond. Without it, the assistant automatically falls back to scripted replies, so the rest of the app is fully usable either way.

## Testing

```bash
npm test              # unit + component tests (Vitest + React Testing Library)
npm run test:watch    # same, in watch mode
npm run test:coverage # with a coverage report (currently ~97% statements)
npm run test:e2e      # Playwright end-to-end + axe-core accessibility scans
```

- **Unit tests** (`src/test/utils.test.js`) cover the pure logic: language auto-detection, keyword-based scripted replies, zone density color thresholds, and the ticket-ID format check.
- **Component tests** (`src/test/StadiumSync.test.jsx`) drive the app through React Testing Library: onboarding gates (both roles, valid/invalid credentials), the order → checkout → confirmation flow, transport route selection, the Ops Console's actionable AI suggestions, and the accessibility toggles.
- **API tests** (`api/assistant.test.js`) mock the Anthropic SDK to cover method/validation errors, the success path, auth/rate-limit/upstream-error handling, and the in-memory rate limiter — with no real network calls.
- **E2E tests** (`e2e/*.spec.js`) run the built app in a real headless browser: the full attendee and operations journeys, plus three `@axe-core/playwright` scans (landing page, attendee Navigate tab, Ops Console) that currently report **zero WCAG 2.0/2.1 A/AA violations**, and a keyboard-only walkthrough of onboarding.

CI runs all of the above — lint, unit tests with coverage, build, and E2E — on every push and pull request (`.github/workflows/ci.yml`).

## Performance

- **Code-split Operations tabs.** `OpsPulseTab`, `VendorLoadTab`, and `SustainabilityTab` (and Recharts itself) are loaded via `React.lazy()` instead of bundled into the main chunk. The attendee-facing bundle never touches the charting library; staff only fetch it once they open a tab that needs it.
- **Shared modules split by kind, not just by reuse**: `src/shared/data.js` (pure data/logic) and `src/shared/ui.jsx` (presentational components) are separate files, both imported by the main shell and the lazy tabs — the split also keeps each file Fast-Refresh-clean (no mixed component/non-component exports).
- **Memoized list rows.** `SnackRow` (Order), `ZoneRow` (Navigate), and `RouteRow` (Transport) are wrapped in `React.memo` with stable (`useCallback`) handlers, so incrementing one cart item or toggling step-free routing re-renders only the row that changed, not the whole list.

## Accessibility

Verified with `@axe-core/playwright` against the production build (zero violations on the pages tested), plus manual review:

- Semantic structure: a real `<h1>` per screen, `SectionLabel` renders as `<h2>`, and the active tab panel lives in a `<main>` landmark — screen reader users can navigate by heading/landmark instead of relying on visual layout.
- A "Skip to main content" / "Skip to role selection" link, visually hidden until focused, so keyboard users can bypass the header and tab bar.
- `aria-label` on every icon-only control (send, switch-role, cart +/-, dismiss) and on form inputs whose visible label was previously just styled text with no programmatic association.
- `aria-pressed` on toggle-style controls (avatar picker, step-free/audio toggles, route selection, language pills) and `role="tab"` / `aria-selected` on both tab bars, since state was previously conveyed by color alone.
- `aria-invalid` + `aria-describedby` linking the ticket/passcode inputs to their error or hint text, with `role="alert"` on the error itself.
- `role="log"`/`aria-live="polite"` on the assistant conversation and `role="status"` on order/dispatch confirmations, so async responses are announced to screen readers instead of only appearing visually.
- Visible `focus-visible` rings on every interactive element.
- A global `prefers-reduced-motion` override (`src/index.css`) collapses animation/transition duration for users who request it.
- Color contrast: axe flagged one real WCAG AA failure (footer caption text at 3.31:1) during this pass — fixed by switching it to the app's existing secondary-text token, which already passes.

## Security

- The Anthropic API key never reaches the browser — all Claude calls happen inside the `api/assistant.js` serverless function.
- Request bodies are validated with **Zod** (role enum, per-message length cap, message-count cap) before touching the model, rejecting malformed input with a 400 instead of forwarding it.
- A best-effort **in-memory rate limiter** caps requests per client per minute on the assistant endpoint.
- **Security headers** (`vercel.json`): a Content-Security-Policy, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and HSTS, applied to every response.
- No secrets are committed — `.env.local` is git-ignored and `.env.example` only documents the variable name.

## Deploying

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add an `ANTHROPIC_API_KEY` environment variable in the Vercel project settings (Settings → Environment Variables).
4. Deploy — Vercel auto-detects the Vite frontend, the `api/` serverless function, and applies the headers in `vercel.json`.

## Project structure

```
stadiumsync/
├── .github/workflows/
│   └── ci.yml               # lint → unit tests + coverage → build → e2e, on every push/PR
├── api/
│   ├── assistant.js         # Claude API call — server-side only, Zod-validated, rate-limited
│   └── assistant.test.js    # API handler tests (mocked Anthropic SDK)
├── e2e/
│   ├── attendee-flow.spec.js
│   ├── operations-flow.spec.js
│   └── accessibility.spec.js  # axe-core WCAG scans + keyboard-only walkthrough
├── src/
│   ├── StadiumSync.jsx       # main app: onboarding, attendee tabs, shell/routing
│   ├── shared/
│   │   ├── data.js           # pure data + densityColor, shared with the lazy tabs
│   │   └── ui.jsx             # Card/Pill/SectionLabel — presentational only
│   ├── lib/
│   │   └── assistant.js      # scripted reply bank + language detection (pure, unit-tested)
│   ├── tabs/                 # code-split Operations tabs (Recharts lives only here)
│   │   ├── OpsPulseTab.jsx
│   │   ├── VendorLoadTab.jsx
│   │   └── SustainabilityTab.jsx
│   ├── test/
│   │   ├── setup.js          # jsdom polyfills (speechSynthesis, ResizeObserver, fetch)
│   │   ├── utils.test.js     # pure-function unit tests
│   │   └── StadiumSync.test.jsx  # component/integration tests
│   ├── App.jsx
│   └── main.jsx
├── playwright.config.js
├── vite.config.js            # includes the Vitest `test` config block (with coverage thresholds)
├── vercel.json                # security headers
├── .env.example
└── package.json
```

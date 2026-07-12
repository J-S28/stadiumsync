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
| Incident response & emergency coordination | An AI summarizer aggregates independent security/volunteer/social reports into one alert and a concrete deployment plan, plus one-tap AI-generated, multilingual PA/push comms | `IncidentCommandTab` in [`src/tabs/IncidentCommandTab.jsx`](src/tabs/IncidentCommandTab.jsx) |
| Staff/volunteer operational enablement | An AI protocol assistant grounded in an operations-manual excerpt, plus AI-generated volunteer redirect briefs tied to live crowd-density data | `CopilotTab` in [`src/tabs/CopilotTab.jsx`](src/tabs/CopilotTab.jsx) |
| Post-match egress & crowd control | Live-shared "transit delay" state that automatically fires an AI wayfinding + digital-signage update and genuinely re-routes the attendee Transport tab in the same session | `EgressTab` ↔ `TransportTab` in [`src/StadiumSync.jsx`](src/StadiumSync.jsx) |
| Fan engagement / immersive experience | AI-generated match commentary (tactical or team-biased) that plays aloud the instant a moment is tapped | `MatchHubTab` in [`src/tabs/MatchHubTab.jsx`](src/tabs/MatchHubTab.jsx) |
| Sensory & hearing accessibility | Quiet-room wait tracking, an AI-generated loud-moment warning, and real synced live captions | `AccessPlusTab` in [`src/tabs/AccessPlusTab.jsx`](src/tabs/AccessPlusTab.jsx) |
| City-wide event integration (Fan Zones) | Nearby official Fan Zone wait times, live music schedules, and animated seat-to-entrance routing | `FanZoneTab` in [`src/tabs/FanZoneTab.jsx`](src/tabs/FanZoneTab.jsx) |

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

## Extended modules

A second round of additions goes deeper on both sides — same "one AI layer, two audiences" model, more surface area on each:

**Operations-facing**

| Module | What it does | Honesty note |
|---|---|---|
| **Volunteer Copilot** (`CopilotTab`) | A protocol-lookup chat grounded in a demo operations-manual excerpt (lost child, rejected ticket, medical, spill, weather) — real Claude call, mode `protocol`. Plus **Dynamic re-routing**: derives the most-congested zone from the same live `ZONES` data Ops Pulse reads (no hardcoded zone name), and on request generates a real, Claude-written redirect brief for nearby volunteers (mode `brief`). | The "ping" itself — actually reaching a volunteer's device — is necessarily simulated (no real volunteer devices exist in a demo); the brief text and the flagged zone are both genuinely live/generated, not static strings. |
| **Incident Command** (`IncidentCommandTab`) | An **incident summarizer**: feeds independent mock reports (security feed, volunteer radio, social sentiment) to Claude (mode `incident`) and gets back one alert + a concrete deployment recommendation. Plus **Automated Comms**: generates a PA announcement and push notification in a chosen language (mode `comms`) from a one-line incident description. | The three source reports are demo data, not live feeds — the AI reasoning over them is real. |
| **Egress Optimizer** (`EgressTab`) | Toggling a simulated transit delay automatically (no separate "generate" step) fires a real Claude call (mode `egress`) that writes updated wayfinding guidance and a digital-signage message. The delay flag is shared app-level state, not local to the tab — it genuinely updates the attendee's **Transport tab** live in the same session: Metro Blue Line's entry flips to "delayed," and an Egress Optimizer banner appears there too. | The transit delay itself is a simulated trigger (no live transit API) — but the AI guidance text, the signage message, and the cross-tab wayfinding update are all real, not static copy. |

**Attendee-facing**

| Module | What it does | Honesty note |
|---|---|---|
| **Match Hub** (`MatchHubTab`) | **AI commentary feed**: pick tactical or team-biased style and a team, then tapping a match moment *is* the toggle — Claude (mode `commentary`) generates 2-3 sentences of commentary and it plays aloud immediately via Speech Synthesis, no separate generate/play steps. Plus **AR Match Stats**, mocked up with a player name, speed, possession, and a decorative heat-map overlay. | AR Match Stats is a clearly labeled **concept preview** — a real live camera overlay needs camera access and a broadcast feed this demo doesn't have, so it's shown as a static mockup of the intended layout (player names, speeds, heat map), not faked as working. |
| **Access+** (`AccessPlusTab`) | **Sensory management**: quiet-room wait times, and a loud-moment warning that's a real Claude call (mode `sensory`) fired automatically when warnings are enabled — not static copy. **Live captions**: a real synced-caption panel of PA announcements. | The brief called for a sign-language avatar; there's no accessible generation model for that, so live captions — genuinely useful and genuinely working — ship instead, with an explicit in-UI note about the avatar being out of scope for this build. |
| **Fan Zone Link** (`FanZoneTab`) | Nearby official Fan Zone wait times, live music schedules, and one-tap seat-to-Fan-Zone routing with a real animated route visualization (same visual language as the Transport tab), not just a text confirmation. | Demo data (no live Fan Zone API), same fidelity as the rest of the app's venue data. |

**Design system additions** — applied to the new modules and to every existing "AI-suggested action" (Deploy Marshals, Dispatch Cart, the Order tab's AI pick, the Transport AI suggestion), *not* as a full app-wide re-theme (the existing dark palette stays as-is everywhere else — a full light/dark split was judged too high-risk to retrofit across a tested, working UI this close to submission):

- **AI accent** — a pulsating pink-to-teal gradient badge (`AIBadge` in `src/shared/ui.jsx`) marks anywhere content is genuinely model-generated or model-suggested, so that visual language means the same thing everywhere it appears.
- **Host-nation gradient** — reserved for the Match Hub's primary CTA, a nod to the Canada/Mexico/USA co-hosting.
- **Avatar → marker morph** — the onboarding avatar rides the Navigate tab's route as the live position marker (a `<foreignObject>` inside the route SVG) instead of a plain dot, with a spring-eased pop-in on mount (`.marker-morph` in `src/index.css`).
- **"Breathing" charts** — a slow ambient glow pulse (`.chart-breathe`) on the zone-density bars, donut, and vendor chart, signaling "live" without fabricating fake fluctuating numbers that would contradict the specific figures the assistant and README already reference.
- **Haptics** (`src/lib/haptics.js`) — a sharp tick on the AI pick, a sustained pulse on marshal/cart dispatch, a firm snap on the step-free toggle, via `navigator.vibrate()`. **Real but partial**: only Android Chrome/Firefox implement the Vibration API — iOS Safari and desktop browsers have no implementation at all, so these silently no-op there rather than faking a vibration that isn't happening.
- All of the above respects `prefers-reduced-motion` (already globally overridden in `src/index.css`).

Role selection happens once, at the landing page — not inside the app. There's no Attendee/Operations toggle once you're in; each session commits to one role, and a small exit icon next to the "Live" pill returns to the landing page to switch:

- **Attendee tab:** pick an avatar (mascot-style illustrated characters), a name, and a ticket ID. Real ticket IDs are unique per attendee, so there's no single "correct" value — any input that looks like a ticket ID (6+ letters/digits/dashes, e.g. `WC26-118014`) is accepted, the same way a lightweight client-side format check would work before hitting a real ticketing system.
- **Operations tab:** enter the operations passcode and go straight to the Ops Console, no ticket required. The demo passcode (`2026`) is shown right on the form, since — unlike an attendee's ticket — it's one real shared credential a venue would actually hand out to staff, not something to hide behind a README.

| Role | Gate | How to pass it |
|---|---|---|
| Attendee | Ticket ID format check | Any ID-shaped string, 6+ letters/digits/dashes (e.g. `WC26-118014`) |
| Operations | Fixed passcode | `2026` (shown on the form) |

These are stand-ins for real ticket verification and staff authentication — enough to show the access boundary exists without building a full auth backend for a hackathon demo.

## How GenAI is used

Every Claude call in the app goes through one Vercel serverless function (`api/assistant.js`), backed by **Claude (`claude-opus-4-8`)** via the Anthropic API — never called directly from the browser, so the API key is never exposed to the client. A validated `mode` enum selects one of eight fixed system prompts server-side (`attendee`, `protocol`, `incident`, `comms`, `commentary`, `brief`, `egress`, `sensory`) — the client picks a mode, never the prompt text itself, so there's no path for user input to inject into what Claude is told to do:

- **`attendee`** (`AssistantTab`) — grounds every answer in the stadium's actual live state (zone density, gate congestion, vendor wait times, transit ETAs) and always replies in whatever language the attendee just typed in, not just the five UI pills (EN/ES/PT/FR/DE).
- **`protocol`** (`CopilotTab`, staff) — answers volunteer questions from a demo operations-manual excerpt (lost child, rejected ticket, medical, spill, weather), escalating to a supervisor rather than guessing outside that excerpt.
- **`incident`** (`IncidentCommandTab`, staff) — aggregates independent mock reports into one alert and a concrete deployment recommendation.
- **`comms`** (`IncidentCommandTab`, staff) — generates a PA announcement and push notification in a chosen language from a short incident description.
- **`commentary`** (`MatchHubTab`, attendee) — generates tactical or team-biased match commentary, played aloud automatically the moment a match moment is tapped.
- **`sensory`** (`AccessPlusTab`, attendee) — generates a personalized loud-moment warning naming the upcoming moment, how soon it is, and the nearest quiet room, fired automatically when warnings are on.
- **`brief`** (`CopilotTab`, staff) — generates a short, radio-style redirect brief for volunteers, given the zone Ops Pulse's live density data currently flags as most congested.
- **`egress`** (`EgressTab`, staff) — fires automatically (no manual "generate" step) when a transit delay is toggled, writing updated attendee wayfinding guidance and a digital-signage message; the resulting state is shared app-level, so it also updates the attendee Transport tab live.

Every mode falls back to a scripted offline response (`src/lib/{assistant,protocol,incident,commentary,egress}.js`) if the API is unreachable — no key configured, offline, or rate-limited — so the demo never breaks mid-presentation.

## Architecture

```
Browser (React SPA)
  │
  ├─ Attendee tabs: Navigate · Order · Assistant · Transport · Match Hub · Access+ · Fan Zone
  ├─ Operations tabs: Ops Pulse · Vendors · Sustainability · Copilot · Incident Command · Egress
  │  (every tab except Navigate is code-split, lazy-loaded)
  │
  └─ POST /api/assistant  ──────────────►  Vercel serverless function
                                              │  · Zod-validates the request body
                                              │  · rate-limits per client
                                              │  · mode ∈ {attendee, protocol, incident,
                                              │    comms, commentary, brief, egress,
                                              │    sensory} selects one of eight
                                              │    fixed system prompts server-side
                                              ▼
                                            Anthropic API (claude-opus-4-8)
```

The Recharts-based tabs (Ops Pulse, Vendors, Sustainability) are dynamically `import()`ed — attendees never load the charting library at all. Every tab except Navigate — Order, Assistant, Transport, and every module built after them — is lazy-loaded, so opening a tab you never visit costs nothing. See [Performance](#performance) below.

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
npm run test:coverage # with a coverage report + enforced thresholds (currently ~98% statements)
npm run test:e2e      # Playwright end-to-end + axe-core accessibility scans
```

108 Vitest tests + 29 Playwright E2E tests = 137 total, all passing:

- **Unit tests** (`src/test/utils.test.js` — 20, `src/test/lib.test.js` — 21) cover the pure logic: language auto-detection, keyword-based scripted replies (attendee + protocol), zone density color thresholds, the ticket-ID format check, incident/comms/egress response parsing, the offline fallback banks, the `callAssistant` client (including its own empty-reply and non-ok-response branches), and the haptics wrapper (including graceful no-op when the Vibration API is unsupported).
- **Component tests** (`src/test/StadiumSync.test.jsx` — 42) drive the app through React Testing Library: onboarding gates, the order → checkout → confirmation flow, transport route selection, the Ops Console's actionable AI suggestions, the accessibility toggles, and every one of the six new modules — Copilot, Incident Command, Egress, Match Hub, Access+, Fan Zone — covering the offline-fallback path, the live-API-success path, and edge interactions (Enter-key submission, replay/stop toggles, dismissing confirmations).
- **API tests** (`api/assistant.test.js` — 25) mock the Anthropic SDK to cover method/validation errors, the success path, auth/rate-limit/upstream-error handling, the in-memory rate limiter, that each of the eight `mode` values selects the correct system prompt, and IP-resolution fallbacks (`x-forwarded-for` → `socket.remoteAddress` → `"unknown"`) — with no real network calls.
- **E2E tests** (`e2e/*.spec.js` — 29) run the built app in a real headless browser: the full attendee and operations journeys including all six new modules, plus five `@axe-core/playwright` scans (landing page, attendee Navigate tab, Ops Console, Match Hub, Incident Command) that currently report **zero WCAG 2.0/2.1 A/AA violations**, and a keyboard-only walkthrough of onboarding.

Coverage thresholds (`vite.config.js`) are enforced, not just reported — `test:coverage` fails the run if statements/lines drop below 90%, functions below 90%, or branches below 80%.

CI runs all of the above — lint, unit tests with coverage, build, and E2E — on every push and pull request (`.github/workflows/ci.yml`).

## Performance

- **Every tab beyond the default Navigate view is code-split.** Not just the Recharts-heavy staff tabs — `OrderTab`, `AssistantTab`, and `TransportTab` (the three other original attendee tabs) are also lazy-loaded now, since only Navigate is guaranteed to be seen. This cut the main bundle from 241.6 KB to **227.8 KB** (75.5 KB → **72.4 KB gzip**), with those three tabs deferred into 4-5 KB on-demand chunks. Navigate itself stays eager so the very first screen after onboarding never shows a loading flash.
- **Shared modules split by kind, not just by reuse**: `src/shared/data.js` (pure data/logic), `src/shared/ui.jsx` (presentational components), and `src/shared/avatars.jsx` (the mascot SVGs, needed by both the main shell and the now-lazy `AssistantTab`) are separate files — the split also keeps each file Fast-Refresh-clean (no mixed component/non-component exports).
- **Memoized list rows.** `SnackRow` (Order), `ZoneRow` (Navigate), and `RouteRow` (Transport) are wrapped in `React.memo` with stable (`useCallback`) handlers, so incrementing one cart item or toggling step-free routing re-renders only the row that changed, not the whole list.
- **No dead weight.** Vite/CRA-scaffolding leftovers (`App.css`, unused image assets, an unreferenced `icons.svg`) were removed after confirming via grep that nothing imported them.

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
│   ├── assistant.js         # Claude API call — server-side only, Zod-validated, rate-limited,
│   │                         # mode-selected system prompt (attendee/protocol/incident/comms/commentary)
│   └── assistant.test.js    # API handler tests (mocked Anthropic SDK), incl. per-mode prompt checks
├── e2e/
│   ├── attendee-flow.spec.js    # incl. Match Hub, Access+, Fan Zone
│   ├── operations-flow.spec.js  # incl. Copilot, Incident Command, Egress
│   └── accessibility.spec.js    # axe-core WCAG scans + keyboard-only walkthrough
├── src/
│   ├── StadiumSync.jsx       # main app: onboarding, attendee tabs, shell/routing
│   ├── shared/
│   │   ├── data.js           # pure data + densityColor + AVATARS lookup, shared with the lazy tabs
│   │   ├── ui.jsx             # Card/Pill/SectionLabel/AIBadge — presentational only
│   │   └── avatars.jsx        # mascot SVG components (needed by StadiumSync.jsx and the lazy AssistantTab)
│   ├── lib/
│   │   ├── assistant.js      # attendee scripted reply bank + language detection
│   │   ├── protocol.js       # Volunteer Copilot offline fallback bank
│   │   ├── incident.js       # incident/comms response parsing + mock reports + fallbacks
│   │   ├── commentary.js     # Match Hub offline fallback commentary
│   │   ├── egress.js         # egress wayfinding/signage response parsing + fallback
│   │   ├── sensory.js        # Access+ loud-moment warning offline fallback
│   │   ├── callAssistant.js  # shared client for POST /api/assistant
│   │   └── haptics.js        # Vibration API wrapper (progressive enhancement)
│   ├── tabs/                 # code-split tabs (lazy-loaded) — everything but NavigateTab
│   │   ├── OrderTab.jsx          # attendee — snack cart + checkout
│   │   ├── AssistantTab.jsx      # attendee — multilingual AI chat
│   │   ├── TransportTab.jsx      # attendee — route map, reacts to Egress Optimizer's delay flag
│   │   ├── OpsPulseTab.jsx
│   │   ├── VendorLoadTab.jsx
│   │   ├── SustainabilityTab.jsx
│   │   ├── CopilotTab.jsx        # staff — Volunteer Copilot
│   │   ├── IncidentCommandTab.jsx # staff — incident summarizer + automated comms
│   │   ├── EgressTab.jsx         # staff — transit-linked pacing
│   │   ├── MatchHubTab.jsx       # attendee — AI commentary + AR concept preview
│   │   ├── AccessPlusTab.jsx     # attendee — sensory management + live captions
│   │   └── FanZoneTab.jsx        # attendee — Fan Zone wait times/music/routing
│   ├── test/
│   │   ├── setup.js          # jsdom polyfills (speechSynthesis, ResizeObserver, fetch, vibrate)
│   │   ├── utils.test.js     # pure-function unit tests
│   │   ├── lib.test.js       # tests for src/lib/* (protocol, incident, commentary, haptics, callAssistant)
│   │   └── StadiumSync.test.jsx  # component/integration tests, all tabs
│   ├── App.jsx
│   └── main.jsx
├── playwright.config.js
├── vite.config.js            # includes the Vitest `test` config block (with coverage thresholds)
├── vercel.json                # security headers
├── .env.example
└── package.json
```

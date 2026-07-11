# StadiumSync

A GenAI-powered companion for attendees, organizers, and venue staff at Estadio Azteca during the FIFA World Cup 2026 — built for the PromptWars Challenge 4: *Smart Stadiums & Tournament Operations*.

**Live demo:** https://stadiumsync-sigma.vercel.app

---

## The problem

A World Cup stadium is one of the hardest real-time coordination problems in live events: 68,000+ people need directions, food, transport, and safety information at once, while staff need the same signal in aggregate to act on it — a gate approaching capacity, a vendor running low on stock, a spike in "nearest exit" questions that predicts a crowd surge before it happens. Static signage and a generic help desk can't keep up with conditions that change minute to minute.

## The solution

StadiumSync is one AI layer serving two audiences from the same live data:

- **Attendees** get live, Rapido/Uber-style GPS-tracked wayfinding, food ordering, transport suggestions, and a multilingual AI assistant that auto-detects whatever language they type in and answers questions grounded in real venue conditions — not generic chat.
- **Staff / organizers** get the aggregate view: zone density heatmaps, vendor wait times and stock alerts, sustainability tracking, and AI-flagged signals (e.g. "47 attendees asked about the nearest exit near Gate 4 in 6 minutes — a 5x spike, deploy crowd marshals").

Every attendee interaction feeds the same operational picture staff are watching — the pitch is "same AI, every role."

### Feature map

| Attendee view | Staff view |
|---|---|
| Live wayfinding with an animated GPS-style position marker + zone crowd levels | Ops Pulse (live zone density, AI-flagged crowd signals) |
| Food ordering with AI wait-time picks | Vendor load + stock alerts |
| Multilingual AI assistant — auto-detects EN/ES/PT/FR/DE from what's typed | Sustainability / waste diversion tracking |
| Transport + post-match surge prediction | |
| Accessibility (step-free routing, audio wayfinding) | |

Role selection happens once, at the landing page — not inside the app. There's no Attendee/Staff toggle once you're in; each session commits to one role, and a small exit icon next to the "Live" pill returns to the landing page to switch:

- **Attendee tab:** pick an avatar (mascot-style illustrated characters), a name, and a ticket ID. Real ticket IDs are unique per attendee, so there's no single "correct" value — any input that looks like a ticket ID (6+ letters/digits/dashes, e.g. `WC26-118014`) is accepted, the same way a lightweight client-side format check would work before hitting a real ticketing system.
- **Organizer / Staff tab:** enter the staff passcode and go straight to the Ops Console, no ticket required. The demo passcode (`2026`) is shown right on the form, since — unlike an attendee's ticket — it's one real shared credential a venue would actually hand out to staff, not something to hide behind a README.

| Role | Gate | How to pass it |
|---|---|---|
| Attendee | Ticket ID format check | Any ID-shaped string, 6+ letters/digits/dashes (e.g. `WC26-118014`) |
| Organizer / Staff | Fixed passcode | `2026` (shown on the form) |

These are stand-ins for real ticket verification and staff authentication — enough to show the access boundary exists without building a full auth backend for a hackathon demo.

## How GenAI is used

The in-app assistant (`AssistantTab`) is backed by **Claude (`claude-opus-4-8`)** via the Anthropic API — called from a Vercel serverless function (`api/assistant.js`), never directly from the browser, so the API key is never exposed to the client.

- The system prompt grounds every answer in the stadium's actual live state (zone density, gate congestion, vendor wait times, transit ETAs, accessibility routes) — so answers like "what's my fastest exit" are consistent with what the Ops dashboard is showing staff, not generic advice.
- Genuinely multilingual, not just a language picker: the system prompt tells Claude to reply in whatever language the attendee just wrote in, so it isn't limited to the five UI pills (EN/ES/PT/FR/DE) — anyone can type in any language and get an answer back in kind.
- The frontend auto-detects the attendee's language from what they type (no need to tap a pill first) to pick the right scripted fallback bank and highlight the matching pill — this only affects the offline fallback; the live Claude path already replies in-language by default.
- If the API is unreachable (no key configured, offline, rate-limited), the UI falls back gracefully to a scripted responder so the demo never breaks mid-presentation.

## Tech stack

- **Frontend:** Vite + React 19, Tailwind CSS v4
- **Charts:** Recharts (zone density bars, vendor wait times, sustainability donut)
- **Icons:** lucide-react
- **AI:** Anthropic Claude API (`claude-opus-4-8`) via `@anthropic-ai/sdk`, called server-side only
- **Backend:** Vercel serverless function (`api/assistant.js`)
- **Deployment:** Vercel

## Running locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

The dev server serves the frontend only — the `/api/assistant` route needs the Vercel dev server (`vercel dev`) or a deployed environment to respond. Without it, the assistant automatically falls back to scripted replies, so the rest of the app is fully usable either way.

## Deploying

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add an `ANTHROPIC_API_KEY` environment variable in the Vercel project settings (Settings → Environment Variables).
4. Deploy — Vercel auto-detects the Vite frontend and the `api/` serverless function.

## Project structure

```
stadiumsync/
├── api/
│   └── assistant.js       # Claude API call — server-side only
├── src/
│   ├── StadiumSync.jsx    # main app: onboarding, attendee tabs, staff tabs
│   ├── App.jsx
│   └── main.jsx
├── .env.example
└── package.json
```

# StadiumSync

A GenAI-powered companion for fans, organizers, and venue staff at Estadio Azteca during the FIFA World Cup 2026 — built for the PromptWars Challenge 4: *Smart Stadiums & Tournament Operations*.

**Live demo:** https://stadiumsync-sigma.vercel.app

---

## The problem

A World Cup stadium is one of the hardest real-time coordination problems in live events: 68,000+ people need directions, food, transport, and safety information at once, while staff need the same signal in aggregate to act on it — a gate approaching capacity, a vendor running low on stock, a spike in "nearest exit" questions that predicts a crowd surge before it happens. Static signage and a generic help desk can't keep up with conditions that change minute to minute.

## The solution

StadiumSync is one AI layer serving two audiences from the same live data:

- **Fans** get live wayfinding, food ordering, transport suggestions, and a multilingual AI assistant (English/Spanish/Portuguese) that answers questions grounded in real venue conditions — not generic chat.
- **Staff / organizers** get the aggregate view: zone density heatmaps, vendor wait times and stock alerts, sustainability tracking, and AI-flagged signals (e.g. "47 fans asked about the nearest exit near Gate 4 in 6 minutes — a 5x spike, deploy crowd marshals").

Every fan interaction feeds the same operational picture staff are watching — the pitch is "same AI, every role."

### Feature map

| Fan view | Staff view |
|---|---|
| Live wayfinding + zone crowd levels | Ops Pulse (live zone density, AI-flagged crowd signals) |
| Food ordering with AI wait-time picks | Vendor load + stock alerts |
| Multilingual AI assistant (EN/ES/PT) | Sustainability / waste diversion tracking |
| Transport + post-match surge prediction | |
| Accessibility (step-free routing, audio wayfinding) | |

Onboarding starts with a role picker — **Fan** or **Organizer / Staff** — mirroring how a real deployment would separate fan entry from staff tooling from the first screen, not just inside the app:

- **Fan tab:** pick an avatar (mascot-style illustrated characters), a name, and a ticket ID. Real ticket IDs are unique per fan, so there's no single "correct" value — any input that looks like a ticket ID (6+ letters/digits/dashes, e.g. `WC26-118014`) is accepted, the same way a lightweight client-side format check would work before hitting a real ticketing system. The chosen avatar then follows the fan through the app — the map, the header, and the assistant's chat bubbles.
- **Organizer / Staff tab:** enter the staff passcode and go straight to the Ops Console, no ticket required.

Both roles stay gated after entry too — a fan who taps "Organizer / Staff" mid-session is still prompted for the passcode if they haven't unlocked it yet:

| Role | Gate | How to pass it |
|---|---|---|
| Fan | Ticket ID format check at onboarding | Any ID-shaped string, 6+ letters/digits/dashes (e.g. `WC26-118014`) |
| Organizer / Staff | Fixed passcode, at onboarding or on the in-app role switch | `2026` |

These are stand-ins for real ticket verification and staff authentication — enough to show the access boundary exists without building a full auth backend for a hackathon demo.

## How GenAI is used

The in-app assistant (`AssistantTab`) is backed by **Claude (`claude-opus-4-8`)** via the Anthropic API — called from a Vercel serverless function (`api/assistant.js`), never directly from the browser, so the API key is never exposed to the client.

- The system prompt grounds every answer in the stadium's actual live state (zone density, gate congestion, vendor wait times, transit ETAs, accessibility routes) — so answers like "what's my fastest exit" are consistent with what the Ops dashboard is showing staff, not generic advice.
- Multilingual by design: the assistant replies in whatever language the fan writes in.
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
│   ├── StadiumSync.jsx    # main app: onboarding, fan tabs, staff tabs
│   ├── App.jsx
│   └── main.jsx
├── .env.example
└── package.json
```

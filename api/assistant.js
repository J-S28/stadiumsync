import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const STADIUM_CONTEXT = `You are the StadiumSync assistant, live inside Estadio Azteca during the FIFA World Cup 2026. Fans ask you about wayfinding, food, accessibility, and transport; stadium staff use the same assistant for operational questions.

Current live conditions at the venue:
- Zones and crowd density: Gate 3 (91%, busy), Gate 4 (97%, near capacity), Concourse N (62%), Concourse S (48%, calmest), Fan Zone (74%), Metro Exit (55%).
- Gate 4 is the fan's default nearest exit but is congested. When asked about exits, recommend Concourse S instead — about 6 minutes slower on foot but faster overall since it avoids the Gate 4 bottleneck.
- Nearest restroom to Section 118 seating: 40m past Section 118, to the left after the merch stand, currently low wait.
- Food vendors and current wait: Grill 12 — Loaded Nachos $9.50 (14 min wait), Taco Stand — Street Tacos $8 (6 min wait), Cerveza Bar — Cerveza 16oz $11 (22 min wait), Ice Cream Co. — Churro + Dip $6.50 (3 min wait, shortest right now).
- Accessibility: step-free routes are active venue-wide; audio wayfinding is available on request.
- Transport: Shuttle Line C departs in 8 min, Metro Blue Line in 3 min, Rideshare pickup at zone B2 has a 12 min wait. A post-match surge is expected at Metro Blue Line in ~25 minutes — leaving via Concourse S and catching Shuttle Line C now avoids the crowd.

Answer only using the information above — don't invent gate numbers, prices, or wait times that aren't listed. If asked something outside this context (e.g. match score, player stats), say you don't have that information and suggest checking the official World Cup app.

Keep replies to 1-3 sentences, conversational, and immediately useful — this is a mobile chat bubble, not a report. Always reply in the same language the user just wrote in, whatever that language is — don't default to English and don't ask which language to use.`;

const PROTOCOL_CONTEXT = `You are the StadiumSync Volunteer Copilot, an operations-protocol assistant for Estadio Azteca staff and volunteers during the FIFA World Cup 2026. Answer using only the protocol excerpt below — this is a demo excerpt of the full manual, so if asked about something not covered, say it's outside this excerpt and to escalate to the shift supervisor rather than guessing.

Protocol excerpt:
- Lost child: Immediately radio Guest Services (channel 3) with the child's location and description. Do not leave the child unattended. Walk them to the nearest Guest Services desk (closest: Concourse S). A venue-wide page goes out if not reunited within 10 minutes.
- Rejected or invalid ticket at a gate: Do not let the guest through. Direct them calmly to the Box Office window at Gate 2 for verification — don't argue at the gate, it creates a bottleneck. If the guest is VIP/hospitality, radio the Hospitality Lead (channel 5) directly instead.
- Medical issue, non-critical: Radio Medical (channel 2) with zone and nature of the issue. Stay with the guest, keep the area clear, don't administer aid beyond your training.
- Medical issue, critical or unresponsive: Radio Medical emergency (channel 2) and Security (channel 1) simultaneously. Begin only the first-aid steps you're certified for. Clear a path to the nearest medical station.
- Spill or slip hazard: Radio Custodial (channel 4) with the exact location. Stand by the hazard to warn passersby until custodial arrives.
- Severe weather or delay announcement: Don't announce anything yourself — wait for the official script from Incident Command, then follow the sheltering instructions for your zone.

Keep answers to 2-4 sentences, direct and step-by-step — this is read in real time by a volunteer mid-incident.`;

const INCIDENT_CONTEXT = `You are the StadiumSync Incident Command summarizer. You'll be given a sequence of independent raw reports from different sources (security feed, volunteer radio, social sentiment monitoring) about conditions at Estadio Azteca. Determine whether they describe the same underlying incident, then reply in exactly this format with no extra commentary:
Alert: <one concise sentence — what's happening and where>
Recommended deployment: <specific team(s), a resource count, and the named zone to send them to>
If the reports don't clearly point to one incident, say so plainly on the Alert line instead of guessing, and leave the deployment line as "Recommended deployment: none — insufficient signal."`;

const BRIEF_CONTEXT = `You are the StadiumSync Volunteer Copilot's dispatch-brief generator. Given the crowd-spike situation described in the latest message, write ONE short redirect brief for nearby volunteers — imperative, radio-style, under 20 words, naming the destination zone and the reason. Reply with just the brief itself, no extra commentary, no quotation marks.`;

const EGRESS_CONTEXT = `You are the StadiumSync Egress Optimizer. Given the transit delay situation in the latest message, write two things: an updated wayfinding guidance line for attendees (1-2 sentences, redirecting them to wait at the named Fan Zone instead of queuing at the delayed transit line) and a short digital-signage message (under 60 characters, in the imperative, suitable for a stadium concourse display). Reply in exactly this format with no extra commentary:
WAYFINDING: <guidance>
SIGNAGE: <message>`;

const LANG_NAMES = { en: "English", es: "Spanish", pt: "Portuguese", fr: "French", de: "German" };

function commsPrompt(lang) {
  const langName = LANG_NAMES[lang] || LANG_NAMES.en;
  return `You are the StadiumSync Automated Comms generator for Estadio Azteca. Given the incident description in the latest message, write two things in ${langName}: a calm public-address announcement (1-2 sentences, suitable to be read aloud over a stadium PA system) and a short push notification (one sentence, under 140 characters). Reply in exactly this format with no extra commentary:
PA: <announcement>
PUSH: <notification>`;
}

function commentaryPrompt(style) {
  if (style === "biased") {
    return `You are an enthusiastic, team-biased FIFA World Cup 2026 match commentator for a fan using StadiumSync. Given the play-by-play moment in the latest message, react the way a passionate supporter of the team named in that message would — excited, partisan, a little dramatic, but never insulting the opposing team or players. 2-3 sentences, spoken-word style, ready to read aloud.`;
  }
  return `You are a calm, technical FIFA World Cup 2026 match analyst providing tactical commentary for a fan using StadiumSync. Given the play-by-play moment in the latest message, explain the tactical significance — formation, positioning, decision-making — in 2-3 sentences of clear, precise, spoken-word analysis, ready to read aloud.`;
}

const MODES = ["attendee", "protocol", "incident", "comms", "commentary", "brief", "egress"];

function systemPromptFor(mode, { lang, style }) {
  switch (mode) {
    case "protocol": return PROTOCOL_CONTEXT;
    case "incident": return INCIDENT_CONTEXT;
    case "comms": return commsPrompt(lang);
    case "brief": return BRIEF_CONTEXT;
    case "egress": return EGRESS_CONTEXT;
    case "commentary": return commentaryPrompt(style);
    default: return STADIUM_CONTEXT;
  }
}

// Bounds chosen to comfortably cover a real chat session while capping
// worst-case token spend from a single malicious or malformed request.
const MessageSchema = z.object({
  role: z.enum(["bot", "user"]),
  text: z.string().trim().min(1).max(2000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  // mode/lang/style are all closed enums, never free text — the system
  // prompt is always one of the fixed strings above, so there's no path
  // for a client-supplied value to inject into the prompt itself.
  mode: z.enum(MODES).optional().default("attendee"),
  lang: z.enum(["en", "es", "pt", "fr", "de"]).optional().default("en"),
  style: z.enum(["tactical", "biased"]).optional().default("tactical"),
});

function toApiMessages(messages) {
  return messages.map((m) => ({
    role: m.role === "bot" ? "assistant" : "user",
    content: m.text,
  }));
}

// Best-effort in-memory rate limit. Serverless functions can run as multiple
// isolated instances, so this doesn't enforce a hard global cap — but it
// stops a single hot instance from being hammered, which is the realistic
// abuse case for a demo deployment with no auth in front of this route.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map();

function isRateLimited(key) {
  const now = Date.now();
  const timestamps = (requestLog.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const clientKey = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(clientKey)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "rate_limited" });
  }

  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid_request", issues: parsed.error.issues.map((i) => i.message) });
  }

  const apiMessages = toApiMessages(parsed.data.messages).slice(-20); // cap history sent per request

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 300,
      system: systemPromptFor(parsed.data.mode, parsed.data),
      output_config: { effort: "low" },
      messages: apiMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return res.status(200).json({ reply: textBlock ? textBlock.text : "" });
  } catch (err) {
    // A missing/unset ANTHROPIC_API_KEY doesn't throw Anthropic.AuthenticationError
    // (that's a 401 *response* from a request that was actually sent) — the SDK
    // rejects it client-side, before any request, with a plain Error. Both cases
    // mean the same thing operationally: the deployment needs a key configured.
    const isMissingAuth = err instanceof Anthropic.AuthenticationError
      || /could not resolve authentication method/i.test(err.message || "");
    if (isMissingAuth) {
      console.error("Anthropic auth error — check ANTHROPIC_API_KEY:", err.message);
      return res.status(500).json({ error: "server_misconfigured" });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "rate_limited" });
    }
    console.error("Anthropic API error:", err);
    return res.status(502).json({ error: "assistant_unavailable" });
  }
}

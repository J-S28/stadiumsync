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

// Bounds chosen to comfortably cover a real chat session while capping
// worst-case token spend from a single malicious or malformed request.
const MessageSchema = z.object({
  role: z.enum(["bot", "user"]),
  text: z.string().trim().min(1).max(2000),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
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
      system: STADIUM_CONTEXT,
      output_config: { effort: "low" },
      messages: apiMessages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return res.status(200).json({ reply: textBlock ? textBlock.text : "" });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
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

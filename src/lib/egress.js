// Pure parsing + offline fallback for the Egress Optimizer. The "egress"
// API mode replies in a fixed "WAYFINDING: / SIGNAGE:" format (see
// api/assistant.js) — this turns that back into structured data, and
// provides a fallback so the demo still works without a live API key.

export function parseEgressUpdate(text) {
  const wayfindingMatch = text.match(/WAYFINDING:\s*(.+)/i);
  const signageMatch = text.match(/SIGNAGE:\s*(.+)/i);
  return {
    wayfinding: wayfindingMatch ? wayfindingMatch[1].trim() : text.trim(),
    signage: signageMatch ? signageMatch[1].trim() : "",
  };
}

export const EGRESS_FALLBACK = {
  wayfinding: "Metro Blue Line is delayed — wayfinding updated to pace attendees toward Zócalo Fan Fest instead of queuing at the platform.",
  signage: "METRO DELAYED — WAIT AT ZÓCALO FAN FEST",
};

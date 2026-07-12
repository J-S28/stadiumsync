// Offline fallback bank for the Volunteer Copilot's protocol assistant,
// mirroring api/assistant.js's PROTOCOL_CONTEXT so the demo degrades
// gracefully without a live API key. Kept as pure, unit-tested logic
// separate from the CopilotTab component.
const PROTOCOL_REPLIES = [
  { keywords: ["child", "kid", "lost"], reply: "Radio Guest Services (channel 3) with the child's location and description. Don't leave the child unattended — walk them to the nearest Guest Services desk (closest: Concourse S)." },
  { keywords: ["ticket", "vip", "reject", "invalid"], reply: "Don't let the guest through. Direct them calmly to the Box Office window at Gate 2 for verification. If they're VIP/hospitality, radio the Hospitality Lead (channel 5) instead." },
  { keywords: ["medical", "unresponsive", "unconscious", "injur"], reply: "Radio Medical (channel 2). If critical or unresponsive, also radio Security (channel 1) simultaneously and clear a path to the nearest medical station." },
  { keywords: ["spill", "slip", "hazard", "wet"], reply: "Radio Custodial (channel 4) with the exact location, and stand by the hazard to warn passersby until they arrive." },
  { keywords: ["weather", "storm", "delay", "lightning"], reply: "Don't announce anything yourself — wait for the official script from Incident Command, then follow the sheltering instructions for your zone." },
];

const PROTOCOL_DEFAULT = "That's outside this protocol excerpt — escalate to your shift supervisor rather than guessing.";

export function pickProtocolReply(text) {
  const t = text.toLowerCase();
  const match = PROTOCOL_REPLIES.find((p) => p.keywords.some((k) => t.includes(k)));
  return match ? match.reply : PROTOCOL_DEFAULT;
}

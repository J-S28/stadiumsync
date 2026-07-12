// Pure parsing + offline fallbacks for the Incident Command tab. The
// incident-summarizer and automated-comms API modes are instructed to
// reply in a fixed "Label: value" format (see api/assistant.js) — these
// helpers turn that back into structured data, and provide a fallback so
// the demo still works without a live API key.

export function parseIncidentSummary(text) {
  const alertMatch = text.match(/Alert:\s*(.+)/i);
  const deployMatch = text.match(/Recommended deployment:\s*(.+)/i);
  return {
    alert: alertMatch ? alertMatch[1].trim() : text.trim(),
    deployment: deployMatch ? deployMatch[1].trim() : "",
  };
}

export function parseComms(text) {
  const paMatch = text.match(/PA:\s*(.+)/i);
  const pushMatch = text.match(/PUSH:\s*(.+)/i);
  return {
    pa: paMatch ? paMatch[1].trim() : text.trim(),
    push: pushMatch ? pushMatch[1].trim() : "",
  };
}

export const RAW_REPORTS = [
  { source: "Security feed", text: "Camera 14 (Concourse S near Gate 4) showing dense, slow-moving crowd for the last 4 minutes." },
  { source: "Volunteer radio", text: "Volunteer at Gate 4 reports guests backing up past the merch stand, getting frustrated." },
  { source: "Social sentiment", text: "12 posts in the last 5 minutes mentioning \"stuck at Gate 4\" and \"crowded exit\"." },
];

export const INCIDENT_FALLBACK = {
  alert: "Crowd backing up at Gate 4 — consistent across security, volunteer, and social reports over the last 5 minutes.",
  deployment: "Dispatch 2 crowd marshals and 1 guest-services volunteer to Gate 4.",
};

export const COMMS_FALLBACK = {
  pa: "Attention guests near Gate 4: for a faster exit, please use Concourse S. Staff are on hand to assist.",
  push: "Gate 4 is busy right now — try Concourse S for a faster way out.",
};

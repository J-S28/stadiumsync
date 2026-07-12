// Thin client for POST /api/assistant, shared by every module that talks to
// Claude (the attendee assistant, the volunteer protocol copilot, the
// incident summarizer, automated comms, and match commentary). Centralizing
// this keeps the request shape and error handling in one place instead of
// duplicated per-tab fetch calls.
export async function callAssistant({ messages, mode = "attendee", lang = "en", style = "tactical" }) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, mode, lang, style }),
  });
  if (!res.ok) throw new Error("assistant request failed");
  const data = await res.json();
  return data.reply || "";
}

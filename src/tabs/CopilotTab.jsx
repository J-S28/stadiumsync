import { useState, useRef, useEffect } from "react";
import { Send, Users, CheckCircle2 } from "lucide-react";
import { Card, SectionLabel, AIBadge } from "../shared/ui.jsx";
import { callAssistant } from "../lib/callAssistant.js";
import { pickProtocolReply } from "../lib/protocol.js";

export default function CopilotTab() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Volunteer Copilot ready. Ask about a protocol — e.g. \"lost child\" or \"rejected ticket\"." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinged, setPinged] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { from: "user", text: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    try {
      const reply = await callAssistant({ mode: "protocol", messages: history.map((m) => ({ role: m.from, text: m.text })) });
      setMessages((m) => [...m, { from: "bot", text: reply || pickProtocolReply(userMsg.text) }]);
    } catch {
      // Offline / API-key-not-configured fallback so the demo still works
      setMessages((m) => [...m, { from: "bot", text: pickProtocolReply(userMsg.text) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Protocol assistant</SectionLabel>
          <AIBadge />
        </div>
        <div className="flex flex-col h-64">
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1" role="log" aria-live="polite" aria-label="Conversation with the protocol assistant">
            {messages.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.from === "bot" ? "self-start bg-[#16281F] text-[#F3F3EF] rounded-bl-sm" : "self-end bg-[#3ED07A] text-[#0B140F] rounded-br-sm"}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="self-start text-[#8FA69B] text-xs">Checking protocol…</div>}
            <div ref={endRef} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="e.g. What's the protocol for a lost child?"
              aria-label="Ask the protocol assistant"
              disabled={loading}
              className="flex-1 bg-[#16281F] border border-[#223328] rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none focus:border-[#3ED07A] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#3ED07A]"
            />
            <button onClick={send} disabled={loading} aria-label="Send" className="w-10 h-10 rounded-full bg-[#3ED07A] flex items-center justify-center shrink-0 hover:brightness-105 active:scale-95 transition disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none">
              <Send size={16} className="text-[#0B140F]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Dynamic re-routing</SectionLabel>
          <AIBadge label="AI brief" />
        </div>
        <div className="flex items-start gap-2.5 bg-[#FFC24B]/10 border border-[#FFC24B]/25 rounded-xl p-3.5">
          <Users size={16} className="text-[#FFC24B] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm text-[#F3F3EF] flex-1">
            Ops Pulse flagged a crowd spike at Gate 4. 3 volunteers near Concourse S are the closest available.
            {pinged ? (
              <div className="flex items-center gap-1.5 mt-2.5 text-[#3ED07A] text-xs font-semibold" role="status">
                <CheckCircle2 size={13} aria-hidden="true" /> Brief sent: "Redirect to Gate 4 — crowd spike, assist with flow control. ETA 2 min."
              </div>
            ) : (
              <button
                onClick={() => setPinged(true)}
                className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#FFC24B] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#FFC24B] focus-visible:outline-none"
              >
                Ping nearby volunteers
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

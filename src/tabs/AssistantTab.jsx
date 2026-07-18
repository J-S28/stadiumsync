import { useState, useRef, useEffect } from "react";
import { Send, Radio } from "lucide-react";
import { Card, Pill } from "../shared/ui.jsx";
import { AVATARS } from "../shared/data.js";
import { BotAvatar } from "../shared/avatars.jsx";
import { ASSISTANT_SCRIPT, detectLang, pickReply } from "../lib/assistant.js";
import { callAssistant } from "../lib/callAssistant.js";

// Hoisted so this list isn't reallocated on every render.
const LANGS = [["en", "EN", "English"], ["es", "ES", "Spanish"], ["pt", "PT", "Portuguese"], ["fr", "FR", "French"], ["de", "DE", "German"]];

export default function AssistantTab({ profile }) {
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([{ from: "bot", text: ASSISTANT_SCRIPT.en.greet }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const UserAvatar = AVATARS[profile.avatar].Comp;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Manually tapping a language pill starts a fresh chat in that language.
  const selectLang = (code) => {
    setLang(code);
    setMessages([{ from: "bot", text: ASSISTANT_SCRIPT[code].greet }]);
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    // Auto-detect the language of what was typed so the fan never has to tap
    // a pill first — only the fallback script bank changes; the conversation
    // itself isn't reset (unlike selectLang, which is an explicit restart).
    const detected = detectLang(input);
    const activeLang = detected || lang;
    if (detected && detected !== lang) setLang(detected);

    const userMsg = { from: "user", text: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const reply = await callAssistant({ messages: history.map((m) => ({ role: m.from, text: m.text })) });
      setMessages((m) => [...m, { from: "bot", text: reply || pickReply(activeLang, userMsg.text) }]);
    } catch {
      // Offline / API-key-not-configured fallback so the demo still works
      setMessages((m) => [...m, { from: "bot", text: pickReply(activeLang, userMsg.text) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px]">
      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
        {LANGS.map(([code, label, full]) => (
          <button
            key={code}
            onClick={() => selectLang(code)}
            aria-pressed={lang === code}
            aria-label={full}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition shrink-0 focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${lang === code ? "bg-[#3ED07A] text-[#0B140F] border-[#3ED07A]" : "bg-transparent text-[#8FA69B] border-[#223328]"}`}
          >
            {label}
          </button>
        ))}
        <Pill tone="live"><Radio size={10} /> Multilingual AI</Pill>
      </div>
      <p className="text-[10px] text-[#8FA69B] mb-3 -mt-1.5">Auto-detects the language you type in — tap a pill to switch manually.</p>

      <Card className="flex-1 p-4 overflow-y-auto flex flex-col gap-3" role="log" aria-live="polite" aria-label="Conversation with the StadiumSync assistant">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.from === "bot" ? "self-start flex-row" : "self-end flex-row-reverse"}`}>
            {m.from === "bot" ? (
              <div className="w-7 h-7 rounded-full bg-[#0F231A] border border-[#3ED07A]/40 flex items-center justify-center shrink-0 overflow-hidden">
                <BotAvatar size={26} />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                <UserAvatar size={28} />
              </div>
            )}
            <div className={`max-w-[220px] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${m.from === "bot" ? "bg-[#16281F] text-[#F3F3EF] rounded-bl-sm" : "bg-[#3ED07A] text-[#0B140F] rounded-br-sm"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2 self-start">
            <div className="w-7 h-7 rounded-full bg-[#0F231A] border border-[#3ED07A]/40 flex items-center justify-center shrink-0 overflow-hidden">
              <BotAvatar size={26} />
            </div>
            <div className="bg-[#16281F] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8FA69B] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8FA69B] animate-bounce" style={{ animationDelay: "120ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8FA69B] animate-bounce" style={{ animationDelay: "240ms" }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </Card>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about restrooms, exits, food..."
          aria-label="Message the assistant"
          disabled={loading}
          className="flex-1 bg-[#16281F] border border-[#223328] rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none focus:border-[#3ED07A] disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#3ED07A]"
        />
        <button onClick={send} disabled={loading} aria-label="Send message" className="w-10 h-10 rounded-full bg-[#3ED07A] flex items-center justify-center shrink-0 hover:brightness-105 active:scale-95 transition disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none">
          <Send size={16} className="text-[#0B140F]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

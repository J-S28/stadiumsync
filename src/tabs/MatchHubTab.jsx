import { useState } from "react";
import { Clapperboard, Volume2, ScanEye } from "lucide-react";
import { Card, SectionLabel, Pill, AIBadge } from "../shared/ui.jsx";
import { callAssistant } from "../lib/callAssistant.js";
import { COMMENTARY_FALLBACK } from "../lib/commentary.js";
import { useSpeechSynthesis } from "../lib/speech.js";

const MOMENTS = ["Corner kick won", "Near miss on goal", "Great tackle to break up an attack", "Goal!"];
// Hoisted so this tuple isn't reallocated on every render.
const COMMENTARY_STYLES = [["tactical", "Tactical"], ["biased", "Team-biased"]];

export default function MatchHubTab() {
  const [style, setStyle] = useState("tactical");
  const [team, setTeam] = useState("the host nation");
  const [moment, setMoment] = useState(null);
  const [commentary, setCommentary] = useState(null);
  const [loading, setLoading] = useState(false);
  const { speaking, speak, stop } = useSpeechSynthesis();

  // Tapping a moment IS the toggle — commentary generates and plays
  // immediately, the way a live commentary feed would react to play as it
  // happens, rather than a separate generate-then-play form.
  const selectMoment = async (m) => {
    setMoment(m);
    setLoading(true);
    setCommentary(null);
    let text;
    try {
      const reply = await callAssistant({ mode: "commentary", style, messages: [{ role: "user", text: `${team} — ${m}` }] });
      text = reply || COMMENTARY_FALLBACK[style];
    } catch {
      text = COMMENTARY_FALLBACK[style];
    } finally {
      setLoading(false);
    }
    setCommentary(text);
    speak(text);
  };

  const toggleSpeak = () => {
    if (speaking) {
      stop();
      return;
    }
    speak(commentary);
  };

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>AI commentary feed</SectionLabel>
          <AIBadge label="AI commentary" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3 bg-[#0B140F] border border-[#223328] rounded-2xl p-1.5" role="tablist" aria-label="Commentary style">
          {COMMENTARY_STYLES.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStyle(id)}
              role="tab"
              aria-selected={style === id}
              className={`py-2 rounded-xl text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${style === id ? "bg-[#3ED07A] text-[#0B140F]" : "text-[#8FA69B]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <label htmlFor="team-name" className="sr-only">Team</label>
        <input
          id="team-name"
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="e.g. Mexico"
          maxLength={40}
          className="w-full bg-[#16281F] border border-[#223328] rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none focus:border-[#3ED07A] mb-3 focus-visible:ring-2 focus-visible:ring-[#3ED07A]"
        />
        <p className="text-[10px] text-[#8FA69B] mb-2 -mt-1.5">Tap a moment to hear commentary immediately, like a live feed reacting to the match.</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {MOMENTS.map((m) => (
            <button
              key={m}
              onClick={() => selectMoment(m)}
              disabled={loading}
              aria-pressed={moment === m}
              className={`px-2.5 py-1 rounded-full text-xs border transition disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${moment === m ? "bg-[#3ED07A]/15 text-[#3ED07A] border-[#3ED07A]/40" : "bg-transparent text-[#8FA69B] border-[#223328]"}`}
            >
              {m}
            </button>
          ))}
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#8FA69B]" role="status">
            <Clapperboard size={14} className="shrink-0" aria-hidden="true" /> Generating commentary…
          </div>
        )}
        {commentary && !loading && (
          <div className="bg-[#16281F] rounded-xl p-3.5 flex items-start gap-2.5" role="status">
            <Clapperboard size={15} className="text-[#3ED07A] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="flex-1 text-sm text-[#F3F3EF] leading-relaxed">{commentary}</div>
            <button
              onClick={toggleSpeak}
              aria-label={speaking ? "Stop commentary playback" : "Play commentary aloud"}
              aria-pressed={speaking}
              className="shrink-0 w-8 h-8 rounded-full bg-[#223328] flex items-center justify-center text-[#8FA69B] hover:text-[#F3F3EF] focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"
            >
              <Volume2 size={14} className={speaking ? "text-[#3ED07A] animate-pulse" : ""} aria-hidden="true" />
            </button>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>AR match stats</SectionLabel>
          <Pill tone="alert">Concept preview</Pill>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-[#0B140F] h-40 flex items-center justify-center border border-[#223328]">
          {/* Decorative heat-map blobs standing in for a real positional heat map */}
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute w-24 h-24 rounded-full bg-[#FF6B5B]/25 blur-2xl" style={{ left: "30%", top: "35%" }} />
            <div className="absolute w-20 h-20 rounded-full bg-[#FFC24B]/25 blur-2xl" style={{ left: "58%", top: "50%" }} />
            <div className="absolute w-16 h-16 rounded-full bg-[#3ED07A]/20 blur-2xl" style={{ left: "45%", top: "20%" }} />
          </div>
          <ScanEye size={28} className="text-[#3ED07A]/40 relative" aria-hidden="true" />
          <div className="absolute top-3 left-3 text-[10px] text-[#F3F3EF] bg-[#0B140F]/80 px-2 py-1 rounded">Vinícius Jr. — 8.2 km/h</div>
          <div className="absolute bottom-3 right-3 text-[10px] text-[#FFC24B] bg-[#0B140F]/80 px-2 py-1 rounded">Possession: 61%</div>
        </div>
        <p className="text-[11px] text-[#8FA69B] mt-2.5 leading-relaxed">
          Concept preview — a live AR overlay needs camera access and a real-time broadcast feed, which isn't available in this demo build. Shown here is the intended layout: player names, running speeds, and a positional heat map.
        </p>
      </Card>
    </div>
  );
}

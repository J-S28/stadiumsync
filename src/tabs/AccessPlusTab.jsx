import { useState, useEffect } from "react";
import { Volume2, Clock, Captions, AlertTriangle } from "lucide-react";
import { Card, SectionLabel, Pill } from "../shared/ui.jsx";

const QUIET_ROOMS = [
  { name: "Quiet Room — Concourse S", wait: "No wait" },
  { name: "Quiet Room — Concourse N", wait: "2 min" },
];

const CAPTION_FEED = [
  "Kickoff in 5 minutes — please take your seats.",
  "Reminder: step-free routes are available at every concourse.",
  "Halftime entertainment begins in 3 minutes, including pyrotechnics near the north stand.",
];

export default function AccessPlusTab() {
  const [noiseWarnings, setNoiseWarnings] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);

  useEffect(() => {
    if (!captionsOn) return;
    const id = setInterval(() => setCaptionIndex((i) => (i + 1) % CAPTION_FEED.length), 6000);
    return () => clearInterval(id);
  }, [captionsOn]);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Sensory management</SectionLabel>
        <div className="space-y-2.5 mb-4">
          {QUIET_ROOMS.map((r) => (
            <div key={r.name} className="flex items-center justify-between bg-[#16281F] rounded-xl p-3">
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-[#3ED07A]" aria-hidden="true" />
                <span className="text-sm text-[#F3F3EF]">{r.name}</span>
              </div>
              <Pill tone={r.wait === "No wait" ? "live" : "default"}>{r.wait}</Pill>
            </div>
          ))}
        </div>
        <button
          onClick={() => setNoiseWarnings((v) => !v)}
          aria-pressed={noiseWarnings}
          className={`w-full flex items-center gap-2.5 rounded-xl p-3 text-left transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${noiseWarnings ? "bg-[#16281F]" : "bg-[#16281F] opacity-60"}`}
        >
          <Volume2 size={16} className={`shrink-0 ${noiseWarnings ? "text-[#3ED07A]" : "text-[#8FA69B]"}`} aria-hidden="true" />
          <div>
            <div className="text-sm text-[#F3F3EF] leading-tight">Loud-moment warnings</div>
            <div className="text-[11px] text-[#8FA69B]">{noiseWarnings ? "On — you'll be warned before pyrotechnics or halftime shows" : "Off"}</div>
          </div>
        </button>
        {noiseWarnings && (
          <div className="mt-3 flex items-start gap-2 bg-[#FFC24B]/10 border border-[#FFC24B]/25 rounded-xl p-3" role="status">
            <AlertTriangle size={15} className="text-[#FFC24B] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#F3F3EF]">
              Loud moment coming up: pyrotechnics expected at halftime (~12 min). The quiet room near Concourse S is closest to your seat.
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Live captions</SectionLabel>
          <button
            onClick={() => setCaptionsOn((v) => !v)}
            aria-pressed={captionsOn}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${captionsOn ? "bg-[#3ED07A] text-[#0B140F] border-[#3ED07A]" : "bg-transparent text-[#8FA69B] border-[#223328]"}`}
          >
            {captionsOn ? "On" : "Off"}
          </button>
        </div>
        {captionsOn ? (
          <div className="bg-[#0B140F] rounded-xl p-4 flex items-start gap-2.5" role="status" aria-live="polite">
            <Captions size={16} className="text-[#3ED07A] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#F3F3EF] leading-relaxed">{CAPTION_FEED[captionIndex]}</div>
          </div>
        ) : (
          <div className="text-sm text-[#8FA69B]">Turn on to see real-time captions of PA announcements.</div>
        )}
        <p className="text-[11px] text-[#8FA69B] mt-2.5 leading-relaxed">
          A sign-language avatar is planned but needs a dedicated generation model not available in this demo build — live captions are the functional accessibility feature shipped today.
        </p>
      </Card>
    </div>
  );
}

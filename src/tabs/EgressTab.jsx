import { useState, useEffect } from "react";
import { DoorOpen, TrafficCone, CheckCircle2, MonitorPlay } from "lucide-react";
import { Card, SectionLabel, SectionHeader, Pill, AIBadge } from "../shared/ui.jsx";
import { callAssistant } from "../lib/callAssistant.js";
import { EGRESS_FALLBACK, parseEgressUpdate } from "../lib/egress.js";

const EGRESS_FAN_ZONES = [
  { name: "Zócalo Fan Fest", wait: "Low" },
  { name: "Paseo de la Reforma Fan Zone", wait: "Moderate" },
];

// Shared with StadiumSync's top-level `transitDelayed` state, so toggling
// this here is what actually drives the attendee Transport tab's live
// wayfinding update — not an isolated card, the two views of one signal.
export default function EgressTab({ transitDelayed, setTransitDelayed }) {
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transitDelayed) {
      setUpdate(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    callAssistant({
      mode: "egress",
      messages: [{ role: "user", text: "Metro Blue Line is reporting a 12-minute delay at Estadio Azteca." }],
    })
      .then((reply) => { if (!cancelled) setUpdate(reply ? parseEgressUpdate(reply) : EGRESS_FALLBACK); })
      .catch(() => { if (!cancelled) setUpdate(EGRESS_FALLBACK); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [transitDelayed]);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionHeader label="Transit-linked pacing" badge={<AIBadge label="AI pacing" />} />
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[#F3F3EF]">Metro Blue Line status</div>
          <Pill tone={transitDelayed ? "danger" : "live"}>{transitDelayed ? "12 min delay" : "On time"}</Pill>
        </div>

        {transitDelayed ? (
          loading ? (
            <div className="flex items-center gap-2 text-sm text-[#8FA69B]" role="status">
              <TrafficCone size={16} className="shrink-0" aria-hidden="true" /> Generating AI wayfinding update…
            </div>
          ) : update ? (
            <div className="space-y-3" role="status">
              <div className="flex items-start gap-2.5 bg-[#FF6B5B]/10 border border-[#FF6B5B]/25 rounded-xl p-3.5">
                <TrafficCone size={16} className="text-[#FF6B5B] mt-0.5 shrink-0" aria-hidden="true" />
                <div className="text-sm text-[#F3F3EF] flex-1">{update.wayfinding}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#8FA69B] mb-1.5 uppercase tracking-wide">
                  <MonitorPlay size={11} aria-hidden="true" /> Digital signage preview
                </div>
                <div className="bg-[#0B140F] border border-[#223328] rounded-lg px-3.5 py-3 font-mono text-[13px] text-[#3ED07A] tracking-wide">
                  {update.signage}
                </div>
              </div>
            </div>
          ) : null
        ) : (
          <div className="flex items-start gap-2.5 bg-[#3ED07A]/10 border border-[#3ED07A]/25 rounded-xl p-3.5">
            <CheckCircle2 size={16} className="text-[#3ED07A] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#F3F3EF] flex-1">
              Egress pacing normal — standard post-match wayfinding is active.
            </div>
          </div>
        )}

        <button
          onClick={() => setTransitDelayed((d) => !d)}
          aria-pressed={transitDelayed}
          className="mt-3 px-3.5 py-1.5 rounded-full bg-[#16281F] border border-[#223328] text-[#F3F3EF] text-xs font-semibold hover:border-[#2E4A3B] transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"
        >
          {transitDelayed ? "Clear simulated delay" : "Simulate transit delay"}
        </button>
        <p className="text-[11px] text-[#8FA69B] mt-2">
          This toggle stands in for a live transit-delay feed. Once "reported," the wayfinding update above and the attendee Transport tab both react automatically — no separate action needed.
        </p>
      </Card>

      <Card className="p-5">
        <SectionLabel>Egress-linked Fan Zones</SectionLabel>
        <div className="space-y-2.5">
          {EGRESS_FAN_ZONES.map((z) => (
            <div key={z.name} className="flex items-center justify-between bg-[#16281F] rounded-xl p-3">
              <div className="flex items-center gap-2.5">
                <DoorOpen size={15} className="text-[#3ED07A]" aria-hidden="true" />
                <span className="text-sm text-[#F3F3EF]">{z.name}</span>
              </div>
              <Pill tone={z.wait === "Low" ? "live" : "alert"}>{z.wait} wait</Pill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

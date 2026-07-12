import { useState } from "react";
import { DoorOpen, TrafficCone, CheckCircle2 } from "lucide-react";
import { Card, SectionLabel, Pill, AIBadge } from "../shared/ui.jsx";

const EGRESS_FAN_ZONES = [
  { name: "Zócalo Fan Fest", wait: "Low" },
  { name: "Paseo de la Reforma Fan Zone", wait: "Moderate" },
];

export default function EgressTab() {
  const [delayed, setDelayed] = useState(false);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Transit-linked pacing</SectionLabel>
          <AIBadge label="AI pacing" />
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[#F3F3EF]">Metro Blue Line status</div>
          <Pill tone={delayed ? "danger" : "live"}>{delayed ? "12 min delay" : "On time"}</Pill>
        </div>
        {delayed ? (
          <div className="flex items-start gap-2.5 bg-[#FF6B5B]/10 border border-[#FF6B5B]/25 rounded-xl p-3.5" role="status">
            <TrafficCone size={16} className="text-[#FF6B5B] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#F3F3EF] flex-1">
              Transit delay detected. Wayfinding and digital signage updated to slow egress pacing — attendees near Gate 4 are being routed to the Fan Zone to wait it out instead of queuing at Metro Blue Line.
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 bg-[#3ED07A]/10 border border-[#3ED07A]/25 rounded-xl p-3.5">
            <CheckCircle2 size={16} className="text-[#3ED07A] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#F3F3EF] flex-1">
              Egress pacing normal — standard post-match wayfinding is active.
            </div>
          </div>
        )}
        <button
          onClick={() => setDelayed((d) => !d)}
          aria-pressed={delayed}
          className="mt-3 px-3.5 py-1.5 rounded-full bg-[#16281F] border border-[#223328] text-[#F3F3EF] text-xs font-semibold hover:border-[#2E4A3B] transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"
        >
          {delayed ? "Clear simulated delay" : "Simulate transit delay"}
        </button>
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

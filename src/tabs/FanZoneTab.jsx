import { useState } from "react";
import { MapPinned, Music2, CheckCircle2 } from "lucide-react";
import { Card, SectionLabel, Pill } from "../shared/ui.jsx";

const FAN_ZONES = [
  { id: "zocalo", name: "Zócalo Fan Fest", distance: "3.2 km", wait: "Low", tone: "live" },
  { id: "reforma", name: "Paseo de la Reforma Fan Zone", distance: "5.8 km", wait: "Moderate", tone: "alert" },
];

const MUSIC_SCHEDULE = [
  { time: "6:00 PM", act: "Mariachi Zócalo Ensemble" },
  { time: "8:30 PM", act: "DJ set — post-match celebration" },
];

export default function FanZoneTab() {
  const [routed, setRouted] = useState(null);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Nearby Fan Zones</SectionLabel>
        <div className="space-y-2.5">
          {FAN_ZONES.map((z) => (
            <div key={z.id} className="flex items-center justify-between bg-[#16281F] rounded-xl p-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPinned size={14} className="text-[#3ED07A]" aria-hidden="true" />
                  <span className="text-sm text-[#F3F3EF]">{z.name}</span>
                </div>
                <div className="text-[11px] text-[#8FA69B] mt-1 ml-[22px]">{z.distance} from stadium seat</div>
              </div>
              <Pill tone={z.tone}>{z.wait} wait</Pill>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>Live music schedule</SectionLabel>
        <div className="space-y-2">
          {MUSIC_SCHEDULE.map((m) => (
            <div key={m.time} className="flex items-center gap-2.5 text-sm">
              <Music2 size={14} className="text-[#FFC24B]" aria-hidden="true" />
              <span className="text-[#8FA69B] w-16">{m.time}</span>
              <span className="text-[#F3F3EF]">{m.act}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>Seat-to-Fan-Zone routing</SectionLabel>
        <p className="text-sm text-[#F3F3EF] leading-relaxed mb-3">
          Seamless transit from Section 118, Seat 14 straight to the Zócalo Fan Fest entrance — no need to plan the transfer yourself.
        </p>
        {routed ? (
          <div className="flex items-center gap-1.5 text-[#3ED07A] text-xs font-semibold" role="status">
            <CheckCircle2 size={13} aria-hidden="true" /> Showing route to {routed}
          </div>
        ) : (
          <button
            onClick={() => setRouted("Zócalo Fan Fest")}
            className="px-3.5 py-1.5 rounded-full bg-[#3ED07A] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none"
          >
            Route me there
          </button>
        )}
      </Card>
    </div>
  );
}

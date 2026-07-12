import { useState } from "react";
import { MapPinned, Music2, CheckCircle2, Radio } from "lucide-react";
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
  const [routed, setRouted] = useState(false);

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
        <svg viewBox="0 0 320 140" className="w-full h-32 rounded-xl bg-[#0B140F] mb-2">
          <ellipse cx="70" cy="105" rx="46" ry="22" fill="none" stroke="#223328" strokeWidth="2" />
          <ellipse cx="70" cy="105" rx="28" ry="13" fill="#16281F" stroke="#3ED07A" strokeWidth="1.2" opacity="0.5" />
          <text x="70" y="109" fill="#8FA69B" fontSize="8" textAnchor="middle">Seat 118-14</text>

          <path
            d="M 100 90 Q 190 30 270 30"
            fill="none"
            stroke={routed ? "#3ED07A" : "#FFC24B"}
            strokeWidth={routed ? 2.5 : 2}
            strokeDasharray={routed ? "0" : "5 4"}
            strokeLinecap="round"
            style={{ transition: "stroke 0.2s" }}
          />
          {routed && (
            <circle r="4" fill="#3ED07A">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 100 90 Q 190 30 270 30" />
            </circle>
          )}

          <circle cx="70" cy="105" r="5" fill="#F3F3EF" stroke="#3ED07A" strokeWidth="2" />
          <circle cx="270" cy="30" r={routed ? 7 : 5} fill={routed ? "#3ED07A" : "#FFC24B"}>
            {routed && <animate attributeName="r" values="7;9;7" dur="1s" repeatCount="indefinite" />}
          </circle>
          <text x="270" y="18" fill={routed ? "#F3F3EF" : "#8FA69B"} fontSize="9" fontWeight={routed ? "700" : "400"} textAnchor="middle">Zócalo Fan Fest</text>
        </svg>
        {routed && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#3ED07A] mb-2">
            <Radio size={10} className="animate-pulse" aria-hidden="true" /> Live route — updating as you walk
          </div>
        )}
        <p className="text-sm text-[#F3F3EF] leading-relaxed mb-3">
          Seamless transit from Section 118, Seat 14 straight to the Zócalo Fan Fest entrance — no need to plan the transfer yourself.
        </p>
        {routed ? (
          <div className="flex items-center gap-1.5 text-[#3ED07A] text-xs font-semibold" role="status">
            <CheckCircle2 size={13} aria-hidden="true" /> Showing route to Zócalo Fan Fest
          </div>
        ) : (
          <button
            onClick={() => setRouted(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#3ED07A] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none"
          >
            Route me there
          </button>
        )}
      </Card>
    </div>
  );
}

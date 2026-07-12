import { useState, useCallback, memo } from "react";
import { Bus, Navigation, MapPin, AlertTriangle, Radio, CheckCircle2 } from "lucide-react";
import { Card, SectionLabel, Pill, AIBadge } from "../shared/ui.jsx";
import { hapticTick } from "../lib/haptics.js";

const TRANSPORT_ROUTES = [
  {
    id: "shuttle", icon: Bus, name: "Shuttle Line C", eta: "8 min", tone: "live",
    path: "M 160 108 Q 100 70 55 40", dest: { x: 55, y: 40 }, label: { x: 55, y: 30, text: "Shuttle C" },
  },
  {
    id: "metro", icon: Navigation, name: "Metro — Blue Line", eta: "3 min", tone: "live",
    path: "M 160 106 Q 160 60 160 18", dest: { x: 160, y: 18 }, label: { x: 160, y: 12, text: "Metro" },
  },
  {
    id: "rideshare", icon: MapPin, name: "Rideshare pickup B2", eta: "12 min wait", tone: "alert",
    path: "M 160 108 Q 220 70 265 42", dest: { x: 265, y: 42 }, label: { x: 265, y: 32, text: "Rideshare B2" },
  },
];

// Memoized so selecting one route only re-renders the row whose selected
// state actually flipped, not the whole route list.
const RouteRow = memo(function RouteRow({ route, isSelected, onToggle }) {
  return (
    <button
      onClick={() => onToggle(route.id)}
      aria-pressed={isSelected}
      className={`w-full flex items-center justify-between rounded-xl p-3.5 text-left border transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${
        isSelected ? "bg-[#1B3326] border-[#3ED07A]/50" : "bg-[#16281F] border-transparent hover:border-[#2E4A3B]"
      }`}
    >
      <div className="flex items-center gap-3">
        <route.icon size={17} className="text-[#3ED07A]" aria-hidden="true" />
        <span className="text-[#F3F3EF] text-sm">{route.name}</span>
      </div>
      <Pill tone={route.tone}>{route.eta}</Pill>
    </button>
  );
});

export default function TransportTab({ transitDelayed }) {
  const [selected, setSelected] = useState(null);
  // The Ops Console's Egress Optimizer flips this shared flag — when it's
  // on, Metro Blue Line's own entry reflects the delay directly instead of
  // this tab having its own separate idea of what's happening.
  const routes = transitDelayed
    ? TRANSPORT_ROUTES.map((r) => (r.id === "metro" ? { ...r, eta: "delayed 12 min", tone: "alert" } : r))
    : TRANSPORT_ROUTES;
  const active = routes.find((r) => r.id === selected);
  const toggleRoute = useCallback((id) => setSelected((s) => (s === id ? null : id)), []);

  return (
    <div className="space-y-4">
      {transitDelayed && (
        <Card className="p-4 flex items-start gap-2.5 bg-[#FF6B5B]/10 border-[#FF6B5B]/25">
          <AlertTriangle size={16} className="text-[#FF6B5B] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm text-[#F3F3EF] flex-1">
            <span className="font-medium">Egress Optimizer:</span> Metro Blue Line is delayed. Wayfinding updated to pace you toward Zócalo Fan Fest instead of queuing at the platform.
          </div>
        </Card>
      )}

      <Card className="p-5">
        <SectionLabel>Routes from the stadium</SectionLabel>
        <svg viewBox="0 0 320 150" className="w-full h-36 rounded-xl bg-[#0B140F] mb-1">
          <ellipse cx="160" cy="118" rx="60" ry="20" fill="none" stroke="#223328" strokeWidth="2" />
          <ellipse cx="160" cy="118" rx="38" ry="12" fill="#16281F" stroke="#3ED07A" strokeWidth="1.2" opacity="0.5" />

          {routes.map((r) => {
            const isSelected = r.id === selected;
            const dimmed = selected && !isSelected;
            const color = r.tone === "alert" ? "#FFC24B" : "#3ED07A";
            return (
              <g key={r.id} opacity={dimmed ? 0.25 : 1} style={{ transition: "opacity 0.2s" }}>
                <path d={r.path} fill="none" stroke={color} strokeWidth={isSelected ? 3 : 2} strokeDasharray={isSelected ? "0" : "5 4"} />
                <circle cx={r.dest.x} cy={r.dest.y} r={isSelected ? 7 : 5} fill={color}>
                  {isSelected && <animate attributeName="r" values="7;9;7" dur="1s" repeatCount="indefinite" />}
                </circle>
                <text x={r.label.x} y={r.label.y} fill={isSelected ? "#F3F3EF" : "#8FA69B"} fontSize={isSelected ? 10 : 9} fontWeight={isSelected ? "700" : "400"} textAnchor="middle">{r.label.text}</text>
              </g>
            );
          })}

          {/* You / stadium exit */}
          <circle cx="160" cy="118" r="6" fill="#F3F3EF" stroke="#3ED07A" strokeWidth="2">
            <animate attributeName="r" values="6;8;6" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <text x="160" y="140" fill="#8FA69B" fontSize="9" textAnchor="middle">You</text>
        </svg>
        {active && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#3ED07A] mt-1">
            <Radio size={10} className="animate-pulse" /> Showing {active.name} — {active.eta}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <SectionLabel>Get home</SectionLabel>
        <div className="space-y-3">
          {routes.map((r) => (
            <RouteRow key={r.id} route={r} isSelected={selected === r.id} onToggle={toggleRoute} />
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>AI suggestion</SectionLabel>
          <AIBadge />
        </div>
        <p className="text-sm text-[#F3F3EF] leading-relaxed mb-3">
          Post-match surge expected at Metro Blue Line in ~25 min. Leaving via Concourse S and taking Shuttle Line C now avoids the crowd and saves you roughly 15 minutes.
        </p>
        {selected === "shuttle" ? (
          <div className="flex items-center gap-1.5 text-[#3ED07A] text-xs font-semibold">
            <CheckCircle2 size={13} aria-hidden="true" /> Shuttle Line C selected above
          </div>
        ) : (
          <button
            onClick={() => { hapticTick(); setSelected("shuttle"); }}
            className="px-3.5 py-1.5 rounded-full bg-[#3ED07A] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none"
          >
            Use this route
          </button>
        )}
      </Card>
    </div>
  );
}

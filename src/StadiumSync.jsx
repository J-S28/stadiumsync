import React, { useState, useEffect, memo, lazy, Suspense } from "react";
import {
  MapPin, Utensils, MessageCircle, Bus, Activity, Users, AlertTriangle,
  Package, Leaf,
  Volume2, Accessibility, ShieldCheck,
  Radio, Sparkles, ArrowRight, Lock, LogOut,
  Headset, Siren, DoorOpen, Clapperboard, Ear, MapPinned,
} from "lucide-react";
import { Card, SectionLabel, Pill } from "./shared/ui.jsx";
import { TabErrorBoundary } from "./shared/ErrorBoundary.jsx";
import { densityColor, ZONES, AVATARS } from "./shared/data.js";
import { StaffAvatar } from "./shared/avatars.jsx";
import { STAFF_PIN, TICKET_FORMAT } from "./lib/assistant.js";
import { hapticSnap } from "./lib/haptics.js";

// Every tab beyond the default Navigate view is code-split and
// lazy-loaded — attendees only pay for Order/Assistant/Transport/etc.
// once they actually tap into them, and staff never load Recharts
// (~130KB gzipped, used by Ops Pulse/Vendors/Sustainability) unless
// they open a tab that needs it. Navigate stays eager since it's the
// very first thing every attendee sees.
const OrderTab = lazy(() => import("./tabs/OrderTab.jsx"));
const AssistantTab = lazy(() => import("./tabs/AssistantTab.jsx"));
const TransportTab = lazy(() => import("./tabs/TransportTab.jsx"));
const OpsPulseTab = lazy(() => import("./tabs/OpsPulseTab.jsx"));
const VendorLoadTab = lazy(() => import("./tabs/VendorLoadTab.jsx"));
const SustainabilityTab = lazy(() => import("./tabs/SustainabilityTab.jsx"));
const CopilotTab = lazy(() => import("./tabs/CopilotTab.jsx"));
const IncidentCommandTab = lazy(() => import("./tabs/IncidentCommandTab.jsx"));
const EgressTab = lazy(() => import("./tabs/EgressTab.jsx"));
const MatchHubTab = lazy(() => import("./tabs/MatchHubTab.jsx"));
const AccessPlusTab = lazy(() => import("./tabs/AccessPlusTab.jsx"));
const FanZoneTab = lazy(() => import("./tabs/FanZoneTab.jsx"));

/* ---------------------------------- THEME ----------------------------------
Palette:
  --ink:      #0B140F   (near-black, floodlit night pitch)
  --panel:    #10201A   (card surface)
  --panel-2:  #16281F   (raised surface)
  --turf:     #3ED07A   (pitch green accent — primary)
  --flood:    #FFC24B   (floodlight amber — secondary / alerts)
  --line:     #223328   (hairline)
  --ivory:    #F3F3EF   (primary text)
  --mute:     #8FA69B   (secondary text)
--------------------------------------------------------------------------- */

/* ------------------------------ ONBOARDING ---------------------------------- */

// Hoisted so this tuple isn't reallocated on every Onboarding render.
const ROLE_TABS = [["fan", "Attendee"], ["staff", "Operations"]];

function Onboarding({ onDone }) {
  const [tab, setTab] = useState("fan");
  const [avatar, setAvatar] = useState("boy");
  const [name, setName] = useState("");
  const [ticket, setTicket] = useState("");
  const [ticketError, setTicketError] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const enterAttendee = () => {
    if (!TICKET_FORMAT.test(ticket.trim())) {
      setTicketError(true);
      return;
    }
    onDone({ type: "fan", avatar, name: name.trim() || "Attendee" });
  };

  const enterStaff = () => {
    if (pin !== STAFF_PIN) {
      setPinError(true);
      return;
    }
    onDone({ type: "staff" });
  };

  return (
    <div className="min-h-screen w-full bg-[#0B140F] flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <a href="#onboarding-main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#3ED07A] focus:text-[#0B140F] focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold">
        Skip to role selection
      </a>
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-[#3ED07A]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full bg-[#FFC24B]/10 blur-3xl pointer-events-none" />

      <main className="w-full max-w-sm relative">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-[#3ED07A] flex items-center justify-center mb-4 shadow-lg shadow-[#3ED07A]/20">
            <ShieldCheck size={26} className="text-[#0B140F]" />
          </div>
          <h1 className="text-[#F3F3EF] font-bold text-2xl tracking-tight">StadiumSync</h1>
          <div className="text-[#8FA69B] text-sm mt-1.5">World Cup 2026 · Estadio Azteca</div>
          <div className="flex items-center gap-1.5 mt-3 text-[#3ED07A] text-xs font-medium">
            <Sparkles size={13} /> AI-powered attendee &amp; ops companion
          </div>
        </div>

        <Card className="p-5" id="onboarding-main">
          <div className="grid grid-cols-2 gap-2 mb-5 bg-[#0B140F] border border-[#223328] rounded-2xl p-1.5" role="tablist" aria-label="Choose your role">
            {ROLE_TABS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                role="tab"
                aria-selected={tab === id}
                className={`py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${tab === id ? "bg-[#3ED07A] text-[#0B140F]" : "text-[#8FA69B]"}`}
              >
                {id === "staff" && <Lock size={12} aria-hidden="true" />}
                {label}
              </button>
            ))}
          </div>

          {tab === "fan" ? (
            <>
              <SectionLabel>Pick your avatar</SectionLabel>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {Object.entries(AVATARS).map(([id, { Comp, label, accent }]) => (
                  <button
                    key={id}
                    onClick={() => setAvatar(id)}
                    aria-pressed={avatar === id}
                    aria-label={`${label} avatar`}
                    className={`flex flex-col items-center gap-2.5 py-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${
                      avatar === id ? "bg-[#16281F] border-[color:var(--ac)] scale-[1.02]" : "bg-transparent border-[#223328] hover:border-[#2E4A3B]"
                    }`}
                    style={{ "--ac": accent }}
                  >
                    <Comp size={64} ring={avatar === id} />
                    <span className={`text-sm font-semibold ${avatar === id ? "text-[#F3F3EF]" : "text-[#8FA69B]"}`}>{label}</span>
                  </button>
                ))}
              </div>

              <SectionLabel>Your name</SectionLabel>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam"
                maxLength={20}
                aria-label="Your name"
                className="w-full bg-[#16281F] border border-[#223328] rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none focus:border-[#3ED07A] mb-5 focus-visible:ring-2 focus-visible:ring-[#3ED07A]"
              />

              <SectionLabel>Ticket ID</SectionLabel>
              <input
                value={ticket}
                onChange={(e) => { setTicket(e.target.value); setTicketError(false); }}
                onKeyDown={(e) => e.key === "Enter" && enterAttendee()}
                placeholder="e.g. WC26-118014"
                aria-label="Ticket ID"
                aria-invalid={ticketError}
                aria-describedby="ticket-hint"
                className={`w-full bg-[#16281F] border rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none mb-2 focus-visible:ring-2 focus-visible:ring-[#3ED07A] ${ticketError ? "border-[#FF6B5B]" : "border-[#223328] focus:border-[#3ED07A]"}`}
              />
              {ticketError ? (
                <p id="ticket-hint" role="alert" className="text-[#FF6B5B] text-xs mb-3">That doesn't look like a ticket ID — at least 6 letters/digits, found on your confirmation email.</p>
              ) : (
                <p id="ticket-hint" className="text-[#8FA69B] text-xs mb-3">Found on your match ticket confirmation, e.g. WC26-118014.</p>
              )}

              <button
                onClick={enterAttendee}
                className="w-full bg-[#3ED07A] text-[#0B140F] rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none"
              >
                Enter the stadium <ArrowRight size={16} aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center py-1 mb-5">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                  <StaffAvatar size={64} />
                </div>
                <div className="text-[#F3F3EF] font-semibold text-sm">Operations access</div>
                <div className="text-[#8FA69B] text-xs mt-1">Enter the operations passcode to open the Ops Console.</div>
              </div>

              <SectionLabel>Passcode</SectionLabel>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                onKeyDown={(e) => e.key === "Enter" && enterStaff()}
                placeholder="Passcode"
                aria-label="Operations passcode"
                aria-invalid={pinError}
                aria-describedby="pin-hint"
                className={`w-full bg-[#16281F] border rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none mb-2 focus-visible:ring-2 focus-visible:ring-[#3ED07A] ${pinError ? "border-[#FF6B5B]" : "border-[#223328] focus:border-[#3ED07A]"}`}
              />
              {pinError ? (
                <p id="pin-hint" role="alert" className="text-[#FF6B5B] text-xs mb-3">Incorrect passcode — try again.</p>
              ) : (
                <p id="pin-hint" className="text-[#8FA69B] text-xs mb-3">Provided by your venue supervisor. <span className="text-[#8FA69B]">(Demo passcode: {STAFF_PIN})</span></p>
              )}

              <button
                onClick={enterStaff}
                className="w-full bg-[#3ED07A] text-[#0B140F] rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none"
              >
                Unlock console <ArrowRight size={16} aria-hidden="true" />
              </button>
            </>
          )}
        </Card>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-[#8FA69B]">
          <Users size={11} /> Attendee actions feed the Ops layer in real time — same AI, every role.
        </div>
      </main>
    </div>
  );
}

/* --------------------------------- FAN VIEW --------------------------------- */

// Memoized so toggling step-free/audio state in NavigateTab (unrelated to
// zone data) doesn't re-render every zone bar on every keystroke of state.
const ZoneRow = memo(function ZoneRow({ name, density }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-sm text-[#F3F3EF]">{name}</div>
      <div className="flex-1 h-2 rounded-full bg-[#16281F] overflow-hidden">
        <div
          className="h-full rounded-full transition-all chart-breathe"
          style={{ width: `${density}%`, background: densityColor(density) }}
        />
      </div>
      <div className="w-9 text-right text-xs text-[#8FA69B]">{density}%</div>
    </div>
  );
});

function NavigateTab({ profile }) {
  const AvatarComp = AVATARS[profile.avatar].Comp;
  const [stepFree, setStepFree] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const toggleAudio = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const route = `Walking route to Section 118, Seat 14. ${stepFree ? "Step-free route active. " : ""}4 minute walk via Concourse N. Gate 4 is near capacity — exit via Concourse South after the match.`;
    const utterance = new SpeechSynthesisUtterance(route);
    utterance.rate = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Live wayfinding</SectionLabel>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#3ED07A]/15 flex items-center justify-center shrink-0 overflow-hidden">
            <AvatarComp size={40} />
          </div>
          <div>
            <div className="text-[#F3F3EF] font-semibold">Section 118, Seat 14 — {profile.name}</div>
            <div className="text-[#8FA69B] text-sm">4 min walk · via Concourse N</div>
          </div>
        </div>
        <svg viewBox="0 0 320 140" className="w-full h-32 rounded-xl bg-[#0B140F]">
          <ellipse cx="160" cy="70" rx="140" ry="55" fill="none" stroke="#223328" strokeWidth="2" />
          <ellipse cx="160" cy="70" rx="90" ry="34" fill="#16281F" stroke="#3ED07A" strokeWidth="1.5" opacity="0.5" />

          {/* planned route, faint */}
          <path d="M 60 45 Q 140 20 250 95" fill="none" stroke="#FFC24B" strokeWidth="2" strokeDasharray="6 5" opacity="0.3" />

          {/* traveled portion — fills in as the live marker advances */}
          <path
            d="M 60 45 Q 140 20 250 95"
            fill="none" stroke="#3ED07A" strokeWidth="2.5" strokeLinecap="round"
            pathLength="100" strokeDasharray="100" strokeDashoffset="100"
          >
            <animate attributeName="stroke-dashoffset" values="100;0" dur="6s" repeatCount="indefinite" />
          </path>

          <circle cx="250" cy="95" r="5" fill="#3ED07A" />
          <text x="250" y="112" fill="#8FA69B" fontSize="9" textAnchor="middle">Seat</text>

          {/* live position marker — the onboarding avatar rides the route,
              visually "becoming" the positional marker instead of a plain dot */}
          <g>
            <animateMotion dur="6s" repeatCount="indefinite" path="M 60 45 Q 140 20 250 95" />
            <circle r="10" fill="#3ED07A" opacity="0.3">
              <animate attributeName="r" values="7;12;7" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <foreignObject x="-9" y="-9" width="18" height="18">
              <div className="marker-morph w-full h-full rounded-full overflow-hidden ring-2 ring-[#3ED07A] bg-[#0B140F]">
                <AvatarComp size={18} />
              </div>
            </foreignObject>
          </g>
        </svg>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#3ED07A]">
          <Radio size={10} className="animate-pulse" /> Live position — updating as you walk
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>Zone crowd levels</SectionLabel>
        <div className="space-y-3">
          {ZONES.map((z) => (
            <ZoneRow key={z.name} name={z.name} density={z.density} />
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 bg-[#FFC24B]/10 border border-[#FFC24B]/25 rounded-xl p-3">
          <AlertTriangle size={16} className="text-[#FFC24B] mt-0.5 shrink-0" />
          <div className="text-sm text-[#F3F3EF]">
            Gate 4 is near capacity. Assistant suggests exiting via <span className="text-[#FFC24B] font-medium">Concourse S</span> after the match.
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>Accessibility</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { hapticSnap(); setStepFree((v) => !v); }}
            aria-pressed={stepFree}
            className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${stepFree ? "bg-[#16281F]" : "bg-[#16281F] opacity-60"}`}
          >
            <Accessibility size={16} className={`shrink-0 ${stepFree ? "text-[#3ED07A]" : "text-[#8FA69B]"}`} aria-hidden="true" />
            <div>
              <div className="text-sm text-[#F3F3EF] leading-tight">Step-free route</div>
              <div className="text-[11px] text-[#8FA69B]">{stepFree ? "Active — avoiding stairs" : "Off — standard route"}</div>
            </div>
          </button>
          <button
            onClick={toggleAudio}
            aria-pressed={speaking}
            className="flex items-center gap-2.5 bg-[#16281F] rounded-xl p-3 text-left transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"
          >
            <Volume2 size={16} className={`shrink-0 ${speaking ? "text-[#3ED07A] animate-pulse" : "text-[#8FA69B]"}`} aria-hidden="true" />
            <div>
              <div className="text-sm text-[#F3F3EF] leading-tight">Audio wayfinding</div>
              <div className="text-[11px] text-[#8FA69B]">{speaking ? "Speaking… tap to stop" : "Tap to hear directions"}</div>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- SHELL ----------------------------------- */

const FAN_TABS = [
  { id: "navigate", label: "Navigate", icon: MapPin, render: NavigateTab },
  { id: "order", label: "Order", icon: Utensils, render: OrderTab },
  { id: "assistant", label: "Assistant", icon: MessageCircle, render: AssistantTab },
  { id: "transport", label: "Transport", icon: Bus, render: TransportTab },
  { id: "matchhub", label: "Match Hub", icon: Clapperboard, render: MatchHubTab },
  { id: "access-plus", label: "Access+", icon: Ear, render: AccessPlusTab },
  { id: "fanzone", label: "Fan Zone", icon: MapPinned, render: FanZoneTab },
];

const STAFF_TABS = [
  { id: "pulse", label: "Ops Pulse", icon: Activity, render: OpsPulseTab },
  { id: "vendor", label: "Vendors", icon: Package, render: VendorLoadTab },
  { id: "sustain", label: "Sustainability", icon: Leaf, render: SustainabilityTab },
  { id: "copilot", label: "Copilot", icon: Headset, render: CopilotTab },
  { id: "incident", label: "Incident Command", icon: Siren, render: IncidentCommandTab },
  { id: "egress", label: "Egress", icon: DoorOpen, render: EgressTab },
];

export default function StadiumSync() {
  const [entered, setEntered] = useState(false);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("fan");
  const tabs = role === "fan" ? FAN_TABS : STAFF_TABS;
  const [activeId, setActiveId] = useState(tabs[0].id);
  const active = tabs.find((t) => t.id === activeId) || tabs[0];
  const ActiveComponent = active.render;
  // Lifted here (not local to EgressTab) so toggling it in the Ops Console's
  // Egress tab actually changes what the attendee Transport tab shows —
  // one shared signal, two views, matching how the rest of the app treats
  // operations state as feeding the attendee experience live.
  const [transitDelayed, setTransitDelayed] = useState(false);

  const handleOnboardingDone = (result) => {
    if (result.type === "staff") {
      setProfile({ avatar: "boy", name: "Operations" });
      setRole("staff");
      setActiveId(STAFF_TABS[0].id);
    } else {
      setProfile({ avatar: result.avatar, name: result.name });
      setRole("fan");
      setActiveId(FAN_TABS[0].id);
    }
    setEntered(true);
  };

  const exitToLanding = () => {
    setEntered(false);
    setProfile(null);
  };

  if (!entered) {
    return <Onboarding onDone={handleOnboardingDone} />;
  }

  const HeaderAvatar = role === "fan" ? AVATARS[profile.avatar].Comp : StaffAvatar;

  return (
    <div className="min-h-screen w-full bg-[#0B140F] flex items-start justify-center py-8 px-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#3ED07A] focus:text-[#0B140F] focus:px-4 focus:py-2 focus:rounded-full focus:text-sm focus:font-semibold">
        Skip to main content
      </a>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
              <HeaderAvatar size={44} />
            </div>
            <div>
              <h1 className="text-[#F3F3EF] font-bold text-[15px] leading-none tracking-tight">
                {role === "fan" ? `Hey, ${profile.name}` : "Ops Console"}
              </h1>
              <div className="text-[#8FA69B] text-[11px] mt-1">World Cup 2026 · Estadio Azteca</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="live"><Radio size={10} className="animate-pulse" /> Live</Pill>
            <button
              onClick={exitToLanding}
              title="Switch role"
              aria-label="Switch role — return to landing page"
              className="w-7 h-7 rounded-full bg-[#10201A] border border-[#223328] flex items-center justify-center text-[#8FA69B] hover:text-[#F3F3EF] hover:border-[#2E4A3B] transition shrink-0 focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"
            >
              <LogOut size={13} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              role="tab"
              aria-selected={activeId === t.id}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition shrink-0 focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none ${
                activeId === t.id
                  ? "bg-[#3ED07A]/15 text-[#3ED07A] border-[#3ED07A]/40"
                  : "bg-transparent text-[#8FA69B] border-[#223328]"
              }`}
            >
              <t.icon size={13} aria-hidden="true" /> {t.label}
            </button>
          ))}
        </div>

        {/* Active panel */}
        <main id="main-content">
          <TabErrorBoundary resetKey={activeId}>
            <Suspense fallback={<div className="text-center text-[#8FA69B] text-sm py-10" role="status">Loading…</div>}>
              <ActiveComponent profile={profile} transitDelayed={transitDelayed} setTransitDelayed={setTransitDelayed} />
            </Suspense>
          </TabErrorBoundary>
        </main>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-[#8FA69B]">
          <Users size={11} /> Attendee actions feed the Ops layer in real time — same AI, every role.
        </div>
      </div>
    </div>
  );
}

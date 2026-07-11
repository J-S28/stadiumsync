import React, { useState, useRef, useEffect } from "react";
import {
  MapPin, Utensils, MessageCircle, Bus, Activity, Users, AlertTriangle,
  Leaf, Send, Navigation, Clock, TrendingUp, TrendingDown, Package,
  Volume2, Accessibility, ShieldCheck, ChevronRight, Plus, Minus,
  Radio, Zap, Sparkles, ArrowRight, Lock, LogOut
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

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

const STAFF_PIN = "2026"; // demo-only gate for the staff console (see README)
// Real ticket IDs are unique per fan, so there's no single "correct" value to
// check against — validate the shape instead (letters/digits/dashes, 6+ chars).
const TICKET_FORMAT = /^[A-Za-z0-9-]{6,}$/;

const ZONES = [
  { name: "Gate 3", density: 91, cap: 100 },
  { name: "Gate 4", density: 97, cap: 100 },
  { name: "Concourse N", density: 62, cap: 100 },
  { name: "Concourse S", density: 48, cap: 100 },
  { name: "Fan Zone", density: 74, cap: 100 },
  { name: "Metro Exit", density: 55, cap: 100 },
];

const VENDOR_LOAD = [
  { name: "Grill 12", wait: 14, stock: 82 },
  { name: "Taco Stand", wait: 6, stock: 91 },
  { name: "Cerveza Bar", wait: 22, stock: 34 },
  { name: "Ice Cream Co.", wait: 3, stock: 12 },
];

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

const SUSTAIN_PIE = [
  { name: "Recycled", value: 62 },
  { name: "Landfill", value: 28 },
  { name: "Compost", value: 10 },
];
const PIE_COLORS = ["#3ED07A", "#5A6B62", "#FFC24B"];

const SNACKS = [
  { id: 1, name: "Loaded Nachos", price: 9.5, vendor: "Grill 12", eta: "14 min" },
  { id: 2, name: "Street Tacos (3)", price: 8, vendor: "Taco Stand", eta: "6 min" },
  { id: 3, name: "Cerveza (16oz)", price: 11, vendor: "Cerveza Bar", eta: "22 min" },
  { id: 4, name: "Churro + Dip", price: 6.5, vendor: "Ice Cream Co.", eta: "3 min" },
];

const ASSISTANT_SCRIPT = {
  en: {
    greet: "Hi! I'm your StadiumSync assistant. Ask me anything — directions, food, transport, accessibility.",
    replies: {
      restroom: "The nearest restroom is 40m past Section 118, to your left after the merch stand. It's showing low wait right now.",
      exit: "Your fastest exit is Gate 4 — but it's busy (97% capacity). I'd suggest Concourse S, it's 6 minutes slower to walk but you'll exit faster overall.",
      food: "Churro + Dip has the shortest wait right now (3 min). Want me to add it to your order?",
      default: "Got it — routing that to the right place. For live wayfinding, tap Navigate; for food, tap Order.",
    },
  },
  es: {
    greet: "¡Hola! Soy tu asistente de StadiumSync. Pregúntame lo que sea — direcciones, comida, transporte, accesibilidad.",
    replies: {
      restroom: "El baño más cercano está a 40m pasando la Sección 118, a tu izquierda después de la tienda. Ahora mismo casi no hay fila.",
      exit: "Tu salida más rápida es la Puerta 4, pero está muy llena (97%). Te sugiero la Explanada S, tarda 6 minutos más caminando pero saldrás más rápido en total.",
      food: "Churro + Dip tiene la espera más corta ahora mismo (3 min). ¿Lo agrego a tu pedido?",
      default: "Entendido — te dirijo al lugar correcto. Para direcciones usa Navegar; para comida usa Pedir.",
    },
  },
  pt: {
    greet: "Oi! Sou o assistente StadiumSync. Pergunte qualquer coisa — direções, comida, transporte, acessibilidade.",
    replies: {
      restroom: "O banheiro mais próximo fica 40m após a Seção 118, à esquerda após a loja. Fila baixa agora.",
      exit: "Sua saída mais rápida é o Portão 4, mas está lotado (97%). Sugiro o Saguão S — 6 min a mais andando, mas sai mais rápido no total.",
      food: "Churro + Dip tem a menor espera agora (3 min). Quer que eu adicione ao pedido?",
      default: "Entendido — encaminhando para o lugar certo. Para rotas, toque em Navegar; para comida, toque em Pedir.",
    },
  },
  fr: {
    greet: "Salut ! Je suis l'assistant StadiumSync. Demandez-moi n'importe quoi — directions, nourriture, transport, accessibilité.",
    replies: {
      restroom: "Les toilettes les plus proches sont à 40m après la Section 118, à gauche après la boutique. L'attente est faible en ce moment.",
      exit: "Votre sortie la plus rapide est la Porte 4 — mais elle est bondée (97%). Je vous suggère l'Esplanade S, 6 minutes de marche en plus mais vous sortirez plus vite au total.",
      food: "Churro + sauce a la file la plus courte en ce moment (3 min). Je l'ajoute à votre commande ?",
      default: "Compris — je vous oriente vers le bon endroit. Pour l'itinéraire, appuyez sur Naviguer ; pour la nourriture, appuyez sur Commander.",
    },
  },
  de: {
    greet: "Hallo! Ich bin dein StadiumSync-Assistent. Frag mich alles — Wegbeschreibung, Essen, Transport, Barrierefreiheit.",
    replies: {
      restroom: "Die nächste Toilette ist 40m hinter Abschnitt 118, links nach dem Fanshop. Gerade kurze Wartezeit.",
      exit: "Dein schnellster Ausgang ist Tor 4 — aber stark ausgelastet (97%). Ich empfehle Bereich S, 6 Minuten mehr Fußweg, aber insgesamt schneller draußen.",
      food: "Churro + Dip hat gerade die kürzeste Wartezeit (3 Min). Soll ich es zu deiner Bestellung hinzufügen?",
      default: "Verstanden — ich leite dich weiter. Für Wegbeschreibung tippe auf Navigieren, für Essen auf Bestellen.",
    },
  },
};

const LANG_DETECT_MARKERS = {
  es: [/\bdónde\b/, /\bbaño\b/, /\bsalida\b/, /\bcomida\b/, /\bcómo\b/, /\bhola\b/, /\bgracias\b/, /[ñ¿¡]/],
  pt: [/\bbanheiro\b/, /\bsaída\b/, /\bcomida\b/, /\bonde\b/, /\bobrigad[oa]\b/, /[ãõç]/],
  fr: [/\btoilettes?\b/, /\bsortie\b/, /\bnourriture\b/, /\boù\b/, /\bmerci\b/, /\bbonjour\b/, /[àâçèêëîïôûù]/],
  de: [/\btoilette\b/, /\bausgang\b/, /\bessen\b/, /\bwo\b/, /\bdanke\b/, /\bhallo\b/, /[äöüß]/],
  en: [/\bwhere\b/, /\brestroom\b/, /\bexit\b/, /\bfood\b/, /\bthanks?\b/, /\bhello\b/, /\bhi\b/],
};

// Best-effort language guess from free text — used to auto-switch the
// assistant's fallback script bank when the fan types instead of tapping a
// language pill. Returns null when no language scores a confident match.
function detectLang(text) {
  const t = ` ${text.toLowerCase()} `;
  let best = null;
  let bestScore = 0;
  for (const [lang, patterns] of Object.entries(LANG_DETECT_MARKERS)) {
    const score = patterns.reduce((s, p) => s + (p.test(t) ? 1 : 0), 0);
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  return best;
}

function pickReply(lang, text) {
  const t = text.toLowerCase();
  const bank = ASSISTANT_SCRIPT[lang].replies;
  if (t.includes("bath") || t.includes("restroom") || t.includes("baño") || t.includes("banheiro") || t.includes("toilette")) return bank.restroom;
  if (t.includes("exit") || t.includes("salida") || t.includes("saída") || t.includes("sortie") || t.includes("ausgang") || t.includes("leave")) return bank.exit;
  if (t.includes("food") || t.includes("snack") || t.includes("comida") || t.includes("nourriture") || t.includes("essen") || t.includes("hungry") || t.includes("eat")) return bank.food;
  return bank.default;
}

function densityColor(d) {
  if (d >= 90) return "#FF6B5B";
  if (d >= 70) return "#FFC24B";
  return "#3ED07A";
}

/* -------------------------------- MASCOTS ----------------------------------
Flat vector character avatars. Used at onboarding, in the header, and inside
the assistant chat so the AI + the fan both feel like "someone", not a form.
--------------------------------------------------------------------------- */

function BoyAvatar({ size = 56, className = "", ring = false }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#3ED07A" strokeWidth="2" />}
      <circle cx="32" cy="32" r="30" fill="#173226" />
      <path d="M9 55 Q32 40 55 55 L55 64 L9 64 Z" fill="#3ED07A" />
      <path d="M9 55 Q32 47 55 55 L55 59 Q32 51 9 59 Z" fill="#2CA562" />
      <circle cx="32" cy="29" r="14" fill="#F0C299" />
      <path d="M18 27 Q19 12 32 11 Q45 12 46 27 Q45 19 32 18 Q19 19 18 27Z" fill="#2B1C12" />
      <path d="M17 24 Q32 6 47 24 L46 18 Q32 8 18 18 Z" fill="#2B1C12" />
      <circle cx="26.5" cy="30" r="2.1" fill="#1B140D" />
      <circle cx="37.5" cy="30" r="2.1" fill="#1B140D" />
      <path d="M27 37 Q32 40.5 37 37" stroke="#8A5836" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M16 20 Q32 10 48 20 Q47 15 32 12 Q17 15 16 20Z" fill="#FFC24B" opacity="0.9" />
    </svg>
  );
}

function GirlAvatar({ size = 56, className = "", ring = false }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#FFC24B" strokeWidth="2" />}
      <circle cx="32" cy="32" r="30" fill="#173226" />
      <path d="M9 55 Q32 40 55 55 L55 64 L9 64 Z" fill="#FFC24B" />
      <path d="M9 55 Q32 47 55 55 L55 59 Q32 51 9 59 Z" fill="#D99F2E" />
      <path d="M15 30 Q13 46 20 52 Q17 40 20 30 Z" fill="#3B2314" />
      <path d="M49 30 Q51 46 44 52 Q47 40 44 30 Z" fill="#3B2314" />
      <circle cx="32" cy="29" r="14" fill="#F0C299" />
      <path d="M17 25 Q18 10 32 9 Q46 10 47 25 Q45 16 32 15 Q19 16 17 25Z" fill="#3B2314" />
      <path d="M18 19 Q32 12 46 19" stroke="#3ED07A" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <circle cx="26.5" cy="30" r="2.1" fill="#1B140D" />
      <circle cx="37.5" cy="30" r="2.1" fill="#1B140D" />
      <path d="M27 37 Q32 40.5 37 37" stroke="#8A5836" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function StaffAvatar({ size = 56, className = "", ring = false }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      {ring && <circle cx="32" cy="32" r="31" fill="none" stroke="#FFC24B" strokeWidth="2" />}
      <circle cx="32" cy="32" r="30" fill="#173226" />
      <path d="M9 55 Q32 40 55 55 L55 64 L9 64 Z" fill="#16281F" />
      <path d="M13 52 L32 60 L51 52 L51 44 L38 50 L32 46 L26 50 L13 44 Z" fill="#FFC24B" />
      <circle cx="32" cy="29" r="13.5" fill="#E7B183" />
      <path d="M19 26 Q20 12 32 12 Q44 12 45 26 Q43 18 32 17 Q21 18 19 26Z" fill="#171512" />
      <circle cx="26.5" cy="30" r="2" fill="#1B140D" />
      <circle cx="37.5" cy="30" r="2" fill="#1B140D" />
      <path d="M27.5 37 Q32 39.5 36.5 37" stroke="#7A4B2C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M44 24 Q52 24 52 32" stroke="#3ED07A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="52" cy="32" r="2.6" fill="#3ED07A" />
    </svg>
  );
}

function BotAvatar({ size = 32, className = "" }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className}>
      <circle cx="32" cy="32" r="30" fill="#0F231A" />
      <circle cx="32" cy="14" r="3" fill="#3ED07A" />
      <line x1="32" y1="14" x2="32" y2="21" stroke="#3ED07A" strokeWidth="2" />
      <rect x="16" y="21" width="32" height="26" rx="10" fill="#16281F" stroke="#3ED07A" strokeWidth="1.5" />
      <circle cx="25" cy="34" r="4" fill="#3ED07A" />
      <circle cx="39" cy="34" r="4" fill="#3ED07A" />
      <path d="M25 43 Q32 47 39 43" stroke="#8FA69B" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const AVATARS = {
  boy: { Comp: BoyAvatar, label: "Boy", accent: "#3ED07A" },
  girl: { Comp: GirlAvatar, label: "Girl", accent: "#FFC24B" },
};

/* ------------------------------- UI PRIMITIVES ------------------------------ */

function Pill({ children, tone = "default" }) {
  const tones = {
    default: "bg-[#16281F] text-[#8FA69B] border-[#223328]",
    live: "bg-[#3ED07A]/10 text-[#3ED07A] border-[#3ED07A]/30",
    alert: "bg-[#FFC24B]/10 text-[#FFC24B] border-[#FFC24B]/30",
    danger: "bg-[#FF6B5B]/10 text-[#FF6B5B] border-[#FF6B5B]/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#10201A] border border-[#223328] rounded-2xl transition-all duration-200 hover:border-[#2E4A3B] ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#8FA69B] mb-3">
      {children}
    </div>
  );
}

/* ------------------------------ ONBOARDING ---------------------------------- */

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
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-[#3ED07A]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full bg-[#FFC24B]/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-[#3ED07A] flex items-center justify-center mb-4 shadow-lg shadow-[#3ED07A]/20">
            <ShieldCheck size={26} className="text-[#0B140F]" />
          </div>
          <div className="text-[#F3F3EF] font-bold text-2xl tracking-tight">StadiumSync</div>
          <div className="text-[#8FA69B] text-sm mt-1.5">World Cup 2026 · Estadio Azteca</div>
          <div className="flex items-center gap-1.5 mt-3 text-[#3ED07A] text-xs font-medium">
            <Sparkles size={13} /> AI-powered attendee &amp; ops companion
          </div>
        </div>

        <Card className="p-5">
          <div className="grid grid-cols-2 gap-2 mb-5 bg-[#0B140F] border border-[#223328] rounded-2xl p-1.5">
            {[["fan", "Attendee"], ["staff", "Organizer / Staff"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1.5 ${tab === id ? "bg-[#3ED07A] text-[#0B140F]" : "text-[#8FA69B]"}`}
              >
                {id === "staff" && <Lock size={12} />}
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
                    className={`flex flex-col items-center gap-2.5 py-4 rounded-2xl border transition-all ${
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
                className="w-full bg-[#16281F] border border-[#223328] rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none focus:border-[#3ED07A] mb-5"
              />

              <SectionLabel>Ticket ID</SectionLabel>
              <input
                value={ticket}
                onChange={(e) => { setTicket(e.target.value); setTicketError(false); }}
                onKeyDown={(e) => e.key === "Enter" && enterAttendee()}
                placeholder="e.g. WC26-118014"
                className={`w-full bg-[#16281F] border rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none mb-2 ${ticketError ? "border-[#FF6B5B]" : "border-[#223328] focus:border-[#3ED07A]"}`}
              />
              {ticketError ? (
                <p className="text-[#FF6B5B] text-xs mb-3">That doesn't look like a ticket ID — at least 6 letters/digits, found on your confirmation email.</p>
              ) : (
                <p className="text-[#5A6B62] text-xs mb-3">Found on your match ticket confirmation, e.g. WC26-118014.</p>
              )}

              <button
                onClick={enterAttendee}
                className="w-full bg-[#3ED07A] text-[#0B140F] rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition"
              >
                Enter the stadium <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center py-1 mb-5">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                  <StaffAvatar size={64} />
                </div>
                <div className="text-[#F3F3EF] font-semibold text-sm">Organizer / Staff access</div>
                <div className="text-[#8FA69B] text-xs mt-1">Enter the staff passcode to open the Ops Console.</div>
              </div>

              <SectionLabel>Passcode</SectionLabel>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                onKeyDown={(e) => e.key === "Enter" && enterStaff()}
                placeholder="Passcode"
                className={`w-full bg-[#16281F] border rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none mb-2 ${pinError ? "border-[#FF6B5B]" : "border-[#223328] focus:border-[#3ED07A]"}`}
              />
              {pinError ? (
                <p className="text-[#FF6B5B] text-xs mb-3">Incorrect passcode — try again.</p>
              ) : (
                <p className="text-[#5A6B62] text-xs mb-3">Provided by your venue supervisor. <span className="text-[#8FA69B]">(Demo passcode: {STAFF_PIN})</span></p>
              )}

              <button
                onClick={enterStaff}
                className="w-full bg-[#3ED07A] text-[#0B140F] rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] transition"
              >
                Unlock console <ArrowRight size={16} />
              </button>
            </>
          )}
        </Card>

        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-[#5A6B62]">
          <Users size={11} /> Attendee actions feed the Ops layer in real time — same AI, every role.
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- FAN VIEW --------------------------------- */

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

          {/* live position marker */}
          <g>
            <animateMotion dur="6s" repeatCount="indefinite" path="M 60 45 Q 140 20 250 95" />
            <circle r="10" fill="#3ED07A" opacity="0.3">
              <animate attributeName="r" values="7;12;7" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0.05;0.35" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle r="4.5" fill="#F3F3EF" stroke="#3ED07A" strokeWidth="2" />
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
            <div key={z.name} className="flex items-center gap-3">
              <div className="w-28 text-sm text-[#F3F3EF]">{z.name}</div>
              <div className="flex-1 h-2 rounded-full bg-[#16281F] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${z.density}%`, background: densityColor(z.density) }}
                />
              </div>
              <div className="w-9 text-right text-xs text-[#8FA69B]">{z.density}%</div>
            </div>
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
            onClick={() => setStepFree((v) => !v)}
            className={`flex items-center gap-2.5 rounded-xl p-3 text-left transition ${stepFree ? "bg-[#16281F]" : "bg-[#16281F] opacity-60"}`}
          >
            <Accessibility size={16} className={`shrink-0 ${stepFree ? "text-[#3ED07A]" : "text-[#8FA69B]"}`} />
            <div>
              <div className="text-sm text-[#F3F3EF] leading-tight">Step-free route</div>
              <div className="text-[11px] text-[#8FA69B]">{stepFree ? "Active — avoiding stairs" : "Off — standard route"}</div>
            </div>
          </button>
          <button
            onClick={toggleAudio}
            className="flex items-center gap-2.5 bg-[#16281F] rounded-xl p-3 text-left transition"
          >
            <Volume2 size={16} className={`shrink-0 ${speaking ? "text-[#3ED07A] animate-pulse" : "text-[#8FA69B]"}`} />
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

function OrderTab({ profile }) {
  const [cart, setCart] = useState({});
  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const sub = (id) => setCart((c) => {
    const n = { ...c };
    if (n[id] > 1) n[id] -= 1; else delete n[id];
    return n;
  });
  const total = Object.entries(cart).reduce((s, [id, q]) => s + SNACKS.find((x) => x.id == id).price * q, 0);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4 pb-20">
      <Card className="p-4 flex items-center gap-3 bg-gradient-to-r from-[#16281F] to-[#10201A]">
        <Zap size={16} className="text-[#FFC24B] shrink-0" />
        <div className="text-sm text-[#F3F3EF]">AI pick: <span className="text-[#FFC24B] font-medium">Churro + Dip</span> — shortest wait right now (3 min)</div>
      </Card>

      <div className="space-y-3">
        {SNACKS.map((s) => (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-[#F3F3EF] font-medium">{s.name}</div>
              <div className="text-[#8FA69B] text-xs mt-0.5">{s.vendor} · ${s.price.toFixed(2)}</div>
              <div className="flex items-center gap-1 mt-1.5">
                <Clock size={11} className="text-[#8FA69B]" />
                <span className="text-[11px] text-[#8FA69B]">{s.eta} wait</span>
              </div>
            </div>
            {cart[s.id] ? (
              <div className="flex items-center gap-2.5 bg-[#16281F] rounded-full px-1 py-1 shrink-0">
                <button onClick={() => sub(s.id)} className="w-7 h-7 rounded-full bg-[#223328] flex items-center justify-center text-[#F3F3EF]"><Minus size={13} /></button>
                <span className="text-[#F3F3EF] text-sm w-4 text-center">{cart[s.id]}</span>
                <button onClick={() => add(s.id)} className="w-7 h-7 rounded-full bg-[#3ED07A] flex items-center justify-center text-[#0B140F]"><Plus size={13} /></button>
              </div>
            ) : (
              <button onClick={() => add(s.id)} className="shrink-0 px-4 py-2 rounded-full bg-[#3ED07A] text-[#0B140F] text-sm font-semibold">Add</button>
            )}
          </Card>
        ))}
      </div>

      {count > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
          <button className="w-full bg-[#3ED07A] text-[#0B140F] rounded-2xl py-3.5 px-5 flex items-center justify-between font-semibold shadow-xl shadow-black/40">
            <span className="flex items-center gap-2"><Package size={17} /> Send to seat 118-14</span>
            <span>${total.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function AssistantTab({ profile }) {
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
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.from, text: m.text })) }),
      });
      if (!res.ok) throw new Error("assistant request failed");
      const data = await res.json();
      setMessages((m) => [...m, { from: "bot", text: data.reply || pickReply(activeLang, userMsg.text) }]);
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
        {[["en", "EN"], ["es", "ES"], ["pt", "PT"], ["fr", "FR"], ["de", "DE"]].map(([code, label]) => (
          <button
            key={code}
            onClick={() => selectLang(code)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition shrink-0 ${lang === code ? "bg-[#3ED07A] text-[#0B140F] border-[#3ED07A]" : "bg-transparent text-[#8FA69B] border-[#223328]"}`}
          >
            {label}
          </button>
        ))}
        <Pill tone="live"><Radio size={10} /> Multilingual AI</Pill>
      </div>
      <p className="text-[10px] text-[#5A6B62] mb-3 -mt-1.5">Auto-detects the language you type in — tap a pill to switch manually.</p>

      <Card className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
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
          disabled={loading}
          className="flex-1 bg-[#16281F] border border-[#223328] rounded-full px-4 py-2.5 text-sm text-[#F3F3EF] placeholder-[#5A6B62] outline-none focus:border-[#3ED07A] disabled:opacity-60"
        />
        <button onClick={send} disabled={loading} className="w-10 h-10 rounded-full bg-[#3ED07A] flex items-center justify-center shrink-0 hover:brightness-105 active:scale-95 transition disabled:opacity-60">
          <Send size={16} className="text-[#0B140F]" />
        </button>
      </div>
    </div>
  );
}

function TransportTab() {
  const [selected, setSelected] = useState(null);
  const active = TRANSPORT_ROUTES.find((r) => r.id === selected);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Routes from the stadium</SectionLabel>
        <svg viewBox="0 0 320 150" className="w-full h-36 rounded-xl bg-[#0B140F] mb-1">
          <ellipse cx="160" cy="118" rx="60" ry="20" fill="none" stroke="#223328" strokeWidth="2" />
          <ellipse cx="160" cy="118" rx="38" ry="12" fill="#16281F" stroke="#3ED07A" strokeWidth="1.2" opacity="0.5" />

          {TRANSPORT_ROUTES.map((r) => {
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
          {TRANSPORT_ROUTES.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected((s) => (s === r.id ? null : r.id))}
              className={`w-full flex items-center justify-between rounded-xl p-3.5 text-left border transition ${
                selected === r.id ? "bg-[#1B3326] border-[#3ED07A]/50" : "bg-[#16281F] border-transparent hover:border-[#2E4A3B]"
              }`}
            >
              <div className="flex items-center gap-3">
                <r.icon size={17} className="text-[#3ED07A]" />
                <span className="text-[#F3F3EF] text-sm">{r.name}</span>
              </div>
              <Pill tone={r.tone}>{r.eta}</Pill>
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <SectionLabel>AI suggestion</SectionLabel>
        <p className="text-sm text-[#F3F3EF] leading-relaxed">
          Post-match surge expected at Metro Blue Line in ~25 min. Leaving via Concourse S and taking Shuttle Line C now avoids the crowd and saves you roughly 15 minutes.
        </p>
      </Card>
    </div>
  );
}

/* -------------------------------- STAFF VIEW -------------------------------- */

function OpsPulseTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Attendees in venue", value: "68,204", delta: "+3.2%", up: true },
          { label: "Open incidents", value: "3", delta: "-2", up: false },
          { label: "Avg. wait (food)", value: "11m", delta: "+4m", up: true },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="text-[11px] text-[#8FA69B] mb-1.5">{k.label}</div>
            <div className="text-xl font-semibold text-[#F3F3EF]">{k.value}</div>
            <div className={`flex items-center gap-1 text-[11px] mt-1 ${k.up ? "text-[#FFC24B]" : "text-[#3ED07A]"}`}>
              {k.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {k.delta}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <SectionLabel>Zone density — live</SectionLabel>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={ZONES} margin={{ left: -20 }}>
              <CartesianGrid stroke="#223328" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#8FA69B", fontSize: 10 }} axisLine={{ stroke: "#223328" }} tickLine={false} />
              <YAxis tick={{ fill: "#8FA69B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#16281F", border: "1px solid #223328", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="density" radius={[6, 6, 0, 0]}>
                {ZONES.map((z, i) => <Cell key={i} fill={densityColor(z.density)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <SectionLabel>AI-flagged signal</SectionLabel>
        <div className="flex items-start gap-2.5 bg-[#FF6B5B]/10 border border-[#FF6B5B]/25 rounded-xl p-3.5">
          <AlertTriangle size={16} className="text-[#FF6B5B] mt-0.5 shrink-0" />
          <div className="text-sm text-[#F3F3EF]">
            <span className="font-medium">47 attendees</span> asked the assistant about "nearest exit" near Gate 4 in the last 6 minutes — a 5x spike. Recommend deploying 2 crowd marshals to Gate 4.
          </div>
        </div>
      </Card>
    </div>
  );
}

function VendorLoadTab() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Vendor wait times</SectionLabel>
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={VENDOR_LOAD} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid stroke="#223328" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#8FA69B", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: "#F3F3EF", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: "#16281F", border: "1px solid #223328", borderRadius: 10, fontSize: 12 }} />
              <Bar dataKey="wait" radius={[0, 6, 6, 0]} fill="#FFC24B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-5">
        <SectionLabel>Stock alerts</SectionLabel>
        <div className="space-y-2.5">
          {VENDOR_LOAD.map((v) => (
            <div key={v.name} className="flex items-center justify-between bg-[#16281F] rounded-xl p-3">
              <span className="text-sm text-[#F3F3EF]">{v.name}</span>
              <Pill tone={v.stock < 20 ? "danger" : v.stock < 50 ? "alert" : "live"}>{v.stock}% stock</Pill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SustainabilityTab() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Waste diversion — today</SectionLabel>
        <div className="flex items-center gap-6">
          <div style={{ width: 140, height: 140 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={SUSTAIN_PIE} dataKey="value" innerRadius={40} outerRadius={62} paddingAngle={3}>
                  {SUSTAIN_PIE.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {SUSTAIN_PIE.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-[#F3F3EF]">{s.name}</span>
                <span className="text-[#8FA69B]">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card className="p-5 flex items-start gap-2.5">
        <Leaf size={17} className="text-[#3ED07A] mt-0.5 shrink-0" />
        <div className="text-sm text-[#F3F3EF] leading-relaxed">
          Compost bin near Fan Zone is 89% full — AI suggests routing next collection cart there first to keep diversion rate on target.
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
];

const STAFF_TABS = [
  { id: "pulse", label: "Ops Pulse", icon: Activity, render: OpsPulseTab },
  { id: "vendor", label: "Vendors", icon: Package, render: VendorLoadTab },
  { id: "sustain", label: "Sustainability", icon: Leaf, render: SustainabilityTab },
];

export default function StadiumSync() {
  const [entered, setEntered] = useState(false);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState("fan");
  const tabs = role === "fan" ? FAN_TABS : STAFF_TABS;
  const [activeId, setActiveId] = useState(tabs[0].id);
  const active = tabs.find((t) => t.id === activeId) || tabs[0];
  const ActiveComponent = active.render;

  const handleOnboardingDone = (result) => {
    if (result.type === "staff") {
      setProfile({ avatar: "boy", name: "Staff" });
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
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
              <HeaderAvatar size={44} />
            </div>
            <div>
              <div className="text-[#F3F3EF] font-bold text-[15px] leading-none tracking-tight">
                {role === "fan" ? `Hey, ${profile.name}` : "Staff Console"}
              </div>
              <div className="text-[#8FA69B] text-[11px] mt-1">World Cup 2026 · Estadio Azteca</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Pill tone="live"><Radio size={10} className="animate-pulse" /> Live</Pill>
            <button
              onClick={exitToLanding}
              title="Switch role"
              className="w-7 h-7 rounded-full bg-[#10201A] border border-[#223328] flex items-center justify-center text-[#8FA69B] hover:text-[#F3F3EF] hover:border-[#2E4A3B] transition shrink-0"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition shrink-0 ${
                activeId === t.id
                  ? "bg-[#3ED07A]/15 text-[#3ED07A] border-[#3ED07A]/40"
                  : "bg-transparent text-[#8FA69B] border-[#223328]"
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* Active panel */}
        <ActiveComponent profile={profile} />

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-[#5A6B62]">
          <Users size={11} /> Attendee actions feed the Ops layer in real time — same AI, every role.
        </div>
      </div>
    </div>
  );
}

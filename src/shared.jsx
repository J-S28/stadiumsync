// Primitives and data shared between the main shell and the lazy-loaded
// Recharts-heavy staff tabs (see src/tabs/). Kept dependency-free of
// recharts itself so importing this module never pulls in the chart
// library — that's what keeps the code-split boundary effective.

export const ZONES = [
  { name: "Gate 3", density: 91, cap: 100 },
  { name: "Gate 4", density: 97, cap: 100 },
  { name: "Concourse N", density: 62, cap: 100 },
  { name: "Concourse S", density: 48, cap: 100 },
  { name: "Fan Zone", density: 74, cap: 100 },
  { name: "Metro Exit", density: 55, cap: 100 },
];

export const VENDOR_LOAD = [
  { name: "Grill 12", wait: 14, stock: 82 },
  { name: "Taco Stand", wait: 6, stock: 91 },
  { name: "Cerveza Bar", wait: 22, stock: 34 },
  { name: "Ice Cream Co.", wait: 3, stock: 12 },
];

export const SUSTAIN_PIE = [
  { name: "Recycled", value: 62 },
  { name: "Landfill", value: 28 },
  { name: "Compost", value: 10 },
];
export const PIE_COLORS = ["#3ED07A", "#5A6B62", "#FFC24B"];

export function densityColor(d) {
  if (d >= 90) return "#FF6B5B";
  if (d >= 70) return "#FFC24B";
  return "#3ED07A";
}

export function Pill({ children, tone = "default" }) {
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

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-[#10201A] border border-[#223328] rounded-2xl transition-all duration-200 hover:border-[#2E4A3B] ${className}`}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#8FA69B] mb-3">
      {children}
    </div>
  );
}

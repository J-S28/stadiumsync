// Presentational primitives shared between the main shell and the
// lazy-loaded staff tabs. Component-only exports (see ./data.js for the
// pure data/logic half of the split) so Fast Refresh works cleanly here.

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

export function Card({ children, className = "", ...rest }) {
  return (
    <div className={`bg-[#10201A] border border-[#223328] rounded-2xl transition-all duration-200 hover:border-[#2E4A3B] ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <h2 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#8FA69B] mb-3">
      {children}
    </h2>
  );
}

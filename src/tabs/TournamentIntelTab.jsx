import { useState, useEffect } from "react";
import { Gauge, TrendingUp } from "lucide-react";
import { Card, SectionHeader, AIBadge } from "../shared/ui.jsx";
import { ZONES, VENDOR_LOAD, SUSTAIN_PIE } from "../shared/data.js";
import { callAssistant } from "../lib/callAssistant.js";
import { BRIEFING_FALLBACK } from "../lib/briefing.js";

// Computed once at module scope from static imports that never change for
// the lifetime of the app — same pattern as CopilotTab's flaggedZone —
// rather than re-derived on every render of the component below.
const busiestZone = ZONES.reduce((max, z) => (z.density > max.density ? z : max), ZONES[0]);
const lowestStockVendor = VENDOR_LOAD.reduce((min, v) => (v.stock < min.stock ? v : min), VENDOR_LOAD[0]);
const diversionRate = SUSTAIN_PIE.find((s) => s.name === "Recycled")?.value ?? 0;
const SNAPSHOT = `Zone density: ${busiestZone.name} is busiest at ${busiestZone.density}% capacity. Vendor stock: ${lowestStockVendor.name} is lowest at ${lowestStockVendor.stock}%. Sustainability: ${diversionRate}% of today's waste is being recycled.`;

// Organizer-facing, one level up from Ops Pulse/Copilot's staff-level
// signals — synthesizes crowd, vendor, and sustainability data into one
// AI-generated executive briefing instead of three separate dashboards.
export default function TournamentIntelTab() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    callAssistant({ mode: "briefing", messages: [{ role: "user", text: SNAPSHOT }] })
      .then((reply) => { if (!cancelled) setBriefing(reply || BRIEFING_FALLBACK); })
      .catch(() => { if (!cancelled) setBriefing(BRIEFING_FALLBACK); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionHeader label="Tournament operations briefing" badge={<AIBadge label="AI briefing" />} />
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#16281F] rounded-xl p-3">
            <div className="text-[10px] text-[#8FA69B] mb-1">Busiest zone</div>
            <div className="text-sm text-[#F3F3EF] font-semibold truncate">{busiestZone.name}</div>
            <div className="text-[11px] text-[#FFC24B]">{busiestZone.density}%</div>
          </div>
          <div className="bg-[#16281F] rounded-xl p-3">
            <div className="text-[10px] text-[#8FA69B] mb-1">Lowest stock</div>
            <div className="text-sm text-[#F3F3EF] font-semibold truncate">{lowestStockVendor.name}</div>
            <div className="text-[11px] text-[#FF6B5B]">{lowestStockVendor.stock}%</div>
          </div>
          <div className="bg-[#16281F] rounded-xl p-3">
            <div className="text-[10px] text-[#8FA69B] mb-1">Recycled</div>
            <div className="text-sm text-[#F3F3EF] font-semibold">{diversionRate}%</div>
            <div className="text-[11px] text-[#3ED07A] flex items-center gap-1"><TrendingUp size={10} aria-hidden="true" /> On target</div>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#8FA69B]" role="status">
            <Gauge size={16} className="shrink-0" aria-hidden="true" /> Generating tournament briefing…
          </div>
        ) : (
          <div className="bg-[#16281F] rounded-xl p-3.5 flex items-start gap-2.5" role="status">
            <Gauge size={16} className="text-[#3ED07A] mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-sm text-[#F3F3EF] leading-relaxed">{briefing}</div>
          </div>
        )}
      </Card>
    </div>
  );
}

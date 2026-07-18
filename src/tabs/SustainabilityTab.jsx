import { useState } from "react";
import { Leaf, CheckCircle2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, SectionLabel, SectionHeader, AIBadge } from "../shared/ui.jsx";
import { SUSTAIN_PIE, PIE_COLORS } from "../shared/data.js";
import { hapticDispatch } from "../lib/haptics.js";

export default function SustainabilityTab() {
  const [dispatched, setDispatched] = useState(false);
  const dispatch = () => {
    hapticDispatch();
    setDispatched(true);
  };
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Waste diversion — today</SectionLabel>
        <div className="flex items-center gap-6">
          <div className="chart-breathe" style={{ width: 140, height: 140 }}>
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
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} aria-hidden="true" />
                <span className="text-[#F3F3EF]">{s.name}</span>
                <span className="text-[#8FA69B]">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card className="p-5">
        <SectionHeader label="AI dispatch suggestion" badge={<AIBadge />} />
        <div className="flex items-start gap-2.5">
          <Leaf size={17} className="text-[#3ED07A] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm text-[#F3F3EF] leading-relaxed flex-1">
            Compost bin near Fan Zone is 89% full — AI suggests routing next collection cart there first to keep diversion rate on target.
            {dispatched ? (
              <div className="flex items-center gap-1.5 mt-2.5 text-[#3ED07A] text-xs font-semibold" role="status">
                <CheckCircle2 size={13} aria-hidden="true" /> Collection cart routed to Fan Zone
              </div>
            ) : (
              <button
                onClick={dispatch}
                className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#3ED07A] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none"
              >
                Dispatch cart
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

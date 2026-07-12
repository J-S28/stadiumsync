import { useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell,
} from "recharts";
import { Card, SectionLabel } from "../shared/ui.jsx";
import { densityColor, ZONES } from "../shared/data.js";

export default function OpsPulseTab() {
  const [dispatched, setDispatched] = useState(false);
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
          <AlertTriangle size={16} className="text-[#FF6B5B] mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-sm text-[#F3F3EF] flex-1">
            <span className="font-medium">47 attendees</span> asked the assistant about "nearest exit" near Gate 4 in the last 6 minutes — a 5x spike. Recommend deploying 2 crowd marshals to Gate 4.
            {dispatched ? (
              <div className="flex items-center gap-1.5 mt-2.5 text-[#3ED07A] text-xs font-semibold" role="status">
                <CheckCircle2 size={13} aria-hidden="true" /> 2 marshals dispatched to Gate 4
              </div>
            ) : (
              <button
                onClick={() => setDispatched(true)}
                className="mt-2.5 px-3.5 py-1.5 rounded-full bg-[#FF6B5B] text-[#0B140F] text-xs font-semibold hover:brightness-105 active:scale-95 transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#FF6B5B] focus-visible:outline-none"
              >
                Deploy marshals
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

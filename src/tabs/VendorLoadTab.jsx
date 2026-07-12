import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { Card, SectionLabel, Pill } from "../shared/ui.jsx";
import { VENDOR_LOAD } from "../shared/data.js";

export default function VendorLoadTab() {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <SectionLabel>Vendor wait times</SectionLabel>
        <div className="chart-breathe" style={{ width: "100%", height: 180 }}>
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

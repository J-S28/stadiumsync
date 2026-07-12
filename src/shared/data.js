// Pure data + logic shared between the main shell and the lazy-loaded
// Recharts-heavy staff tabs (see src/tabs/). Kept dependency-free of
// recharts itself so importing this module never pulls in the chart
// library — that's what keeps the code-split boundary effective. Split
// from UI components (see ./ui.jsx) so this file exports non-component
// values only, which keeps Fast Refresh working cleanly on both files.
import { BoyAvatar, GirlAvatar } from "./avatars.jsx";

export const AVATARS = {
  boy: { Comp: BoyAvatar, label: "Boy", accent: "#3ED07A" },
  girl: { Comp: GirlAvatar, label: "Girl", accent: "#FFC24B" },
};

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

import { useState, useCallback, useMemo, memo } from "react";
import { Clock, Plus, Minus, Zap, Package, CheckCircle2, X } from "lucide-react";
import { Card, AIBadge } from "../shared/ui.jsx";
import { hapticTick } from "../lib/haptics.js";

const SNACKS = [
  { id: 1, name: "Loaded Nachos", price: 9.5, vendor: "Grill 12", eta: "14 min" },
  { id: 2, name: "Street Tacos (3)", price: 8, vendor: "Taco Stand", eta: "6 min" },
  { id: 3, name: "Cerveza (16oz)", price: 11, vendor: "Cerveza Bar", eta: "22 min" },
  { id: 4, name: "Churro + Dip", price: 6.5, vendor: "Ice Cream Co.", eta: "3 min" },
];
// O(1) id -> snack lookup, used instead of re-scanning SNACKS with .find()
// every time the cart total/ETA is derived.
const SNACKS_BY_ID = new Map(SNACKS.map((s) => [s.id, s]));

// Memoized so adjusting one item's quantity only re-renders that row, not
// the full SNACKS list — add/sub are stable (useCallback, no dependency on
// cart) so this bails out cleanly via React.memo's shallow prop comparison.
const SnackRow = memo(function SnackRow({ snack, qty, onAdd, onSub }) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-[#F3F3EF] font-medium">{snack.name}</div>
        <div className="text-[#8FA69B] text-xs mt-0.5">{snack.vendor} · ${snack.price.toFixed(2)}</div>
        <div className="flex items-center gap-1 mt-1.5">
          <Clock size={11} className="text-[#8FA69B]" aria-hidden="true" />
          <span className="text-[11px] text-[#8FA69B]">{snack.eta} wait</span>
        </div>
      </div>
      {qty ? (
        <div className="flex items-center gap-2.5 bg-[#16281F] rounded-full px-1 py-1 shrink-0">
          <button onClick={() => onSub(snack.id)} aria-label={`Remove one ${snack.name}`} className="w-7 h-7 rounded-full bg-[#223328] flex items-center justify-center text-[#F3F3EF] focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"><Minus size={13} aria-hidden="true" /></button>
          <span className="text-[#F3F3EF] text-sm w-4 text-center" aria-live="polite">{qty}</span>
          <button onClick={() => onAdd(snack.id)} aria-label={`Add one more ${snack.name}`} className="w-7 h-7 rounded-full bg-[#3ED07A] flex items-center justify-center text-[#0B140F] focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"><Plus size={13} aria-hidden="true" /></button>
        </div>
      ) : (
        <button onClick={() => onAdd(snack.id)} aria-label={`Add ${snack.name} to order`} className="shrink-0 px-4 py-2 rounded-full bg-[#3ED07A] text-[#0B140F] text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none">Add</button>
      )}
    </Card>
  );
});

export default function OrderTab() {
  const [cart, setCart] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const add = useCallback((id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })), []);
  const sub = useCallback((id) => setCart((c) => {
    const n = { ...c };
    if (n[id] > 1) n[id] -= 1; else delete n[id];
    return n;
  }), []);
  const total = useMemo(
    () => Object.entries(cart).reduce((s, [id, q]) => s + SNACKS_BY_ID.get(Number(id)).price * q, 0),
    [cart],
  );
  const count = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);

  const placeOrder = () => {
    const maxEta = Object.keys(cart).reduce((max, id) => {
      const mins = parseInt(SNACKS_BY_ID.get(Number(id)).eta, 10) || 0;
      return Math.max(max, mins);
    }, 0);
    setPlacedOrder({ total, eta: maxEta });
    setCart({});
  };

  return (
    <div className="space-y-4 pb-20">
      {placedOrder && (
        <Card className="p-4 flex items-start gap-3 bg-[#3ED07A]/10 border-[#3ED07A]/30" role="status">
          <CheckCircle2 size={18} className="text-[#3ED07A] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 text-sm text-[#F3F3EF] leading-relaxed">
            Order placed — ${placedOrder.total.toFixed(2)} charged. Arriving at Section 118, Seat 14 in ~{placedOrder.eta} min.
          </div>
          <button onClick={() => setPlacedOrder(null)} aria-label="Dismiss order confirmation" className="text-[#8FA69B] hover:text-[#F3F3EF] shrink-0 focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none rounded">
            <X size={16} aria-hidden="true" />
          </button>
        </Card>
      )}

      <button
        onClick={() => { hapticTick(); add(4); }}
        aria-label="Add AI pick, Churro + Dip, to order"
        className="w-full text-left flex items-center gap-3 bg-gradient-to-r from-[#16281F] to-[#10201A] border border-[#223328] rounded-2xl p-4 hover:border-[#2E4A3B] transition focus-visible:ring-2 focus-visible:ring-[#3ED07A] focus-visible:outline-none"
      >
        <Zap size={16} className="text-[#FFC24B] shrink-0" aria-hidden="true" />
        <div className="text-sm text-[#F3F3EF] flex-1">AI pick: <span className="text-[#FFC24B] font-medium">Churro + Dip</span> — shortest wait right now (3 min)</div>
        <AIBadge className="shrink-0" />
      </button>

      <div className="space-y-3">
        {SNACKS.map((s) => (
          <SnackRow key={s.id} snack={s} qty={cart[s.id]} onAdd={add} onSub={sub} />
        ))}
      </div>

      {count > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm">
          <button
            onClick={placeOrder}
            className="w-full bg-[#3ED07A] text-[#0B140F] rounded-2xl py-3.5 px-5 flex items-center justify-between font-semibold shadow-xl shadow-black/40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B140F] focus-visible:ring-[#3ED07A] focus-visible:outline-none"
          >
            <span className="flex items-center gap-2"><Package size={17} aria-hidden="true" /> Send to seat 118-14</span>
            <span>${total.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

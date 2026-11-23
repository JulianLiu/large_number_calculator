import { useState } from 'react';
import { SMALL_UNIT_TABLE, UNIT_TABLE } from '../lib/units';

export default function UnitTable() {
  const [open, setOpen] = useState(false);
  return (
    <section aria-label="單位對照表" className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <h2 className="text-sm font-black tracking-widest text-stone-600">
          萬進單位對照表 <span className="font-normal text-stone-400">（十 → 無量）</span>
        </h2>
        <span className="text-lg font-black text-stone-400">{open ? '－' : '＋'}</span>
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm tabular sm:grid-cols-3">
          {SMALL_UNIT_TABLE.map((r) => (
            <div key={r.unit} className="flex items-baseline justify-between border-b border-dotted border-stone-200 py-1">
              <span className="font-serif font-bold">{r.unit}</span>
              <span className="text-xs text-stone-500">{r.power}</span>
            </div>
          ))}
          {UNIT_TABLE.filter((r) => r.exp >= 4).map((r) => (
            <div key={r.unit} className="flex items-baseline justify-between border-b border-dotted border-stone-200 py-1">
              <span className="font-serif font-bold">{r.unit}</span>
              <span className="text-xs text-stone-500">{r.power}</span>
            </div>
          ))}
        </div>
      )}
      {!open && (
        <p className="mt-1 text-xs leading-5 text-stone-500">
          萬（10⁴）・億（10⁸）・兆（10¹²）・京（10¹⁶）⋯⋯無量（10⁶⁸），每4位進一位。
        </p>
      )}
    </section>
  );
}

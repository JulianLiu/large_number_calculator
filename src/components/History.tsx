import { formatArabic } from '../lib/toZhNumber';

export interface HistoryItem {
  id: number;
  expr: string;
  result: string;
  zh: string | null;
}

interface HistoryProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function History({ items, onSelect, onClear }: HistoryProps) {
  if (items.length === 0) return null;
  return (
    <section aria-label="歷史紀錄" className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-black tracking-widest text-stone-600">歷史紀錄</h2>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full px-3 py-1 text-xs font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          清空
        </button>
      </div>
      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {items.map((it) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it)}
              className="w-full rounded-xl bg-[#faf7f0] px-3 py-2 text-left transition hover:bg-stone-100 active:scale-[0.99]"
              title="點一下把結果填回計算機"
            >
              <div className="truncate text-xs text-stone-500 tabular">{it.expr}</div>
              <div className="truncate text-base font-black tabular">＝ {formatArabic(it.result)}</div>
              {it.zh && <div className="truncate font-serif text-sm font-bold text-teal-900">{it.zh}</div>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

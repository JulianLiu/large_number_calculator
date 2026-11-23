interface KeypadProps {
  onDigit: (d: string) => void;
  onDot: () => void;
  onOp: (op: '+' | '-' | '×' | '÷') => void;
  onEquals: () => void;
  onClearEntry: () => void;
  onAllClear: () => void;
  onBackspace: () => void;
  onToggleSign: () => void;
  onPercent: () => void;
}

const btnBase =
  'rounded-2xl py-4 text-xl font-black transition active:scale-95 select-none sm:py-5 sm:text-2xl';

export default function Keypad(p: KeypadProps) {
  return (
    <section aria-label="按鍵區" className="grid grid-cols-4 gap-2 sm:gap-3">
      <button type="button" aria-label="全部清除" onClick={p.onAllClear} className={`${btnBase} bg-stone-200 text-stone-800 hover:bg-stone-300`}>
        AC
      </button>
      <button type="button" aria-label="清除輸入" onClick={p.onClearEntry} className={`${btnBase} bg-stone-200 text-stone-800 hover:bg-stone-300`}>
        C
      </button>
      <button type="button" aria-label="刪除" onClick={p.onBackspace} className={`${btnBase} bg-stone-200 text-stone-800 hover:bg-stone-300`}>
        ⌫
      </button>
      <button type="button" aria-label="除" onClick={() => p.onOp('÷')} className={`${btnBase} bg-teal-700 text-white hover:bg-teal-800`}>
        ÷
      </button>

      {['7', '8', '9'].map((d) => (
        <button key={d} type="button" onClick={() => p.onDigit(d)} className={`${btnBase} bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100`}>
          {d}
        </button>
      ))}
      <button type="button" aria-label="乘" onClick={() => p.onOp('×')} className={`${btnBase} bg-teal-700 text-white hover:bg-teal-800`}>
        ×
      </button>

      {['4', '5', '6'].map((d) => (
        <button key={d} type="button" onClick={() => p.onDigit(d)} className={`${btnBase} bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100`}>
          {d}
        </button>
      ))}
      <button type="button" aria-label="減" onClick={() => p.onOp('-')} className={`${btnBase} bg-teal-700 text-white hover:bg-teal-800`}>
        －
      </button>

      {['1', '2', '3'].map((d) => (
        <button key={d} type="button" onClick={() => p.onDigit(d)} className={`${btnBase} bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100`}>
          {d}
        </button>
      ))}
      <button type="button" aria-label="加" onClick={() => p.onOp('+')} className={`${btnBase} bg-teal-700 text-white hover:bg-teal-800`}>
        ＋
      </button>

      <button type="button" aria-label="正負號" onClick={p.onToggleSign} className={`${btnBase} bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100`}>
        ±
      </button>
      <button type="button" onClick={() => p.onDigit('0')} className={`${btnBase} bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100`}>
        0
      </button>
      <button type="button" aria-label="小數點" onClick={p.onDot} className={`${btnBase} bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100`}>
        ．
      </button>
      <button type="button" aria-label="百分比" onClick={p.onPercent} className={`${btnBase} bg-white text-stone-900 shadow-sm ring-1 ring-stone-200 hover:bg-stone-100`}>
        %
      </button>

      <button
        type="button"
        aria-label="等於"
        onClick={p.onEquals}
        className="col-span-4 rounded-2xl bg-[#c73e1d] py-4 text-2xl font-black text-white transition hover:bg-[#a93218] active:scale-[0.98] sm:py-5"
      >
        ＝
      </button>
    </section>
  );
}

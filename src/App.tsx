import { useCallback, useEffect, useRef, useState } from 'react';
import Decimal from 'decimal.js';
import Display from './components/Display';
import FullscreenButton from './components/FullscreenButton';
import History, { type HistoryItem } from './components/History';
import Keypad from './components/Keypad';
import UnitTable from './components/UnitTable';
import { canAppendChar, evaluateTokens, isOp, type Op } from './lib/calcEngine';
import { numberToZhTW } from './lib/toZhNumber';

export default function App() {
  const [entry, setEntry] = useState('');
  const [tokens, setTokens] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastExpr, setLastExpr] = useState('');
  const [error, setError] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const idRef = useRef(1);

  const resetAll = useCallback(() => {
    setEntry('');
    setTokens([]);
    setLastResult(null);
    setLastExpr('');
    setError(false);
    setJustEvaluated(false);
  }, []);

  const inputDigit = useCallback(
    (d: string) => {
      if (error) {
        setError(false);
        setTokens([]);
        setLastResult(null);
        setLastExpr('');
        setEntry(d);
        setJustEvaluated(false);
        return;
      }
      if (justEvaluated) {
        setTokens([]);
        setLastResult(null);
        setLastExpr('');
        setEntry(d === '0' ? '0' : d);
        setJustEvaluated(false);
        return;
      }
      if (entry === '' || entry === '0') {
        setEntry(d);
        return;
      }
      if (entry === '-' || entry === '-0') {
        setEntry(entry.startsWith('-') ? `-${d}` : d);
        return;
      }
      if (canAppendChar(entry, d)) {
        setEntry((e) => e + d);
      }
    },
    [entry, error, justEvaluated],
  );

  const inputDot = useCallback(() => {
    if (error) {
      setError(false);
      setTokens([]);
      setLastResult(null);
      setLastExpr('');
      setEntry('0.');
      setJustEvaluated(false);
      return;
    }
    if (justEvaluated) {
      setTokens([]);
      setLastResult(null);
      setLastExpr('');
      setEntry('0.');
      setJustEvaluated(false);
      return;
    }
    if (entry === '' || entry === '-') {
      setEntry((e) => (e === '-' ? '-0.' : '0.'));
      return;
    }
    if (!entry.includes('.')) {
      setEntry((e) => e + '.');
    }
  }, [entry, error, justEvaluated]);

  const inputOp = useCallback(
    (op: Op) => {
      if (error) return;
      if (justEvaluated) {
        const base = lastResult ?? '0';
        setTokens([base, op]);
        setEntry('');
        setLastExpr(`${base} ${op}`);
        setJustEvaluated(false);
        return;
      }
      if (entry !== '') {
        // 取代尾端孤立小數點/負號
        const clean = entry === '-' || entry === '.' || entry === '-.' ? '0' : entry;
        const next = isOp(tokens[tokens.length - 1] ?? '') ? [...tokens] : [...tokens, clean];
        // 若 tokens 尾端已是運算子（換運算子情境）其實不會發生，因為 entry 非空時尾端必為數字；保留防呆
        setTokens([...next, op]);
        setEntry('');
        setLastExpr([...next, op].join(' '));
        return;
      }
      // entry 為空
      if (tokens.length === 0) {
        if (lastResult !== null) {
          setTokens([lastResult, op]);
          setLastExpr(`${lastResult} ${op}`);
        } else if (op === '-') {
          setEntry('-');
        }
        return;
      }
      // tokens 非空且 entry 空：取代最後一個運算子
      if (isOp(tokens[tokens.length - 1])) {
        const next = [...tokens.slice(0, -1), op];
        setTokens(next);
        setLastExpr(next.join(' '));
      } else {
        setTokens([...tokens, op]);
        setLastExpr([...tokens, op].join(' '));
      }
    },
    [entry, error, justEvaluated, lastResult, tokens],
  );

  const doEquals = useCallback(() => {
    if (error) return;
    const cleanEntry = entry === '-' || entry === '.' || entry === '-.' ? '' : entry;
    const full = [...tokens, ...(cleanEntry !== '' ? [cleanEntry] : [])];
    if (full.length === 0) return;
    // 單一數字：直接顯示該數字的讀法
    if (full.length === 1) {
      const v = full[0];
      setLastResult(v);
      setLastExpr(`${v} ＝`);
      setTokens([]);
      setEntry(v);
      setJustEvaluated(true);
      setHistory((h) => [{ id: idRef.current++, expr: `${v} ＝`, result: v, zh: numberToZhTW(v) }, ...h].slice(0, 30));
      return;
    }
    const val = evaluateTokens(full);
    if (val === null) {
      setError(true);
      return;
    }
    const expr = `${full.join(' ')} ＝`;
    setLastResult(val);
    setLastExpr(expr);
    setTokens([]);
    setEntry(val);
    setJustEvaluated(true);
    setHistory((h) => [{ id: idRef.current++, expr, result: val, zh: numberToZhTW(val) }, ...h].slice(0, 30));
  }, [entry, error, tokens]);

  const clearEntry = useCallback(() => {
    setEntry('');
    if (error) setError(false);
  }, [error]);

  const backspace = useCallback(() => {
    if (error) {
      setError(false);
      return;
    }
    if (justEvaluated) {
      // = 之後按刪除：回到結果編輯狀態
      const base = lastResult ?? '';
      const next = base.slice(0, -1);
      setEntry(next);
      setLastResult(null);
      setLastExpr('');
      setJustEvaluated(false);
      return;
    }
    setEntry((e) => e.slice(0, -1));
  }, [error, justEvaluated, lastResult]);

  const toggleSign = useCallback(() => {
    if (error) return;
    if (entry !== '') {
      setEntry((e) => (e.startsWith('-') ? e.slice(1) : `-${e}`));
      return;
    }
    if (justEvaluated && lastResult !== null) {
      const toggled = lastResult.startsWith('-') ? lastResult.slice(1) : `-${lastResult}`;
      setEntry(toggled);
      setLastResult(null);
      setLastExpr('');
      setJustEvaluated(false);
      return;
    }
    setEntry('-');
  }, [entry, error, justEvaluated, lastResult]);

  const percent = useCallback(() => {
    if (error) return;
    const base = entry !== '' ? entry : lastResult;
    if (!base || base === '-' || base === '.' || base === '-.') return;
    try {
      const v = new Decimal(base).div(100).toString();
      if (justEvaluated) {
        setTokens([]);
        setLastExpr('');
        setJustEvaluated(false);
      }
      // % 結果小數可能很長，沿用 10 位顯示會在下次運算處理，這裡先完整保留由 finalize 處理
      setEntry(v);
      setLastResult(null);
    } catch {
      /* ignore */
    }
  }, [entry, error, justEvaluated, lastResult]);

  // ---- 顯示用衍生值 ----
  const previewArabic = entry !== '' && entry !== '-' ? entry : (lastResult ?? lastNonOp(tokens) ?? '0');
  const previewZh = error ? null : numberToZhTW(previewArabic === '' ? '0' : previewArabic);
  const isOverflow = !error && previewZh === null;

  const expressionForDisplay = justEvaluated ? lastExpr : tokens.length > 0 || entry !== '' ? [...tokens, ...(entry !== '' ? [entry] : [])].join(' ') : lastExpr;

  // ---- 鍵盤支援 ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key;
      if (/^[0-9]$/.test(k)) {
        inputDigit(k);
      } else if (k === '.') {
        inputDot();
      } else if (k === '+') {
        inputOp('+');
      } else if (k === '-') {
        // 避免與瀏覽器快捷鍵衝突不大，直接視為減號；負號用 ± 按鈕或鍵盤已有 entry 時仍為減號
        inputOp('-');
      } else if (k === '*' || k === 'x' || k === 'X') {
        inputOp('×');
      } else if (k === '/') {
        e.preventDefault();
        inputOp('÷');
      } else if (k === '%') {
        percent();
      } else if (k === 'Enter' || k === '=') {
        e.preventDefault();
        doEquals();
      } else if (k === 'Backspace') {
        backspace();
      } else if (k === 'Escape') {
        resetAll();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inputDigit, inputDot, inputOp, doEquals, backspace, resetAll, percent]);

  const handleSelectHistory = useCallback((item: HistoryItem) => {
    setEntry(item.result);
    setTokens([]);
    setLastResult(item.result);
    setLastExpr('');
    setError(false);
    setJustEvaluated(true);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-10 sm:max-w-lg">
        {/* Header */}
        <header className="mb-4 flex items-center gap-3">
          <div
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c73e1d] font-serif text-2xl font-black text-white shadow-md"
          >
            算
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">大數計算機</h1>
            <p className="text-xs font-medium tracking-widest text-stone-500">繁體中文・最大支援至無量 10⁶⁸</p>
          </div>
          <FullscreenButton />
        </header>

        <main className="space-y-3">
          <Display
            expression={expressionForDisplay}
            currentInput={entry}
            result={previewArabic === '' ? '0' : previewArabic}
            zhReading={previewZh}
            isOverflow={isOverflow}
            error={error}
          />

          <Keypad
            onDigit={inputDigit}
            onDot={inputDot}
            onOp={inputOp}
            onEquals={doEquals}
            onClearEntry={clearEntry}
            onAllClear={resetAll}
            onBackspace={backspace}
            onToggleSign={toggleSign}
            onPercent={percent}
          />

          <History items={history} onSelect={handleSelectHistory} onClear={() => setHistory([])} />
          <UnitTable />

          <footer className="pt-2 text-center text-xs leading-5 text-stone-400">
            整數最多 69 位・小數最多 10 位・除法結果四捨五入至 10 位
            <br />
            超過無量（≥10⁷²）僅顯示數字，不提供中文讀法
          </footer>
        </main>
      </div>
    </div>
  );
}

function lastNonOp(tokens: string[]): string | null {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!isOp(tokens[i])) return tokens[i];
  }
  return null;
}

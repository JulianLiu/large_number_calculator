import { useEffect, useRef, useState } from 'react';
import { isSpeechSupported, pickZhVoice, splitForSpeech } from '../lib/speech';
import { formatArabic, OVERFLOW_ZH_MSG } from '../lib/toZhNumber';

interface DisplayProps {
  expression: string;
  currentInput: string;
  result: string | null;
  zhReading: string | null;
  isOverflow: boolean;
  error: boolean;
}

function renderZhWithHighlight(zh: string) {
  // 把大單位字上色：萬億兆京垓秭穰溝澗正載極恆河沙阿僧祇那由他不可思議無量 + 十百千點負
  const units = [
    '恆河沙',
    '阿僧祇',
    '那由他',
    '不可思議',
    '無量',
    '萬',
    '億',
    '兆',
    '京',
    '垓',
    '秭',
    '穰',
    '溝',
    '澗',
    '正',
    '載',
    '極',
    '千',
    '百',
    '十',
  ];
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < zh.length) {
    let matched: string | null = null;
    for (const u of units) {
      if (zh.startsWith(u, i)) {
        if (!matched || u.length > matched.length) matched = u;
      }
    }
    if (matched) {
      out.push(
        <span key={key++} className="text-[#0f766e] font-bold">
          {matched}
        </span>,
      );
      i += matched.length;
    } else {
      const ch = zh[i];
      if (ch === '點' || ch === '負') {
        out.push(
          <span key={key++} className="text-[#c73e1d] font-bold">
            {ch}
          </span>,
        );
      } else {
        out.push(<span key={key++}>{ch}</span>);
      }
      i += 1;
    }
  }
  return out;
}

export default function Display({ expression, currentInput, result, zhReading, isOverflow, error }: DisplayProps) {
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speechSupported] = useState(() => isSpeechSupported());
  const chainIdRef = useRef(0);

  const shownArabic = result ?? (currentInput === '' ? '0' : currentInput);
  const zhText = zhReading;
  const canSpeak = speechSupported && !error && !isOverflow && !!zhReading;

  const stopSpeaking = (reset = true) => {
    chainIdRef.current += 1;
    if (speechSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    if (reset) setSpeaking(false);
  };

  // 預載語音清單（部分瀏覽器第一次 getVoices() 是空的，要等 voiceschanged）
  useEffect(() => {
    if (!isSpeechSupported()) return;
    const synth = window.speechSynthesis;
    try {
      synth.getVoices();
    } catch {
      /* ignore */
    }
    const onChange = () => {
      try {
        synth.getVoices();
      } catch {
        /* ignore */
      }
    };
    synth.onvoiceschanged = onChange;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, []);

  // 讀法改變 / 出錯 / 超限時停止朗讀；卸載時也停止
  useEffect(() => {
    stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zhReading, error, isOverflow]);
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const handleSpeakToggle = () => {
    if (!speechSupported) return;
    if (speaking) {
      stopSpeaking();
      return;
    }
    if (!zhReading || error || isOverflow) return;
    const synth = window.speechSynthesis;
    try {
      synth.cancel();
    } catch {
      /* ignore */
    }
    const token = ++chainIdRef.current;
    setSpeaking(true);
    const chunks = splitForSpeech(zhReading);
    let voices: SpeechSynthesisVoice[] = [];
    try {
      voices = synth.getVoices();
    } catch {
      voices = [];
    }
    const voice = pickZhVoice(voices);
    let idx = 0;
    const speakNext = () => {
      if (chainIdRef.current !== token) return;
      if (idx >= chunks.length) {
        setSpeaking(false);
        return;
      }
      const u = new SpeechSynthesisUtterance(chunks[idx]);
      u.lang = voice?.lang ?? 'zh-TW';
      if (voice) u.voice = voice;
      u.rate = 0.95;
      u.pitch = 1;
      u.onend = () => {
        if (chainIdRef.current !== token) return;
        idx += 1;
        speakNext();
      };
      u.onerror = () => {
        if (chainIdRef.current !== token) return;
        setSpeaking(false);
      };
      try {
        synth.speak(u);
      } catch {
        setSpeaking(false);
      }
    };
    speakNext();
  };

  const handleCopy = async () => {
    const textToCopy = zhReading ?? '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      // clipboard 在非安全環境可能失敗，改用 fallback
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section aria-label="顯示區" className="rounded-2xl border border-stone-200 bg-white/80 p-4 shadow-sm sm:p-5">
      {/* 算式 */}
      <div className="min-h-6 text-right text-sm text-stone-500 tabular break-all" aria-live="polite">
        {expression || '　'}
      </div>

      {/* 阿拉伯數字結果 */}
      <div
        className="mt-1 text-right text-3xl font-black tracking-tight break-all tabular sm:text-4xl"
        aria-label="阿拉伯數字結果"
      >
        {error ? '錯誤' : formatArabic(shownArabic)}
      </div>

      {/* 中文讀法 */}
      <div className="mt-3 rounded-xl bg-[#faf7f0] px-3 py-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest text-stone-500">中文讀法</span>
          {!error && zhReading && !isOverflow && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-bold text-stone-700 transition hover:border-teal-700 hover:text-teal-800 active:scale-95"
              >
                {copied ? '已複製 ✓' : '複製'}
              </button>
              {speechSupported && (
                <button
                  type="button"
                  onClick={handleSpeakToggle}
                  disabled={!canSpeak}
                  aria-pressed={speaking}
                  aria-label={speaking ? '停止朗讀' : '朗讀中文讀法'}
                  title="使用瀏覽器內建語音朗讀（免金鑰）"
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${
                    speaking
                      ? 'border-[#c73e1d] bg-[#c73e1d] text-white hover:bg-[#a93218]'
                      : 'border border-stone-300 bg-white text-stone-700 hover:border-teal-700 hover:text-teal-800'
                  }`}
                >
                  {speaking ? '停止' : '朗讀'}
                </button>
              )}
            </div>
          )}
        </div>
        {error ? (
          <p className="font-serif text-lg font-bold text-[#c73e1d]">除數不可為零</p>
        ) : isOverflow ? (
          <p className="text-sm leading-7 text-stone-500">{OVERFLOW_ZH_MSG}，僅顯示數字。</p>
        ) : (
          <p className="font-serif text-xl leading-9 font-bold break-all sm:text-2xl sm:leading-10">
            {zhText ? renderZhWithHighlight(zhText) : '零'}
          </p>
        )}
      </div>
    </section>
  );
}

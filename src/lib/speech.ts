/** 瀏覽器內建 Web Speech API（免 key）小工具 */

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

const MULTI_CHAR_UNITS = ['恆河沙', '阿僧祇', '那由他', '不可思議', '無量'];

/** 把長讀法切成小段，避免手機瀏覽器單段過長被截斷 */
export function splitForSpeech(text: string, maxLen = 80): string[] {
  const t = (text ?? '').trim();
  if (t === '') return [];
  if (t.length <= maxLen) return [t];
  const chunks: string[] = [];
  let start = 0;
  while (start < t.length) {
    let end = Math.min(start + maxLen, t.length);
    // 避免把多字單位從中切斷：往前找一個安全切點
    if (end < t.length) {
      for (const u of MULTI_CHAR_UNITS) {
        for (let k = 1; k < u.length; k++) {
          // 切點落在單位字中間時，往後挪到單位結尾
          const tail = t.slice(end - k, end - k + u.length);
          if (tail === u) {
            end = end - k + u.length;
            break;
          }
        }
      }
      if (end <= start) end = start + maxLen;
    }
    chunks.push(t.slice(start, end));
    start = end;
  }
  return chunks;
}

interface VoiceLike {
  lang: string;
  name: string;
  localService?: boolean;
}

/** 從語音清單挑最適合唸繁中讀法的聲音：zh-TW > zh-HK > zh > zh-CN */
export function pickZhVoice<T extends VoiceLike>(voices: T[]): T | null {
  if (!voices || voices.length === 0) return null;
  const norm = (s: string) => s.toLowerCase().replace('_', '-');
  let best: T | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const lang = norm(v.lang || '');
    let score = -100;
    if (lang === 'zh-tw') score = 100;
    else if (lang === 'zh-hk') score = 90;
    else if (lang === 'zh-mo') score = 85;
    else if (lang === 'zh') score = 70;
    else if (lang.startsWith('zh')) score = 60;
    else if (lang.startsWith('yue')) score = 40;
    else continue;
    const name = v.name || '';
    if (/台灣|臺灣|taiwan|國語|meijia|mei-jia|tingting|ting-ting|hsiaochen|hsiao-chen|yunjhe|yun-jhe/i.test(name)) {
      score += 20;
    } else if (/香港|hong\s?kong|cantonese/i.test(name)) {
      score += 5;
    }
    if (v.localService) score += 2;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}

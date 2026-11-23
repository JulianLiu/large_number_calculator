import { DIGIT_ZH, INNER_UNITS, LARGE_UNITS, MAX_READABLE_EXCLUSIVE_EXP } from './units';

export const OVERFLOW_ZH_MSG = '超出中文讀法範圍（超過無量）';

/**
 * 將阿拉伯數字字串轉為繁體中文大數讀法。
 * @param input 例如 "-123456.78"、"10000"、"0.5"
 * @returns 中文讀法；若整數部分 >= 10^72 則回傳 null（超限，不給讀法）
 */
export function numberToZhTW(input: string): string | null {
  if (typeof input !== 'string') return null;
  let s = input.trim();
  if (s === '' || s === '-' || s === '.' || s === '-.') return '零';

  // 正規化：處理科學記號（Decimal 已設定 toExpPos 很大，理論上不會進來，防呆）
  if (/[eE]/.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n)) return null;
    // 超大科學記號一律視為超限
    if (Math.abs(n) >= 1e21) return null;
    s = String(n);
  }

  let negative = false;
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }

  const parts = s.split('.');
  if (parts.length > 2) return null;
  let intPart = parts[0] ?? '';
  let fracPart = parts[1] ?? '';

  intPart = intPart.replace(/^0+(?=\d)/, '');
  if (intPart === '') intPart = '0';
  if (!/^\d+$/.test(intPart)) return null;
  if (fracPart !== '' && !/^\d+$/.test(fracPart)) return null;

  // 去掉小數尾端多餘的零（1.50 -> 1.5），全零則視為整數
  fracPart = fracPart.replace(/0+$/, '');

  // 超限判斷：整數位數 > 72 即 >= 10^72
  const intDigits = intPart.replace(/^0+/, '') === '' ? '0' : intPart.replace(/^0+/, '');
  if (intDigits !== '0' && intDigits.length > MAX_READABLE_EXCLUSIVE_EXP) {
    return null;
  }

  const intReading = convertInteger(intPart);
  let out = intReading;

  if (fracPart !== '') {
    const fracReading = [...fracPart].map((ch) => DIGIT_ZH[Number(ch)]).join('');
    out += `點${fracReading}`;
  }

  if (negative && out !== '零') {
    out = `負${out}`;
  }
  return out;
}

/** 整數部分轉中文（不含正負號、小數點） */
function convertInteger(intPart: string): string {
  const stripped = intPart.replace(/^0+/, '');
  if (stripped === '') return '零';

  // 從右邊每 4 位切一組
  const groups: string[] = [];
  let rest = stripped;
  while (rest.length > 0) {
    const g = rest.slice(-4);
    groups.push(g);
    rest = rest.slice(0, -4);
  }
  // groups[0] = 最低組，groups[i] 對應 LARGE_UNITS[i]
  // 若組數超過單位表（>18 組，即 >= 10^72），交給上層判斷，這裡防呆只取前 18 組
  if (groups.length > LARGE_UNITS.length) {
    // 交給呼叫端視為超限，但此函數內部不回傳 null，僅避免 crash
    return '';
  }

  let result = '';
  let zeroGap = false; // 中間有被跳過的全零組

  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    const value = Number(g); // 0..9999
    if (value === 0) {
      zeroGap = true;
      continue;
    }
    const groupReading = convertGroup4(g);
    const needsZero =
      result !== '' && (zeroGap || g.padStart(4, '0').startsWith('0') || value < 1000);
    // g.padStart 判斷：此組不足千位（例如 0001、0100），中文需補零
    // 但最高組不補（result === '' 時不補）
    if (needsZero && !result.endsWith('零')) {
      result += '零';
    }
    result += groupReading + LARGE_UNITS[i];
    zeroGap = false;
  }

  // 「一十」開頭省略「一」：一十 -> 十，一十萬 -> 十萬
  if (result.startsWith('一十')) {
    result = result.slice(1);
  }
  return result;
}

/** 4 位以內的組轉中文（不含大單位），例如 "0001"->"一"，"0100"->"一百" */
function convertGroup4(g: string): string {
  const padded = g.padStart(4, '0');
  let out = '';
  let hasOutput = false;
  let pendingZero = false;

  for (let pos = 0; pos < 4; pos++) {
    const d = Number(padded[pos]);
    const unitPos = 3 - pos; // 3:千 2:百 1:十 0:個
    if (d !== 0) {
      if (pendingZero && hasOutput) {
        out += '零';
      }
      pendingZero = false;
      out += DIGIT_ZH[d] + INNER_UNITS[unitPos];
      hasOutput = true;
    } else {
      if (hasOutput) {
        pendingZero = true;
      }
    }
  }
  return out;
}

/** 阿拉伯數字加千分位逗號顯示用（保留小數部分原樣） */
export function formatArabic(input: string): string {
  let s = input.trim();
  if (s === '' || s === '-' || s === '.' || s === '-.') return s === '' ? '0' : s;
  let sign = '';
  if (s.startsWith('-') || s.startsWith('+')) {
    if (s.startsWith('-')) sign = '-';
    s = s.slice(1);
  }
  const [intRaw = '0', fracRaw] = s.split('.');
  const intPart = (intRaw === '' ? '0' : intRaw).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (fracRaw !== undefined) {
    return `${sign}${intPart}.${fracRaw}`;
  }
  return `${sign}${intPart}`;
}

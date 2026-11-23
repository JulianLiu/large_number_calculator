import Decimal from 'decimal.js';

Decimal.set({
  precision: 150,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 150,
});

export type Op = '+' | '-' | '×' | '÷';

export const MAX_INT_DIGITS = 69;
export const MAX_FRAC_DIGITS = 10;
/** 除法/非整數結果保留小數位數 */
export const RESULT_FRAC_DIGITS = 10;

export function isOp(token: string): token is Op {
  return token === '+' || token === '-' || token === '×' || token === '÷';
}

/**
 * 求值：tokens 形如 ["12.5", "+", "3", "×", "2"]，先乘除後加減。
 * 回傳純字串（非科學記號），失敗回傳 null。
 */
export function evaluateTokens(tokens: string[]): string | null {
  if (tokens.length === 0) return null;
  // tokens 必須以數字結尾
  const list = [...tokens];
  if (list.length % 2 === 0) {
    // 以運算子結尾，捨去尾端運算子（例如連按 = 前的防呆）
    list.pop();
  }
  if (list.length === 0) return null;
  if (list.length === 1) {
    return normalizeDecimalString(list[0]);
  }

  try {
    // 第一遍：× ÷
    const first: string[] = [];
    let i = 0;
    while (i < list.length) {
      const t = list[i];
      if (isOp(t) && (t === '×' || t === '÷')) {
        const left = new Decimal(first.pop()!);
        const right = new Decimal(list[i + 1]);
        if (t === '÷' && right.isZero()) return null; // 除以零
        const r = t === '×' ? left.mul(right) : left.div(right);
        first.push(r.toString());
        i += 2;
      } else {
        first.push(t);
        i += 1;
      }
    }
    // 第二遍：+ -
    let acc = new Decimal(first[0]);
    for (let j = 1; j < first.length; j += 2) {
      const op = first[j];
      const val = new Decimal(first[j + 1]);
      if (op === '+') acc = acc.plus(val);
      else if (op === '-') acc = acc.minus(val);
      else return null;
    }
    return finalizeResult(acc);
  } catch {
    return null;
  }
}

/** Decimal -> 字串：非整數取 10 位四捨五入，去尾零，正規化 -0 */
function finalizeResult(dec: Decimal): string | null {
  try {
    let out: Decimal;
    if (dec.isInteger()) {
      out = dec;
    } else {
      out = dec.toDecimalPlaces(RESULT_FRAC_DIGITS, Decimal.ROUND_HALF_UP);
    }
    let s = out.toFixed();
    // toFixed 可能帶小數尾零，清掉
    if (s.includes('.')) {
      s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    if (s === '-0') s = '0';
    return normalizeDecimalString(s);
  } catch {
    return null;
  }
}

/** 正規化數字字串：去前導零、孤立小數點補 0、-0 -> 0 */
export function normalizeDecimalString(s: string): string | null {
  if (typeof s !== 'string') return null;
  let t = s.trim();
  if (t === '' || t === '-' || t === '.' || t === '-.') return '0';
  if (/[eE]/.test(t)) {
    try {
      const d = new Decimal(t);
      t = d.toFixed();
      if (t.includes('.')) t = t.replace(/0+$/, '').replace(/\.$/, '');
    } catch {
      return null;
    }
  }
  let neg = false;
  if (t.startsWith('-')) {
    neg = true;
    t = t.slice(1);
  } else if (t.startsWith('+')) {
    t = t.slice(1);
  }
  const [intRaw = '', fracRaw] = t.split('.');
  if (!/^\d*$/.test(intRaw)) return null;
  if (fracRaw !== undefined && !/^\d*$/.test(fracRaw)) return null;
  let intPart = intRaw.replace(/^0+/, '');
  if (intPart === '') intPart = '0';
  let out = fracRaw !== undefined && fracRaw !== '' ? `${intPart}.${fracRaw}` : intPart;
  // 小數尾零不強制清（輸入中保留），但全零小數可保留由呼叫端決定
  if (neg && out !== '0' && !/^0(\.0*)?$/.test(out)) {
    out = `-${out}`;
  }
  return out;
}

/** 檢查輸入是否還能再加一個字元（整數 69 位、小數 10 位） */
export function canAppendChar(current: string, char: string): boolean {
  const unsigned = current.startsWith('-') ? current.slice(1) : current;
  const [intPart = '', fracPart] = unsigned.split('.');
  if (char === '.') {
    if (unsigned.includes('.')) return false;
    return true;
  }
  if (!/^\d$/.test(char)) return false;
  if (unsigned.includes('.')) {
    return (fracPart ?? '').length < MAX_FRAC_DIGITS;
  }
  // 整數位數：去前導零後計算，但輸入 "0" 開頭直接取代，所以用原始長度判斷即可
  const digits = intPart.replace(/^0+/, '') === '' ? (intPart === '' ? 0 : 1) : intPart.replace(/^0+/, '').length;
  // 若目前是 "0" 且要輸入非零，會取代而非附加，允許
  if (intPart === '0') return true;
  return digits < MAX_INT_DIGITS;
}

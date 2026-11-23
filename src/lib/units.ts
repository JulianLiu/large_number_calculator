/**
 * 中文萬進制單位表（台灣 / Wiki 定義，兆 = 10^12）
 * index = 4 位一組的組號，exponent = index * 4
 * 最大支援到 無量 = 10^68（index 17）
 */
export const LARGE_UNITS = [
  '',
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
  '恆河沙',
  '阿僧祇',
  '那由他',
  '不可思議',
  '無量',
] as const;

/** 可讀上限：10^72（即 1 後面 72 個 0，73 位數）。達到此值即超限。 */
export const MAX_READABLE_EXCLUSIVE_EXP = 72;

/** 單一數字中文字 */
export const DIGIT_ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

/** 組內位階：個、十、百、千 */
export const INNER_UNITS = ['', '十', '百', '千'] as const;

export interface UnitRow {
  unit: string;
  exp: number;
  /** 10^n 的字串形式，方便顯示 */
  power: string;
}

export const UNIT_TABLE: UnitRow[] = LARGE_UNITS.map((unit, i) => ({
  unit: unit === '' ? '（個）' : unit,
  exp: i * 4,
  power: `10^${i * 4}`,
}));

/** 額外補上十、百、千列，方便對照表顯示 */
export const SMALL_UNIT_TABLE: UnitRow[] = [
  { unit: '十', exp: 1, power: '10^1' },
  { unit: '百', exp: 2, power: '10^2' },
  { unit: '千', exp: 3, power: '10^3' },
];

# 大數計算機｜最大支援至無量・10⁶⁸

繁體中文（zh-Hant-TW）單頁計算機。簡易四則運算，結果自動轉中文大數讀法，最大單位到 `無量（10⁶⁸）`。

## 功能

- 四則運算 `＋ － × ÷`、百分比 `%`、正負 `±`、清除 `C`、全部清除 `AC`、刪除 `⌫`、小數點
- 先乘除後加減，支援鍵盤輸入（數字、`+ - * / %`、`Enter`＝、`Backspace`、`Escape`清除）
- 整數最多 69 位（可輸 `10⁶⁸`），小數最多 10 位；除法結果四捨五入至 10 位
- 中文讀法：`numberToZhTW()`，整數每 4 位一組對應萬進單位
- 語音朗讀：瀏覽器內建 Web Speech API（免 key），自動選 `zh-TW` 語音，長讀法自動分段
- 超過無量（`≥10⁷²`）僅顯示阿拉伯數字，讀法區顯示「超出中文讀法範圍（超過無量）」
- 歷史紀錄（點一下回填）、萬進單位對照表、複製讀法

## 技術

Vite + React + TypeScript + Tailwind CSS，運算用 `decimal.js`（precision 150，避免大整數失真）。

## 開發

```bash
npm install
npm run dev
npm run build   # 產出 dist/，可直接部署到 GitHub Pages / Netlify / Vercel
npm run preview
```

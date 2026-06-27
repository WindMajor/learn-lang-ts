/**
 * bug_03：重载签名顺序错误——宽类型签名放在前面吞噬了精确匹配
 */

// BUG: 字符串签名在前，数字签名在后——但 string 签名"吞噬"了所有数字调用
function process(value: string): string;
function process(value: number): string;
function process(value: string | number): string {
  return String(value);
}

// TS 按重载声明的顺序尝试匹配。
// process(42) 先试 process(value: string)，number 不匹配 → 试第二个 → ✅
// 但如果第一个签名是 any 或更宽的……
// 会吞噬后面的精确签名！

// ✅ 正确做法：精确签名在前，宽泛签名在后
function processFixed(value: "special"): "SPECIAL";
function processFixed(value: number): `NUMBER_${number}`;
function processFixed(value: string): string;
function processFixed(value: string | number): string {
  if (value === "special") return "SPECIAL";
  if (typeof value === "number") return `NUMBER_${value}`;
  return value;
}

export {};

/**
 * bug_01：noImplicitAny 关闭导致隐式 any
 *
 * 编译方式（在 level-01 目录下运行）：
 *   方式1：npx tsc --noEmit --noImplicitAny false bugs/bug_01_noImplicitAny关闭导致隐式any.ts
 *   方式2：用本关 tsconfig.json（strict: true 默认启用 noImplicitAny，所以会报错）
 *         npx tsc --noEmit bugs/bug_01_noImplicitAny关闭导致隐式any.ts
 *         注意：由于不在 tsconfig 的 include 范围内，需要单独指定
 *
 * 预期 tsc 错误输出（strict: true 时）：
 *   error TS7006: Parameter 'data' implicitly has an 'any' type.
 *   error TS7006: Parameter 'a' implicitly has an 'any' type.
 *   error TS7006: Parameter 'b' implicitly has an 'any' type.
 */

// ================================================================
// 错误代码（严格模式下编译失败）
// ================================================================

// BUG: 参数 data 没有类型标注 → 在严格模式下隐式为 any → tsc 报错
function processData(data) {
  // 这里 data 是 any，所以什么都能做——包括不存在的属性
  // 如果 noImplicitAny 关闭，这行不会报错，但运行时可能炸
  return data.items.map((item) => item.name.toUpperCase());
  //     ^^^^^      ^^^        ^^^^
  //     都是 any! 没有任何类型检查！
}

// BUG: 参数 a 和 b 没有类型标注
function calculate(a, b) {
  return a + b;
  // 如果 a 是 string、b 是 number，结果可能不是你要的
  // 但 any 让你完全失去类型检查
}

// BUG: 回调函数参数没有类型标注
const numbers = [1, 2, 3];
const doubled = numbers.map((n) => n * 2);  // n 推断为 any（如果上下文推断失败或无显式标注）

// ================================================================
// 为什么会有这个陷阱？
// ================================================================
//
// noImplicitAny 如果关闭，TS 对无法推断类型的位置会默默使用 any。
// 一旦 any 出现，就像打开了潘多拉魔盒——any 会沿着调用链传播。
//
// 【对比 Rust】：Rust 不存在 any 概念。每个变量的类型必须在编译期确定。
//   如果 Rust 无法推断，它会要求你标注，而不是默默接受。
//   Rust 的 `_` 占位符也需要上下文能推断。
//
// 【对比 Kotlin】：Kotlin 也没有 any 概念。
//   类型推断失败时，Kotlin 会报编译错误，而不是给你一个"万能"类型。
//   `val x = someMethod()` 要么推断成功，要么编译失败。
//
// 【对比 Java】：Java 的 `var`（Java 10+）同样要么推断成功要么失败。
//   不存在"任何类型"的逃生舱。
//
// 【对比 Python】：Python 没有编译期类型检查（除非用 mypy/pyright），
//   所有变量本质都是 any。这也是为什么大型 Python 项目需要类型标注。
//   TS 的 noImplicitAny 正是为了弥补这个缺陷。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 修复后的代码：
interface DataItem {
  name: string;
}

interface DataPayload {
  items: DataItem[];
}

function processData(data: DataPayload): string[] {
  return data.items.map((item) => item.name.toUpperCase());
}

function calculate(a: number, b: number): number {
  return a + b;
}

const numbers: number[] = [1, 2, 3];
// n 被正确推断为 number（因为 numbers 是 number[]）
const doubled = numbers.map((n) => n * 2);
*/

export {}; // 使文件成为模块，避免变量名冲突

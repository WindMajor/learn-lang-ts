/**
 * bug_02：空对象类型 `{}` 的陷阱 —— 几乎兼容一切（除 null/undefined）
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_02_空对象类型陷阱.ts
 *
 * 预期 tsc 输出（如有错误行）：
 *   本文件中 `let obj: {} = "hello" ` 应该能编译通过（严格模式下也不例外！）
 *   这个"功能"会让来自 Rust/Kotlin 的开发者非常困惑。
 */

// ================================================================
// 错误代码：`{}` 兼容几乎所有非 null 值
// ================================================================

// BUG: `{}` 类型不等于"空对象"！
// `{}` 在 TS 中表示"任何非 null/undefined 的值"——这非常反直觉

let emptyObject: {} = 123;      // ✅ 编译通过！数字满足 `{}`
let alsoEmpty: {} = "hello";    // ✅ 编译通过！字符串满足 `{}`
let stillEmpty: {} = true;      // ✅ 编译通过！布尔值满足 `{}`
let wowEmpty: {} = [1, 2, 3];   // ✅ 编译通过！数组满足 `{}`
let reallyEmpty: {} = () => 42; // ✅ 编译通过！函数满足 `{}`

// WARNING: 如果你想定义一个"真正的空对象"类型，用 `Record<string, never>`
// 或 `{ [key: string]: never }` 或 `Record<PropertyKey, never>`

// BUG 场景：你写的函数期望一个对象参数
function processOptions(options: {}): void {
  // 你以为 options 是一个配置对象
  // 但实际上任何值都能传进来！
  // console.log(options.someProperty);  // ❌ 这样倒是会报错
  //                                     // 因为 `{}` 上没有 `someProperty`
}

// 但调用者可以传入任何东西
processOptions(42);           // ✅ 编译通过（但逻辑错误）
processOptions("config");     // ✅ 编译通过（但逻辑错误）
processOptions({ real: 1 });  // ✅ 编译通过（这是你想要的使用方式）

// 所以 `{}` 的问题不是"接受了错误类型"，而是：
// 1. 它不能描述"空对象"的意图
// 2. 它的兼容性太广，让类型标注失去了约束力
// 3. 它让来自 Rust/Kotlin/Java 的开发者误以为它等同于"空结构体"

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 的 `{}` 与 JS 的原型链模型有关。
// 在 JS 中，`Object.prototype` 是所有对象的原型，
// `(42).toString()` 能工作是因为数字也有 Object.prototype 上的方法。
// 所以从 TS 类型系统角度看，`number extends {}` 为 true 是合理的。
//
// BUT! 在实际编程中，`{}` 的广泛兼容性几乎总是 bug 的源头。

// 【对比 Rust】：
//   `fn process_options(options: &dyn Any)` — 接收任何类型，但必须显式用 Any
//   `struct Empty;` — 这才是真正的空类型（零大小类型 ZST）
//   不存在 "兼容一切" 的类型
//
// 【对比 Kotlin】：
//   `fun processOptions(options: Any)` — 明确的"任何类型"
//   Kotlin 没有 `{}` 的概念
//
// 【对比 Java】：
//   `void processOptions(Object options)` — Object 对应 TS 的 `unknown` 或 `{}`
//   但 Java 开发者很少用 Object 作为参数（通常用具体接口）
//
// 【对比 Go】：
//   `func processOptions(options any)` — Go 1.18+ 的 any 就是 interface{}
//   这与 TS 的 `{}` 最接近——interface{} 也几乎兼容一切
//   但 Go 的 interface{} 是明确的"任何类型"语义，不像 TS 的 `{}` 那样隐晦

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 真正的空对象类型（不接受 primitive）
type StrictEmptyObject = Record<string, never>;

// 或使用更精确的类型
type ConfigOptions = {
  timeout?: number;
  retries?: number;
  baseUrl?: string;
};

// ✅ 如果不确定结构，至少排除 primitive
type SomeObject = Record<string, unknown>;

// ✅ 用 unknown 代替 any/{} 作为"我不知道类型"的标记
let trulyUnknown: unknown = 42;
trulyUnknown = "hello";
trulyUnknown = { foo: "bar" };
// 但不能直接访问属性（需要类型守卫或断言）
// trulyUnknown.foo;  // ❌ 编译错误
if (typeof trulyUnknown === "object" && trulyUnknown !== null) {
  // 这里需要进一步检查
}
*/

export {};

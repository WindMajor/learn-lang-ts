/**
 * bug_03：推断失败——NoInfer 场景中的泛型推断
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_03_条件类型推断失败.ts
 *
 * 预期 tsc 输出：
 *   在严格模式下此文件编译通过，但条件类型中的 infer 可能产生 never
 *   如果 infer 无法匹配，结果就是 never——这是静默失败，不会有编译错误
 */

// ================================================================
// 错误代码：infer 推断失败时静默返回 never
// ================================================================

// 尝试从对象中提取某个属性的类型
type ExtractPropType<T, K extends keyof T> = T[K];
// ✅ 这个很简单，直接索引访问就行

// 但如果想提取第一个满足某种条件的属性类型……
type ExtractFirstStringProp<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];
// 这返回的是"第一个 string 属性的键名"，而不是类型

// BUG: 如果 T 没有任何 string 类型的属性……
interface NoStrings {
  id: number;
  count: number;
  active: boolean;
}

type FirstStringKey = ExtractFirstStringProp<NoStrings>;
// FirstStringKey = never ← 所有属性都不满足 string 约束
// 结果是 never，而不是编译错误——你可能没意识到"没有字符串属性"

// 这在你依赖这个类型构建下游逻辑时非常危险
// 比如：
// declare function getStringProp<T>(obj: T, key: ExtractFirstStringProp<T>): string;

// const result = getStringProp({ id: 1, count: 2 }, ???);
// key 参数的类型是 never——你传不了任何值！

// ================================================================
// 另一个 infer 陷阱：嵌套条件中的推断范围
// ================================================================

// 尝试提取 Promise<Response> 中的 Response
type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;

// 如果传递多层 Promise……
type NestedPromise = Promise<Promise<number>>;
type UnwrappedOnce = UnwrapPromise<NestedPromise>;
// UnwrappedOnce = Promise<number> ← 只解包了一层！

// 如果你想递归解包：
type DeepUnwrap<T> = T extends Promise<infer R> ? DeepUnwrap<R> : T;
type UnwrappedDeep = DeepUnwrap<NestedPromise>;
// UnwrappedDeep = number ✅

// 但 DeepUnwrap 对非 Promise 类型也是安全的：
type JustString = DeepUnwrap<string>;
// JustString = string ✅

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// 条件类型中的推断是"静默"的：
// - infer 匹配成功 → 提取出类型
// - infer 匹配失败 → never（或走 else 分支）
//
// 没有编译器警告告诉你"这个结果可能是 never"。
// 如果下游依赖这个类型，可能产生连锁的编译错误（或更糟：never 被忽略了）。
//
// 【对比 Rust】：
//   Rust 没有 infer 概念。如果你需要从类型中提取信息，
//   用关联类型（associated type）——在 trait 声明期就定好了，不存在推断失败。
//
// 【对比 C++】：
//   C++ 的模板元编程有类似的问题——SFINAE 失败是静默的。
//   但 C++20 的 concepts 提供了更好的诊断信息。
//
// 【对比 Kotlin/Java】：
//   没有类型层面的条件/infer 能力。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：使用编译期类型断言来验证推断结果
type Assert<T extends true> = T;

// 如果你的 ExtractFirstStringProp 期望返回 string 键名：
type _Test = Assert<
  [ExtractFirstStringProp<NoStrings>] extends [never] ? true : false
>;
// 有意检查结果是否为 never，提醒你处理空情况

// ✅ 方案 2：设计更安全的 API——用条件类型提供默认值
type SafeExtractFirstStringKey<T> = ExtractFirstStringProp<T> extends never
  ? "no-string-keys"
  : ExtractFirstStringProp<T>;

// ✅ 方案 3：使用实用工具类型验证
type HasStringProp<T> = ExtractFirstStringProp<T> extends never ? false : true;
type T1 = HasStringProp<NoStrings>;      // false
type T2 = HasStringProp<{ name: string }>;  // true
// 先检查，再使用
*/

export {};

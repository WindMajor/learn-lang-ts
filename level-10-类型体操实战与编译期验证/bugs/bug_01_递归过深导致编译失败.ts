/**
 * bug_01：递归过深导致 TS2589 错误
 * 编译：npx tsc --noEmit bugs/bug_01_递归过深导致编译失败.ts
 *
 * 预期：error TS2589: Type instantiation is excessively deep and possibly infinite.
 */

// 尝试用递归类型做乘法（通过 repeated addition）
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;

type Multiply<A extends number, B extends number, Acc extends unknown[] = []> =
  B extends 0 ? Acc["length"]
  : Multiply<A, Subtract<B, 1>, [...Acc, ...BuildTuple<A>]>;

// Subtract 也需要递归实现
type Subtract<A extends number, B extends number> =
  BuildTuple<A> extends [...BuildTuple<B>, ...infer R] ? R["length"] : never;

// Multiply<9, 9> 需要 9 层加法 × 9 个元组构造 = 81 次递归——仍然在 50 层限制内
// 但 Multiply<12, 12> 可能触及限制
// type Test9x9 = Multiply<9, 9>;  // = 81, 在限制内
// type Test12x12 = Multiply<12, 12>;  // 可能触发 TS2589

// ✅ 修复：用 Accumulator 参数减少递归深度，或使用尾递归优化模式
export {};

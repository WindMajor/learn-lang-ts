/**
 * bug_02：strictFunctionTypes 关闭时函数参数双变导致类型不匹配
 * 编译：npx tsc --noEmit --strictFunctionTypes false bugs/bug_02_函数双变导致参数类型不匹配.ts
 *
 * 预期输出：
 *   strictFunctionTypes: false → 编译无错误（bug！）
 *   strictFunctionTypes: true → error TS2322 参数类型不兼容
 */

type StringHandler = (s: string) => void;
type NumberHandler = (n: number) => void;

// 如果 strictFunctionTypes: false，这行编译通过
// 但 StringHandler 接受 string，NumberHandler 接受 number
// 它们不应该兼容！
const handler: StringHandler = ((n: number) => {
  console.log(n.toFixed(2));
}) as unknown as StringHandler;

// 双变意味着以下赋值也合法：
// const alsoOk: NumberHandler = ((s: string) => s.toUpperCase()) as unknown as NumberHandler;
// 但运行时调用 alsoOk(42) 会导致 42.toUpperCase() 报错！

// 【对比 Kotlin】：函数参数逆变，typeof 拒绝不安全的赋值
// ✅ 修复：开启 strictFunctionTypes
export {};

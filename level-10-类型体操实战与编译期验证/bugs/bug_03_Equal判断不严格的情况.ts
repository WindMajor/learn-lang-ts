/**
 * bug_03：简单的 extends 判断不能替代严格 Equal
 *
 * Equal 用函数类型的协变逆变特性做严格判断
 * 简单用 A extends B && B extends A 在某些场景下不够精确
 */

type SimpleEqual<A, B> = A extends B ? (B extends A ? true : false) : false;
type StrictEqual<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// SimpleEqual 的"误判"场景：
type T1 = SimpleEqual<{ a: string } & { b: number }, { a: string; b: number }>; // true
type T2 = StrictEqual<{ a: string } & { b: number }, { a: string; b: number }>; // true（实际上这个场景下两者一样）

// 但 SimpleEqual 对 any 的误判：
type T3 = SimpleEqual<any, string>;  // true（any extends string 且 string extends any）
type T4 = StrictEqual<any, string>;  // false ✅

// ✅ 永远用 StrictEqual（Equal）做编译期类型断言
export {};

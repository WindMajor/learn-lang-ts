/**
 * Level 10 沙盒
 */
console.log("=== Level 10 沙盒 ===\n");

// 编译期测试工具
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

type _Tests = [
  Expect<Equal<string, string>>,
  Expect<Equal<"hello", "hello">>,
];

console.log("类型测试通过 ✅");

export {};

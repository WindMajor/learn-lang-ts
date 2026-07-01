/**
 * Level 01 沙盒文件
 *
 * 随意修改此文件，用它来实验各种 tsconfig 开关的行为。
 * 改完后运行 `npx tsc --noEmit` 或 `npx ts-node playground.ts` 看结果。
 *
 * 尝试：
 * 1. 注释掉某行类型标注，看 tsc 报什么错
 * 2. 试试给 `strictNullChecks: false` 后 run 这个文件
 * 3. 试试 type 断言 `as` / `as const` 的效果
 * 4. 写一个泛型函数，看编译产物
 */

console.log("=== 沙盒实验区：随意修改 ===");

// 实验 1：隐式 any 的边界
// 尝试去掉参数类型标注，看看 tsc 报什么错
function experiment1(x: unknown): string {
  // 修改这里：把参数类型去掉，改成 function experiment1(x) { ... }
  if (typeof x === "string") {
    return x.toUpperCase();
  }
  return String(x);
}

// 实验 2：null 安全的边界
// 尝试去掉后面的 `| null`，看看 strictNullChecks 的影响
function experiment2(name: string | null): string {
  // 试试去掉 if 检查
  if (name === null) {
    return "null received";
  }
  return name;
}

// 实验 3：类型擦除的直观感受
// 定义一个复杂类型，编译后看看 .js 里还剩下什么
interface ComplexType {
  id: number;
  metadata: {
    tags: string[];
    createdAt: Date;
  };
  compute: (x: number) => number;
}

// 编译后，ComplexType 接口完全消失
// obj 只是一个普通的 JS 对象
const obj: ComplexType = {
  id: 1,
  metadata: {
    tags: ["typescript", "learning"],
    createdAt: new Date(),
  },
  compute: (x) => x * 2,
};

console.log(experiment1("hello"));
console.log(experiment2("world"));
console.log(experiment2(null));
console.log(obj.compute(21));

// 实验 4：编译期类型验证
// 这些 type 定义不产生任何 JS 代码
type SandboxTests = {
  test_string_literal: "hello" extends string ? true : false;
  // 预期：true

  test_array_type: number[] extends Array<number> ? true : false;
  // 预期：true

  test_function_return: (() => string) extends (() => string | null) ? true : false;
  // 预期：true（返回值协变：string 可以赋值给 string | null）
};

// 尝试改改上面的类型关系，看看何时编译报错

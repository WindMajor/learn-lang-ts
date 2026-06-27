/**
 * Level 05 主代码：泛型、约束与条件类型
 *
 * 本文件演示：
 * 1. 泛型函数/接口/类 + 约束
 * 2. 条件类型：T extends U ? X : Y
 * 3. infer 推断关键字
 * 4. 分配性条件类型（Distributive Conditional Type）
 * 5. 实用条件类型模式
 *
 * 运行方式：
 *   npx ts-node src/main.ts
 */

// =============================================================
// 第一部分：泛型与约束
// =============================================================

function genericsWithConstraints() {
  console.log("=== 泛型与约束 ===");

  // WHAT: 泛型让函数/类能处理多种类型
  // WHY: 避免重复代码，保持类型安全
  // CONTRAST: Rust 的泛型：
  //   fn identity<T>(x: T) -> T { x }——语法几乎一样！
  //   但在编译期，Rust 会为每个具体类型生成独立的机器码（单态化）
  //   TS 则在编译期擦除泛型——运行时只有一个 identity 函数
  // CONTRAST: C++ 的模板：
  //   模板也是在编译期展开，生成多份代码（代码膨胀）
  //   但模板可以做 SFINAE（替换失败不是错误）——TS 的条件类型是其"类型层面"的对应
  // CONTRAST: Java/Kotlin 的泛型：
  //   与 TS 一样使用类型擦除——运行时类型参数被抹去
  //   但 Java 在 JVM 层面有"桥方法"（bridge method）来维持协变

  // 类型层：泛型约束 `T extends { length: number }` 要求 T 必须有 length 属性
  // 值层：函数实现中可以安全使用 length
  function longest<T extends { length: number }>(a: T, b: T): T {
    return a.length >= b.length ? a : b;
  }

  const arrResult = longest([1, 2, 3], [4, 5]);
  const strResult = longest("hello", "world!");
  console.log(`最长数组：[${arrResult}]`);
  console.log(`最长字符串：${strResult}`);

  // ===== 泛型接口 =====
  interface KeyValuePair<K, V> {
    key: K;
    value: V;
  }

  const pair1: KeyValuePair<string, number> = { key: "age", value: 30 };
  const pair2: KeyValuePair<number, string> = { key: 1, value: "first" };
  console.log(`pair1: ${pair1.key} → ${pair1.value}`);
  console.log(`pair2: ${pair2.key} → ${pair2.value}`);

  // ===== 泛型默认值 =====
  // CONTRAST: Rust 没有泛型默认值——所有类型参数必须显式提供或被推断
  interface PaginatedResponse<T = unknown> {
    items: T[];
    total: number;
    page: number;
  }

  const raw: PaginatedResponse = { items: [1, 2, 3], total: 100, page: 1 };
  // raw 的类型是 PaginatedResponse<unknown>（使用了默认值 unknown）
  console.log(`分页（默认 unknown）：total=${raw.total}, items=${raw.items.length} 个`);
}

// =============================================================
// 第二部分：条件类型基础
// =============================================================

function conditionalTypesBasics() {
  console.log("\n=== 条件类型基础 ===");

  // WHAT: `T extends U ? X : Y` 在类型层面做条件判断
  // WHY: 这让你可以编写"类型层面的函数"——根据输入类型计算输出类型
  // CONTRAST: Rust 没有条件类型。
  //   你有 trait bounds（`T: Clone`）和关联类型（`type Output`）
  //   但你不能写 `type IsString<T> = T extends String ? true : false` 这样的代码
  // CONTRAST: C++ 的 SFINAE / `if constexpr` / `std::conditional` 最接近 TS 的条件类型
  //   `std::conditional_t<std::is_same_v<T, std::string>, int, double>`
  //   但 C++ 的模板展开是生成代码，TS 的条件类型是纯粹的类型运算

  // 类型层：定义一个判断是否为特定类型的条件类型
  type IsPrimitive<T> = T extends string | number | boolean | null | undefined
    ? true
    : false;

  // 类型层：以下都是类型运算，不产生 JS 代码
  type Test1 = IsPrimitive<string>;   // true
  type Test2 = IsPrimitive<number>;   // true
  type Test3 = IsPrimitive<object>;   // false
  type Test4 = IsPrimitive<Date>;     // false

  // 值层：不能在运行时用 IsPrimitive！
  // const check = IsPrimitive<string>;  // ❌ 编译错误！类型不能当值用

  console.log("条件类型是纯编译期运算 ✅");
  console.log("IsPrimitive<string> = true, IsPrimitive<object> = false");

  // ===== 实用条件类型：提取某个类型 =====
  // WHAT: 如果 T 是数组类型，提取元素类型，否则返回 never
  type Flatten<T> = T extends Array<infer E> ? E : T;

  type StrElement = Flatten<string[]>;   // string
  type NumElement = Flatten<number[]>;   // number
  type NotArray = Flatten<{ x: number }>; // { x: number }

  console.log("Flatten<string[]> → string");
  console.log("Flatten<{ x: number }> → { x: number }（不是数组，原样返回）");
}

// =============================================================
// 第三部分：infer 推断
// =============================================================

function inferKeywordDemo() {
  console.log("\n=== infer 推断 ===");

  // WHAT: `infer X` 在条件类型中"提取"一个类型并命名为 X
  // WHY: 这是 TS 类型体操中最重要的关键字——让你可以解构类型
  // CONTRAST: Rust 没有 infer——不需要，因为泛型是单态化的
  // CONTRAST: C++ 的模板参数推导（CTAD）类似——`std::vector v{1, 2, 3}` 推断为 `vector<int>`
  //           在模板特化中 `template<typename T> void foo(std::vector<T>)` 也隐式推断 T

  // ===== 提取函数返回类型 =====
  type MyReturnType<T> = T extends (...args: unknown[]) => infer R ? R : never;

  type Fn1 = () => string;
  type Fn2 = (x: number, y: string) => boolean;

  type Fn1Return = MyReturnType<Fn1>; // string
  type Fn2Return = MyReturnType<Fn2>; // boolean

  // TS 内置的 ReturnType<T> 就是这样的实现
  console.log("MyReturnType<() => string> = string");
  console.log("MyReturnType<(x: number, y: string) => boolean> = boolean");

  // ===== 提取 Promise 内部值 =====
  type Awaited<T> = T extends Promise<infer V> ? Awaited<V> : T;
  // 递归！多层 Promise 嵌套也能解开

  type P1 = Promise<string>;                          // Promise<string>
  type P2 = Promise<Promise<number>>;                 // Promise<Promise<number>>
  type P1Unwrapped = Awaited<P1>;                      // string
  type P2Unwrapped = Awaited<P2>;                      // number（递归解包）

  console.log("Awaited<Promise<string>> = string");
  console.log("Awaited<Promise<Promise<number>>> = number（递归解包）");

  // ===== 提取数组元素 =====
  type ArrayElement<T> = T extends (infer E)[] ? E : never;
  type ElementOfStrArr = ArrayElement<string[]>;  // string

  // ===== 提取函数参数列表（作为元组） =====
  type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
  type Fn3 = (name: string, age: number, active: boolean) => void;
  type Fn3Params = Parameters<Fn3>; // [name: string, age: number, active: boolean]

  console.log("Parameters<(name: string, age: number) => void> = [name: string, age: number]");

  // ===== 实战：类型安全的管道函数 =====
  function pipe<A, B, C>(f: (a: A) => B, g: (b: B) => C): (a: A) => C {
    return (a: A) => g(f(a));
  }

  const toLength = (s: string) => s.length;
  const double = (n: number) => n * 2;

  const piped = pipe(toLength, double);
  const result = piped("hello"); // "hello" → 5 → 10
  console.log(`管道("hello") → length → double → ${result}`);
  // pipe 的返回类型是 (a: string) => number
  // TS 自动推断出 A=string, B=number, C=number
}

// =============================================================
// 第四部分：分配性条件类型（最关键的概念！）
// =============================================================

function distributiveConditionalTypes() {
  console.log("\n=== 分配性条件类型 ===");

  // WHAT: 当 T 是裸类型参数（bare type parameter）时，
  //       T extends U ? X : Y 会分发到联合类型的每个成员
  //       即 T = A | B  → (A extends U ? X : Y) | (B extends U ? X : Y)
  //
  // WHY: 这是数学上的"分配律"——条件对联合类型"分发"
  //       如果你想对联合类型整体判断（不拆开），需要抑制分配性

  // 类型层：定义一个分配性条件类型
  type IsString<T> = T extends string ? true : false;

  // 分配性演示：
  type Test1 = IsString<string>;            // true
  type Test2 = IsString<number>;            // false
  type Test3 = IsString<string | number>;   // true | false ← 注意！不是 false！
  //         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //         分配性：拆成 string 和 number 分别判断
  //         = IsString<string> | IsString<number>
  //         = true | false

  console.log("IsString<string | number> = true | false（分配后展开！）");
  console.log("这不是 false！因为分配性让每个分支独立判断");

  // 抑制分配性：用 [] 包装裸类型参数
  type IsString_NonDistributive<T> = [T] extends [string] ? true : false;
  type Test4 = IsString_NonDistributive<string | number>; // false
  //         因为 [string | number] 不 extends [string]
  console.log("[T] 包装后：IsString_NonDistributive<string | number> = false");

  // 实战示例：Exclude 和 Extract
  // 类型层：以下是 TS 内置类型的实现
  type MyExclude<T, U> = T extends U ? never : T;
  // 分配性起了关键作用！
  // MyExclude<"a" | "b" | "c", "b"> =
  //   ("a" extends "b" ? never : "a") | ("b" extends "b" ? never : "b") | ("c" extends "b" ? never : "c") =
  //   "a" | never | "c" = "a" | "c"

  type MyExtract<T, U> = T extends U ? T : never;

  type Excluded = MyExclude<"a" | "b" | "c", "b">;    // "a" | "c"
  type Extracted = MyExtract<"a" | "b" | "c", "b" | "c">;  // "b" | "c"

  // WARNING: 分配性条件类型最常见陷阱：你以为在对整个联合类型做判断，
  //          实际上条件被分配到了每个成员！
  //          不清楚"分配性"是加班调试 TS 类型的常见原因
}

// =============================================================
// 第五部分：实用条件类型模式
// =============================================================

function practicalConditionalPatterns() {
  console.log("\n=== 实用条件类型模式 ===");

  // ===== 模式 1：NonNullable =====
  type MyNonNullable<T> = T extends null | undefined ? never : T;
  type NonNullStr = MyNonNullable<string | null | undefined>; // string

  // ===== 模式 2：深度 Readonly（递归） =====
  type DeepReadonly<T> = {
    readonly [K in keyof T]: T[K] extends object
      ? T[K] extends Function
        ? T[K]  // 函数不转换为 readonly
        : DeepReadonly<T[K]>
      : T[K];
  };

  interface DeepObj {
    name: string;
    meta: {
      tags: string[];
      count: number;
    };
  }

  type ReadonlyDeepObj = DeepReadonly<DeepObj>;
  // { readonly name: string; readonly meta: { readonly tags: readonly string[]; readonly count: number } }

  console.log("DeepReadonly 递归地将所有嵌套属性设为 readonly ✅");

  // ===== 模式 3：根据条件选择不同的类型（类型层面的 if-else） =====
  type ResponseType<T extends { ok: boolean; data?: unknown; error?: unknown }> =
    T extends { ok: true } ? { data: T["data"]; success: true }
    : T extends { ok: false } ? { error: T["error"]; success: false }
    : never;

  type SuccessResp = ResponseType<{ ok: true; data: string }>;
  // { data: string; success: true }

  type ErrorResp = ResponseType<{ ok: false; error: Error }>;
  // { error: Error; success: false }

  console.log("条件类型可模拟类型层面的 if-else ✅");

  // ===== 模式 4：字符串条件类型 =====
  // 判断字符串字面量是否以某个字符串开头
  type StartsWith<T extends string, Prefix extends string> =
    T extends `${Prefix}${string}` ? true : false;

  type TestSW1 = StartsWith<"hello world", "hello">;  // true
  type TestSW2 = StartsWith<"hello world", "hallo">;  // false  ← 区分大小写

  console.log('StartsWith<"hello world", "hello"> = true');
  console.log('StartsWith<"hello world", "hallo"> = false');
}

// =============================================================
// 第六部分：编译期类型验证
// =============================================================

// 类型层：用条件类型做编译期验证
// 注意：下面类型定义在函数外部，以便编译期验证

// Exclude 的条件类型实现
type MyExcludeTest<T, U> = T extends U ? never : T;
// Extract 的条件类型实现
type MyExtractTest<T, U> = T extends U ? T : never;
// 是否字符串的条件类型
type IsStringTest<T> = T extends string ? true : false;
// 是否字符串（抑制分配性）
type IsStringNonDistributiveTest<T> = [T] extends [string] ? true : false;

type ConditionalTypeTests = {
  // Exclude 分发
  t01_exclude: MyExcludeTest<1 | 2 | 3, 2>;
  // expected: 1 | 3

  // Extract 分发
  t02_extract: MyExtractTest<1 | 2 | 3, 2 | 4>;
  // expected: 2

  // 分配性验证
  t03_distributive: IsStringTest<string | number> extends boolean ? true : false;
  // expected: true（true | false 是 boolean 的子类型）

  // 抑制分配性后
  t04_non_distributive: IsStringNonDistributiveTest<string | number>;
  // expected: false

  // never 在分配性条件类型中的行为
  t05_never_distributive: IsStringTest<never>;
  // expected: never（空联合生成空结果）
};

// =============================================================
// 主入口
// =============================================================

function main(): void {
  genericsWithConstraints();
  conditionalTypesBasics();
  inferKeywordDemo();
  distributiveConditionalTypes();
  practicalConditionalPatterns();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：泛型在编译期擦除（与 Java 同，与 Rust 异）。");
  console.log("条件类型是 TS 独有的"类型层面计算"能力——Rust/Java 都没有直接对应。");
  console.log("分配性是条件类型最反直觉但也最强大的特性。");
  console.log("infer 是解构类型的瑞士军刀。");
}

main();

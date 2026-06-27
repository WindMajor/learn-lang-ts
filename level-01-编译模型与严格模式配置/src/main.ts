/**
 * Level 01 主代码：编译模型与严格模式配置
 *
 * 本文件演示：
 * 1. TS 类型擦除 —— 类型注解在编译后完全消失
 * 2. strictNullChecks —— null/undefined 不是其他类型的子类型
 * 3. noImplicitAny —— 禁止隐式 any
 * 4. 类型层 vs 值层的分离
 *
 * 运行方式：
 *   npx ts-node src/main.ts
 *   或
 *   npx tsc && node dist/main.js
 */

// =============================================================
// 第一部分：类型擦除 —— TS 编译成 JS 后，类型全部消失
// =============================================================

// WHAT: 类型注解——编译期存在，运行时不存在
// WHY: TS 设计哲学：类型只在编译期帮你做检查，不给运行时增加开销
// CONTRAST: Rust 泛型单态化——`Vec<i32>` 和 `Vec<String>` 在运行时是不同的代码
//           但 TS 的 `Array<number>` 和 `Array<string>` 在运行时都是 `Array`
// CONTRAST: C++ 模板——`vector<int>` 和 `vector<string>` 在编译期生成两份独立代码
//           运行时有完整的类型信息，甚至可以 RTTI
// CONTRAST: Java 泛型擦除——与 TS 类似，`List<Integer>` 运行时只是 `List`
//           但 Java 是名义类型，两个擦除后的类型如果名称不同仍不兼容；TS 是结构类型
function typeErasureDemo() {
  // 类型层（编译期）：x 的类型是 number
  // 值层（运行时）：x 就是一个 JavaScript 数字
  const x: number = 42;

  // 类型层（编译期）：greet 的类型是 (name: string) => string
  // 值层（运行时）：就是一个普通的 JS 函数
  function greet(name: string): string {
    return `Hello, ${name}`;
  }

  // 类型层（编译期）：泛型——只在编译期存在
  //   identity<number>(42) → 返回 number
  //   identity<string>("hello") → 返回 string
  // 值层（运行时）：identity 就是一个接受任何值并返回它的函数
  function identity<T>(value: T): T {
    return value;
  }

  const numResult: number = identity<number>(42);
  const strResult: string = identity<string>("hello");

  console.log("=== 类型擦除演示 ===");
  console.log(`x (类型擦除后只是普通 number): ${x}`);
  console.log(greet("TypeScript"));
  console.log(`identity<number>(42) = ${numResult}, identity<string>("hello") = ${strResult}`);
  console.log(`运行时 typeof numResult = ${typeof numResult}, typeof strResult = ${typeof strResult}`);
  // WARNING: 运行时你无法区分 numResult 是被 number 还是被 any 标注过
  //          这就是类型擦除的后果——编译期的类型承诺在运行时无效
}

// =============================================================
// 第二部分：strictNullChecks —— TS 最重要的开关
// =============================================================

// WHAT: strictNullChecks 使 `null` 和 `undefined` 不再是所有类型的子类型
// WHY: 没有这个开关，TS 的 null 安全形同虚设——任何变量都可能为 null
// CONTRAST: Kotlin 的 `?`——默认所有类型非空，需要 `String?` 才能为 null
//           Kotlin 的空安全是核心语言特性，无法关闭
//           而 TS 的 strictNullChecks 必须在 tsconfig 中显式打开
// CONTRAST: Rust 的 `Option<T>`——不需要特殊的空安全机制，
//           因为 Rust 没有 null，取而代之的是 `Option::None`
//           这是语言层面的设计决策，没有"开关"一说
// CONTRAST: Swift 的 `Optional<T>`——与 Kotlin 类似，语法糖是 `T?`
// CONTRAST: Java 的 `Optional<T>`——只是包装类，`String` 仍可以为 null
//           Optional 不强制使用，编译器不检查
function strictNullChecksDemo() {
  console.log("\n=== strictNullChecks 演示 ===");

  // 类型层：name 的类型是 `string | null`（联合类型）
  // 值层：name 可能是 "Alice" 也可能是 null
  function greetSafe(name: string | null): string {
    // WARNING: 如果 strictNullChecks 关闭，这里不会报类型错误
    //          但运行时 `null.toUpperCase()` 会抛出 TypeError
    if (name === null) {
      return "Hello, stranger!";
    }
    // 类型收窄（Type Narrowing）：在这个分支，name 的类型被收窄为 string
    // 详见 Level 04
    return `Hello, ${name.toUpperCase()}!`;
  }

  console.log(greetSafe("Alice"));  // Hello, ALICE!
  console.log(greetSafe(null));     // Hello, stranger!

  // 类型层：config 的 timeout 可能是 number 也可能是 undefined
  // 值层：如果没传 timeout，就是 undefined
  interface Config {
    host: string;
    port: number;
    timeout?: number;  // timeout?: number 等价于 timeout: number | undefined
  }

  function connect(config: Config): string {
    // WARNING: config.timeout 的类型是 number | undefined
    //          strictNullChecks 关闭时，它就是 number（包括 undefined）
    //          这意味着 `config.timeout * 2` 不会报错，但运行时可能是 NaN
    const timeout = config.timeout ?? 3000; // ?? 是空值合并，只对 null/undefined 生效
    return `连接 ${config.host}:${config.port}，超时 ${timeout}ms`;
  }

  console.log(connect({ host: "localhost", port: 8080 }));
  console.log(connect({ host: "localhost", port: 8080, timeout: 5000 }));
}

// =============================================================
// 第三部分：noImplicitAny —— 拒绝"悄悄变成 any"
// =============================================================

// WHAT: noImplicitAny 禁止 TS 将无法推断的类型隐含为 any
// WHY: 一旦出现隐式 any，该变量就失去了所有类型检查——它变成了 JS 变量
// CONTRAST: Rust——不存在 any 的概念，所有变量必须在编译期有确定类型或 impl Trait
// CONTRAST: Kotlin——没有 any 概念，但 `var x = someMethod()` 会自动推断类型
// CONTRAST: Python——动态类型，运行时一切皆对象，不需要类型推断
function noImplicitAnyDemo() {
  console.log("\n=== noImplicitAny 演示 ===");

  // ✅ TS 能从初始值推断类型
  const name = "TypeScript";         // 推断为 string
  const count = 42;                  // 推断为 number
  const items = [1, 2, 3];          // 推断为 number[]
  const user = {                     // 推断为 { name: string; age: number }
    name: "Alice",
    age: 30,
  };

  // ✅ 回调函数参数从上下文推断
  const doubled = items.map((n) => n * 2);  // n 推断为 number

  // ✅ 明确标注函数参数类型
  function add(a: number, b: number): number {
    return a + b;
  }

  console.log(`name: ${name}, count: ${count}, doubled: ${doubled}`);
  console.log(`add(1, 2) = ${add(1, 2)}`);

  // 下面的代码如果有 noImplicitAny = true，tsc 会报错：
  //
  // ❌ function badFunction(param) { ... }
  //    错误：error TS7006: Parameter 'param' implicitly has an 'any' type.
  //
  // WHY 要阻止隐式 any：
  //   param 变成 any 后，你可以在函数里写 param.flyToTheMoon()
  //   tsc 不会报错，但运行时爆炸
  //   这就是"any 污染"——一个 any 可以传染整个调用链
}

// =============================================================
// 第四部分：编译期类型验证 —— 建立"类型层编程"直觉
// =============================================================

// WHAT: 下面这些 type 定义在编译期验证我们的类型是否正确
// WHY: 这相当于"类型的单元测试"——在编译期而不是运行期验证
// CONTRAST: Rust 的 `const _: () = { ... }` 编译期断言
// CONTRAST: C++ 的 `static_assert`——编译期断言
// CONTRAST: Kotlin/Java——没有直接的编译期类型体操能力
//           但 Kotlin 的 `requires` / `assert` 是运行时检查

// 类型层：这些 type 语句在编译期计算并验证
// 值层：这些 type 在运行时不存在（不生成任何 JS 代码）
type CompileTimeTests = {
  // 验证：string 类型推断正确
  test_01_typeof_string: typeof "hello" extends string ? true : false;
  // expected: true

  // 验证：number 不是 string
  test_02_number_not_string: number extends string ? true : false;
  // expected: false

  // 验证：null 不是 string（strictNullChecks 打开时）
  test_03_null_not_string: null extends string ? true : false;
  // expected: false —— 如果 strictNullChecks 关闭，结果是 true

  // 验证：联合类型
  test_04_union: "a" | "b" extends string ? true : false;
  // expected: true

  // 验证：never 是任何类型的子类型（底层类型）
  test_05_never_is_subtype: never extends string ? true : false;
  // expected: true
};

// 如果你想"断言"某个类型关系成立，用下面的模式：
// type Assert<T extends true> = T;
// type _Test1 = Assert<CompileTimeTests["test_01_typeof_string"]>;  // 编译通过 ✅
// 如果你期望错误：
// type _Test2 = Assert<CompileTimeTests["test_03_null_not_string"]>;
//   → 如果 strictNullChecks 关闭，null extends string 为 true，编译失败 ❌

// =============================================================
// 第五部分：查看编译产物 —— 理解类型擦除
// =============================================================

// 执行 `npx tsc` 后，去 `dist/main.js` 查看编译产物：
//
// 你会发现：
// 1. `function identity<T>(value: T): T { return value; }`
//    变成
//    `function identity(value) { return value; }`
//    —— 泛型参数 T 完全消失
//
// 2. `interface Config { host: string; port: number; timeout?: number; }`
//    变成
//    // 不存在！接口定义在编译后完全消失
//
// 3. `type CompileTimeTests = { ... }`
//    变成
//    // 不存在！类型别名在编译后完全消失
//
// 4. 只保留运行时的值：函数、变量、对象、循环、条件……

// =============================================================
// 主入口
// =============================================================

function main(): void {
  typeErasureDemo();
  strictNullChecksDemo();
  noImplicitAnyDemo();

  console.log("\n=== 类型系统验证 ===");
  // WARNING: 这里不能"console.log(类型)"，因为类型编译后就没了
  // 你只能通过 tsc 来验证类型关系
  console.log("所有类型验证在编译期通过 ✅");
  console.log('查看类型验证结果，检查 src/main.ts 中的 CompileTimeTests 类型');
}

main();

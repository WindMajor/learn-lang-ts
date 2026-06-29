/**
 * Level 10 主代码：类型体操实战与编译期验证
 *
 * 演示：
 * 1. 编译期类型测试工具：Expect / Equal
 * 2. 类型层面的加法（通过元组长度）
 * 3. 状态机类型——编译期验证状态转换
 * 4. 管道（Pipe）类型
 * 5. 安全字符串格式化类型（类似 printf 类型检查）
 *
 * 运行：npx ts-node src/main.ts
 */

// =============================================================
// 第一部分：编译期类型测试工具
// =============================================================

// 类型层：两个核心测试工具
// 值层：它们不产生任何 JS 代码

// WHAT: Expect<T extends true> — 如果 T 不是 true，编译报错
type Expect<T extends true> = T;

// WHAT: Equal<X, Y> — 严格判断两个类型是否相同
// WHY: 不能直接用 extends（有歧义），Equal 是"全等"判断
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

// 运行测试套件（编译通过 = 测试通过）
// export 使 TS 认为该类型可能被外部使用，不报告"未使用"
export type TypeTests = [
  // 基础类型测试
  Expect<Equal<string, string>>,
  Expect<Equal<number, number>>,

  // 条件类型测试
  Expect<Equal<
    string extends string ? "yes" : "no",
    "yes"
  >>,

  // never 是底层类型
  Expect<Equal<
    never extends string ? true : false,
    true
  >>,

  // 联合类型的分配性（注意：仅对裸类型参数触发分配性）
  Expect<Equal<
    string extends string ? "yes" : "no",
    "yes"
  >>,
  // 如果没有分配性：(string | number) extends string → "no"
  //   有分配性时需要用泛型参数触发：type Dist<T> = T extends string ? "yes" : "no"
  //   type Test = Dist<string | number>; // "yes" | "no"
];

console.log("=== 编译期类型测试工具 ===");
console.log("Expect<Equal<X, Y>> 在编译期验证类型关系");
console.log("编译通过 = 所有测试通过 ✅");
console.log("如果测试失败，tsc 会报错——那就是你的'类型单元测试'");

// CONTRAST: Rust 的 `const _: () = { ... }` 编译期断言
//   const _: () = { assert!(size_of::<T>() == size_of::<U>()) };
// CONTRAST: C++ 的 `static_assert`
//   static_assert(std::is_same_v<T, U>, "Types must be same");

// =============================================================
// 第二部分：类型层面的"计算"——用元组长度模拟数字
// =============================================================

// WHAT: 在 TS 类型层面，没有原生的数字运算
//       但我们可以用元组的 length 属性来"表示"数字
//       这是 "Peano 算术"思想——用递归结构表示自然数

// 将数字 N 转换为 N 元组类型
type BuildTuple<N extends number, T extends unknown[] = []> =
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;

// 类型层面的加法：A + B
type Add<A extends number, B extends number> = [
  ...BuildTuple<A>,
  ...BuildTuple<B>,
]["length"];

// 验证加法
export type AddTests = [
  Expect<Equal<Add<1, 1>, 2>>,
  Expect<Equal<Add<2, 3>, 5>>,
  Expect<Equal<Add<0, 5>, 5>>,
  Expect<Equal<Add<10, 20>, 30>>,
];

console.log("\n=== 类型层面的加法 ===");
console.log("Add<2, 3> = 5 ✅ (通过元组拼接 + length 提取)");
console.log("这是 TS 类型级编程的基础——用类型系统做算术");

// =============================================================
// 第三部分：状态机类型——编译期验证状态转换
// =============================================================

function stateMachineDemo() {
  console.log("\n=== 状态机类型（编译期验证）===");

  // WHAT: 用类型系统建模状态机的合法状态转换
  // WHY: 编译期确保你不会非法转换状态
  //   比如：'idle' 只能转到 'loading'
  //        'loading' 只能转到 'success' 或 'error'
  //        'error' 可以重试回到 'idle'
  //   编译器阻止非法转换——比运行时检查更强大

  // 类型层：定义状态转换表
  type StateTransition = {
    idle: "loading";
    loading: "success" | "error";
    success: "idle";
    error: "idle" | "loading";  // 可以从错误重试或直接回到空闲
  };

  // 值层：状态机类
  class StateMachine<
    CurrentState extends keyof StateTransition = "idle",
  > {
    constructor(private state: CurrentState) {}

    // 类型层：transition 方法的约束——只能转到合法状态
    // 值层：实际的状态变更
    transition<NewState extends StateTransition[CurrentState]>(
      newState: NewState,
    ): StateMachine<NewState> {
      console.log(`状态转换: ${String(this.state)} → ${String(newState)}`);
      this.state = newState as unknown as CurrentState;
      return this as unknown as StateMachine<NewState>;
    }

    getState(): CurrentState {
      return this.state as CurrentState;
    }
  }

  // 使用状态机
  const machine = new StateMachine("idle");

  // ✅ 合法转换
  const loading = machine.transition("loading");
  console.log(`当前状态: ${loading.getState()}`);

  const success = loading.transition("success");
  console.log(`当前状态: ${success.getState()}`);

  const backToIdle = success.transition("idle");
  console.log(`当前状态: ${backToIdle.getState()}`);

  // ❌ 非法转换——tsc 报错！
  // machine.transition("success"); // 'success' 不是从 'idle' 的合法转换
  //   error TS2345: Argument of type '"success"' is not assignable
  //     to parameter of type 'StateTransition["idle"]'

  // 从 error 状态可以重试
  const errorMachine = new StateMachine("error" as const);
  const retry = errorMachine.transition("loading"); // ✅ 从 error 到 loading 合法
  console.log(`错误重试: ${retry.getState()}`);

  // CONTRAST: Rust 的状态机——用 enum + transition 方法
  //   也是编译期保证的，但通过所有权系统实现
  //   enum State { Idle, Loading, Success(Data), Error(Error) }
  //   fn transition(self, new_state: State) -> StateMachine<State>
  //   通过消费 self 确保旧状态不可再用

  // CONTRAST: Kotlin 的 sealed class——类似 TS discriminated union
  //   但 TS 的泛型约束 transition<NewState extends Transition[Current]>
  //   是类型层面的精确约束，Kotlin 没有直接对应
}

// =============================================================
// 第四部分：管道（Pipe）类型
// =============================================================

// WHAT: 管道类型——组合多个一元函数为一个函数
//       管道的输入 = 第一个函数的输入
//       管道的输出 = 最后一个函数的输出
type Pipe<T extends unknown[]> = T extends [
  (input: infer A) => infer B,
  ...infer Rest,
]
  ? Rest extends [(input: B) => infer C, ...infer Rest2]
    ? Pipe<[(input: A) => C, ...Rest2]>
    : (input: A) => B
  : never;

function pipeFunctionsDemo() {
  console.log("\n=== 管道类型 ===");

  // 值层：实现 pipe 函数
  function pipe<A, B>(fn1: (a: A) => B): (a: A) => B;
  function pipe<A, B, C>(fn1: (a: A) => B, fn2: (b: B) => C): (a: A) => C;
  function pipe<A, B, C, D>(
    fn1: (a: A) => B,
    fn2: (b: B) => C,
    fn3: (c: C) => D,
  ): (a: A) => D;
  function pipe(...fns: Array<(x: unknown) => unknown>): (x: unknown) => unknown {
    return (x: unknown) => fns.reduce((v, fn) => fn(v), x);
  }

  // 使用管道
  const toUpperCase = (s: string) => s.toUpperCase();
  const addExclamation = (s: string) => `${s}!`;
  const repeat = (s: string) => `${s} ${s}`;

  const shout = pipe(toUpperCase, addExclamation, repeat);
  // shout 的类型：(a: string) => string
  // TS 自动推断中间类型

  console.log(shout("hello")); // "HELLO! HELLO!"

  // ❌ 类型不匹配会报错：
  // const bad = pipe(toUpperCase, Math.sqrt); // string → number 不兼容
  //   error TS2345: Argument of type '(x: number) => number'
  //     is not assignable to parameter of type '(b: string) => ???'
}

// =============================================================
// 第五部分：类型安全字符串格式化（类似 printf）
// =============================================================

type ParseFormat<S extends string> =
  S extends `${string}%s${infer Rest}`
    ? [string, ...ParseFormat<Rest>]
    : S extends `${string}%d${infer Rest}`
      ? [number, ...ParseFormat<Rest>]
      : [];

// 值层：实现格式化函数
function format<S extends string>(
  template: S,
  ...args: ParseFormat<S> extends [] ? [] : ParseFormat<S>
): string {
  let result: string = template;
  let i = 0;
  for (const arg of args) {
    result = result.replace(/%[sd]/, String(arg));
    i++;
  }
  return result;
}

function typeSafeFormat() {
  console.log("\n=== 类型安全格式化 ===");

  // ✅ 类型正确
  console.log(format("Hello, %s!", "Alice"));
  // 类型层：template 是 "Hello, %s!" → ParseFormat<...> = [string]
  //         args = ["Alice"] 是 [string] ✅

  // ❌ 类型不匹配
  // format("Hello, %s!", 42);  // tsc 报错！
  //   error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.

  // ✅ 多个占位符
  console.log(format("User %s has %d points", "Bob", 42));
  // 类型层：ParseFormat<"User %s has %d points"> = [string, number]

  // CONTRAST: C 的 printf——运行时根据格式字符串解析，无效格式产生 UB
  //           TS 的类型安全格式化在编译期验证——更安全
  // CONTRAST: Rust 的 `format!` 宏——编译期展开，不需要 format string
  //           `format!("User {name} has {points} points")`
  //           同样安全，且更灵活（命名参数）
}

// =============================================================
// 第六部分：编译期类型验证套件
// =============================================================

// 这是一个"类型测试套件"——全部编译通过 = 所有测试通过
export type FullTestSuite = [
  // 1. 加法测试
  Expect<Equal<Add<0, 0>, 0>>,
  Expect<Equal<Add<7, 8>, 15>>,

  // 2. Equal 自反性
  Expect<Equal<string, string>>,

  // 3. 条件类型
  Expect<Equal<
    { name: string } extends Record<string, unknown> ? true : false,
    true
  >>,

  // 4. 映射类型
  Expect<Equal<
    { [K in "a" | "b"]: number },
    { a: number; b: number }
  >>,

  // 5. never 运算
  Expect<Equal<never | string, string>>,
  Expect<Equal<never & string, never>>,

  // 6. 分配性条件类型
  Expect<Equal<
    (string | number) extends never ? "A" : "B",
    "B"  // 整体不分配
  >>,

  // 7. Pipe 类型验证（管道函数组合的类型推断）
  Expect<Equal<
    Pipe<[(x: string) => number, (x: number) => boolean]>,
    (input: string) => boolean
  >>,
];

// =============================================================
// 主入口
// =============================================================

function main(): void {
  console.log("=== Level 10 类型体操实战 ===");
  console.log("所有基础类型测试在编译期通过 ✅");
  stateMachineDemo();
  pipeFunctionsDemo();
  typeSafeFormat();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：TS 类型系统图灵完备——可以做类型级的编程。");
  console.log("Expect<Equal<>> 是类型的'单元测试'——在编译期运行。");
  console.log("状态机类型可以在编译期验证状态转换的合法性。");
  console.log("类型层面的计算有 50 层递归限制，需要留意。");
}

main();

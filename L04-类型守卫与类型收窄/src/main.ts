/**
 * Level 04 主代码：类型守卫与类型收窄
 *
 * 本文件演示：
 * 1. typeof 守卫——收窄原始类型
 * 2. instanceof 守卫——收窄类实例
 * 3. in 守卫——收窄对象属性
 * 4. 自定义 is 谓词——自定义类型守卫
 * 5. 穷尽检查——用 never 确保覆盖所有 branch
 * 6. 控制流分析（CFA）的限制——赋值/闭包/回调中的收窄失效
 *
 * 运行方式：
 *   npx ts-node src/main.ts
 */

// =============================================================
// 第一部分：typeof 守卫
// =============================================================

function typeofGuardDemo() {
  console.log("=== typeof 守卫 ===");

  // WHAT: typeof 将变量收窄为 JS 原始类型
  // WHY: TS 识别 typeof 检查是一种类型收窄——基于控制流
  // CONTRAST: typeof 返回的字符串是 JS 运行时值，不能表达到 TS 类型的全部：
  //   typeof null === "object"  ⚠️ JS 历史 bug！
  //   所以 `typeof x === "object"` 收窄后类型是 `object | null`
  //   你还需要额外的 null 检查

  function process(input: unknown): string {
    // TS 基于 typeof 的收窄（与 JS 运行时 typeof 的结果一致）
    if (typeof input === "string") {
      // 收窄为 string
      return `字符串：${input.toUpperCase()}`;
    }

    if (typeof input === "number") {
      // 收窄为 number
      return `数字：${input.toFixed(2)}`;
    }

    if (typeof input === "boolean") {
      // 收窄为 boolean
      return `布尔值：${input}`;
    }

    if (typeof input === "undefined") {
      return `未定义`;
    }

    if (typeof input === "function") {
      // 收窄为 Function（但不是具体签名）
      return `函数：${input.name || "匿名"}`;
    }

    if (typeof input === "object") {
      // WARNING: typeof null === "object" ！
      //   这里 input 的类型是 object | null
      if (input === null) {
        return `null`;
      }
      // 现在 input 的类型是 object（非 null）
      if (Array.isArray(input)) {
        return `数组：[${input.join(", ")}]`;
      }
      return `对象：${JSON.stringify(input)}`;
    }

    // typeof "symbol" / "bigint" 这里略
    return `其他类型`;
  }

  console.log(process("hello"));
  console.log(process(3.14159));
  console.log(process(true));
  console.log(process(undefined));
  console.log(process(() => "x"));
  console.log(process(null));
  console.log(process([1, 2, 3]));
  console.log(process({ key: "value" }));

  // CONTRAST: Rust 的 match + 模式匹配
  //   没有 typeof 概念——Rust 的泛型是单态化的，运行时有具体类型
  //   你需要用 enum 来模拟"未知类型"的场景
  //   enum AnyValue {
  //       String(String),
  //       Number(f64),
  //       Boolean(bool),
  //       ...
  //   }
  //   然后用 match 穷尽所有变体
}

// =============================================================
// 第二部分：instanceof 守卫
// =============================================================

function instanceofGuardDemo() {
  console.log("\n=== instanceof 守卫 ===");

  // WHAT: instanceof 检查对象是否是指定类的实例（含继承链）
  // WHY: JS 的 prototype 链保证了 instanceof 的可靠性
  // CONTRAST: instanceof 运行时有效，但 TS 用它做编译期收窄
  // CONTRAST: instanceof 不等于 Kotlin 的 is——is 检查类型签名（带泛型），
  //           instanceof 检查 JS 原型链

  class ApiError extends Error {
    constructor(
      message: string,
      public statusCode: number,
    ) {
      super(message);
      this.name = "ApiError";
    }
  }

  class NetworkError extends Error {
    constructor(
      message: string,
      public retryable: boolean,
    ) {
      super(message);
      this.name = "NetworkError";
    }
  }

  class ValidationError extends Error {
    constructor(
      message: string,
      public fields: string[],
    ) {
      super(message);
      this.name = "ValidationError";
    }
  }

  function handleError(error: unknown): string {
    if (error instanceof ValidationError) {
      // 收窄为 ValidationError
      return `验证错误（字段：${error.fields.join(", ")}）：${error.message}`;
    }

    if (error instanceof ApiError) {
      // 收窄为 ApiError
      //   注意：所有三个具体错误类（ValidationError/ApiError/NetworkError）都直接 extends Error，
      //   因此必须在 instanceof Error 之前检查，否则会被 Error 分支拦截
      return `API 错误（${error.statusCode}）：${error.message}`;
    }

    if (error instanceof NetworkError) {
      // 收窄为 NetworkError
      return `网络错误（${error.retryable ? "可" : "不可"}重试）：${error.message}`;
    }

    if (error instanceof Error) {
      // 收窄为 Error
      return `通用错误：${error.message}`;
    }

    // 不是 Error 实例——可能是 throw "string" 或其他奇怪的值
    return `未知错误：${String(error)}`;
  }

  console.log(handleError(new ValidationError("邮箱格式错误", ["email", "phone"])));
  console.log(handleError(new ApiError("未授权", 401)));
  console.log(handleError(new NetworkError("连接超时", true)));
  console.log(handleError(new Error("something broke")));
  console.log(handleError("plain string error"));
}

// =============================================================
// 第三部分：in 守卫与 discriminated union 收窄
// =============================================================

function inGuardDemo() {
  console.log("\n=== in 守卫与 discriminated union ===");

  // WHAT: `in` 检查属性是否存在——TS 用它来收窄联合类型
  // WHY: 对于 discriminated union，检查 discriminant 字段是最自然的方式
  // CONTRAST: Rust 的 enum 自带 discriminant（变体名），不需要 checked 属性
  // CONTRAST: Kotlin 的 sealed class + when(is X) 也有自动收窄

  type Shape =
    | { kind: "circle"; radius: number }
    | { kind: "rectangle"; width: number; height: number }
    | { kind: "triangle"; base: number; height: number };

  function area(shape: Shape): number {
    switch (shape.kind) {
      case "circle":
        return Math.PI * shape.radius ** 2;
      case "rectangle":
        return shape.width * shape.height;
      case "triangle":
        return 0.5 * shape.base * shape.height;
    }
  }

  function perimeter(shape: Shape): number {
    switch (shape.kind) {
      case "circle":
        return 2 * Math.PI * shape.radius;
      case "rectangle":
        return 2 * (shape.width + shape.height);
      case "triangle":
        // 三角形周长需要三边长度——但我们只有 base 和 height！
        // 这就是 discriminated union 设计的问题：字段不完全
        // 如果 triangle 变体缺少 sideA/sideB，perimeter 就实现不了
        return shape.base + shape.height * 2; // 近似……
    }
  }

  const circle: Shape = { kind: "circle", radius: 5 };
  const rect: Shape = { kind: "rectangle", width: 4, height: 6 };

  console.log(`圆形面积: ${area(circle)}, 周长: ${perimeter(circle)}`);
  console.log(`矩形面积: ${area(rect)}, 周长: ${perimeter(rect)}`);

  // ===== in 守卫收窄 =====
  // 对于没有 discriminant 的联合类型，用 in 收窄
  type Animal =
    | { swim: () => void; fins: number }    // 鱼
    | { fly: () => void; wingspan: number } // 鸟
    | { run: () => void; legs: number };     // 哺乳动物

  function describeAnimal(animal: Animal): string {
    if ("swim" in animal) {
      return `鱼：${animal.fins} 个鳍`;
    }
    if ("fly" in animal) {
      return `鸟：翼展 ${animal.wingspan}m`;
    }
    // in 守卫后，自动收窄为第三种
    return `哺乳动物：${animal.legs} 条腿`;
  }

  const fish: Animal = {
    swim: () => console.log("游泳"),
    fins: 4,
  };

  const bird: Animal = {
    fly: () => console.log("飞翔"),
    wingspan: 2.5,
  };

  console.log(describeAnimal(fish));
  console.log(describeAnimal(bird));
}

// =============================================================
// 第四部分：自定义 is 谓词（Type Predicate）
// =============================================================

function customTypePredicateDemo() {
  console.log("\n=== 自定义 is 谓词 ===");

  // WHAT: `value is Type` 定义自定义类型守卫函数
  // WHY: typeof/instanceof 覆盖不到的场景——比如验证接口结构
  // CONTRAST: Rust 没有"运行时判断对象是不是某个 trait 的实现"（已有类型擦除）
  // CONTRAST: Kotlin 的 `is` 可以在 when/when clause 中使用，但它是编译器内置的
  //           不能自定义——因为 Kotlin 的类型信息在运行时不擦除完全
  // CONTRAST: Kotlin 的 reified 内联函数可以检查泛型参数类型

  interface User {
    id: number;
    name: string;
    email: string;
  }

  interface Product {
    id: number;
    title: string;
    price: number;
  }

  // 类型层：返回值 `obj is User` 表示"如果返回 true，则 obj 是 User"
  // 值层：函数体做运行时检查——TS 不保证检查逻辑的正确性！
  function isUser(obj: unknown): obj is User {
    return (
      typeof obj === "object" &&
      obj !== null &&
      typeof (obj as Record<string, unknown>).id === "number" &&
      typeof (obj as Record<string, unknown>).name === "string" &&
      typeof (obj as Record<string, unknown>).email === "string"
    );
  }

  function isProduct(obj: unknown): obj is Product {
    return (
      typeof obj === "object" &&
      obj !== null &&
      typeof (obj as Record<string, unknown>).id === "number" &&
      typeof (obj as Record<string, unknown>).title === "string" &&
      typeof (obj as Record<string, unknown>).price === "number"
    );
  }

  // 模拟 API 响应——类型为 unknown
  const apiResponses: unknown[] = [
    { id: 1, name: "Alice", email: "alice@example.com" },
    { id: 101, title: "TypeScript Book", price: 39.99 },
    { id: 2, name: "Bob" },                         // 缺少 email，不是合法 User
    "plain string error",                           // 不是对象
    null,                                           // null
  ];

  function processApiResponse(item: unknown): string {
    if (isUser(item)) {
      // item 收窄为 User
      return `用户：${item.name} (${item.email})`;
    }

    if (isProduct(item)) {
      // item 收窄为 Product
      return `产品：${item.title} - ¥${item.price}`;
    }

    return `无效数据：${JSON.stringify(item)}`;
  }

  for (const item of apiResponses) {
    console.log(processApiResponse(item));
  }

  // WARNING: is 谓词的双重责任
  //   编译期：告诉 TS "如果返回 true，参数就是这个类型"
  //   运行时：函数体负责验证（如果验证逻辑错了，类型系统帮不了你）
  //   这相当于 "unsafe 代码自己保证安全"
}

// =============================================================
// 第五部分：穷尽检查（Exhaustiveness Check）
// =============================================================

function exhaustivenessCheckDemo() {
  console.log("\n=== 穷尽检查（Exhaustiveness Check）===");

  // WHAT: 在 switch/default 分支用 never 确保覆盖了所有可能
  // WHY: 如果有人后来添加了新变体，tsc 会自动报错——编译器帮你维护代码
  // CONTRAST: Rust 的 match 在编译时自动检查穷尽性——不需要手动写 never
  //           编译器会告诉你"缺少 X 变体"——这是语言级别的功能
  // CONTRAST: Kotlin 的 sealed class 的 when 自动做穷尽检查
  // CONTRAST: Swift 的 switch on enum 自动穷尽检查

  type Result<T, E> =
    | { tag: "ok"; value: T }
    | { tag: "err"; error: E };

  function unwrapResult<T, E>(result: Result<T, E>): T {
    switch (result.tag) {
      case "ok":
        return result.value;
      case "err":
        throw new Error(`Unexpected error: ${result.error}`);
      default: {
        // 穷尽检查：如果 Result 新增了变体，这里会报错
        // 因为 result 的类型在 tag 收窄后应该是 never
        const _exhaustive: never = result;
        //                         ^^^^^^
        // 如果上面的 case 没有覆盖所有 tag 值，这里会报错：
        //   error TS2322: Type '...' is not assignable to type 'never'.
        throw new Error(`Unhandled result variant: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }

  const ok = unwrapResult({ tag: "ok", value: 42 });
  console.log(`解包成功：${ok}`);
  try {
    unwrapResult({ tag: "err", error: "something broke" });
  } catch (e) {
    console.log(`捕获错误：${(e as Error).message}`);
  }

  // CONTRAST: Rust 中的等价写法：
  //   fn unwrap<T, E>(result: Result<T, E>) -> T {
  //       match result {
  //           Ok(value) => value,
  //           Err(error) => panic!("{:?}", error),
  //       }
  //   }
  //   不需要 default/_exhaustive——编译器自动穷尽。
  //   如果 Result 增加了新变体，所有 match 都会报错（不用你手动维护）。
  //   这就是 Rust match 相比 TS switch + never 的巨大优势。
}

// =============================================================
// 第六部分：控制流分析（CFA）的局限
// =============================================================

function cfaLimitations() {
  console.log("\n=== 控制流分析的局限 ===");

  // === 局限 1：闭包中的类型收窄失效 ===
  // WHAT: 在闭包/回调中使用外部变量，类型可能已过时
  // WHY: TS 不知道闭包在什么时候执行——可能是在类型发生变化之后
  //   这是 tsconfig 中的 noUncheckedIndexedAccess 也挡不住的问题

  function closureTrap(values: (number | null)[]): number[] {
    const result: number[] = [];

    // 假设我们先过滤掉 null
    const filtered = values.filter((v) => v !== null);
    // filtered 的类型：number[]（严格模式下 filter 做了收窄）
    result.push(...filtered);

    // 但考虑这种情况：
    let value: string | null = "hello";
    if (value !== null) {
      // 安全：先将值捕获到 const 中，防止后续修改
      const captured = value;
      console.log(`收窄后大写: ${captured.toUpperCase()}`);

      // 闭包陷阱：在 setTimeout 回调中访问 value
      setTimeout(() => {
        // captured 是 const，不会被修改，类型安全
        console.log(`闭包中的 value: ${captured.toUpperCase()}`);
      }, 100);
    }

    // 在闭包注册后，value 可能被改为 null
    value = null;
    // 现在 setTimeout 回调会在 100ms 后执行——那时 value 是 null！
    // 但 TS 在闭包中没有这个意识——它只看代码位置的静态类型

    return result;
  }

  closureTrap([1, null, 3, null, 5]);
  console.log("闭包陷阱：请注意 setTimeout 回调中 value 可能已变成 null");

  // === 局限 2：赋值后类型收窄消失 ===
  function assignmentTrap() {
    let x: string | number = "hello";

    if (typeof x === "string") {
      // x 收窄为 string
      console.log(`x 是 string：${x}`);
    }

    x = 42; // 重新赋值

    // 现在 x 的类型是 string | number（回到声明时的类型）
    // 不再有收窄效果
    console.log(`赋值后 x: ${x}`);
  }

  assignmentTrap();

  // === 局限 3：属性访问收窄在回调中失效 ===
  // WHAT: 如果属性可能被回调修改，TS 的收窄不会跟踪
  interface Mutable {
    value: string | null;
  }

  function callbackTrap(obj: Mutable): void {
    if (obj.value !== null) {
      // obj.value 收窄为 string
      // 我们在这个块的逻辑依赖于 obj.value 是 string

      // 但如果回调中修改了 obj.value……
      setTimeout(() => {
        // TS 认为 obj.value 是 string（基于外部的 if 判断）
        // 但如果在 setTimeout 之前 obj.value 被设为了 null……
        // console.log(obj.value.toUpperCase()); // 可能 runtime error！
      }, 100);
    }
  }

  callbackTrap({ value: "hello" });
  console.log("属性访问收窄：回调中的 obj.value 存在同样风险");
}

// =============================================================
// 第七部分：编译期类型验证
// =============================================================

// 类型层：验证类型收窄的关系
// 注意：isUser 定义在 customTypePredicateDemo 函数内部，无法在此引用
//       这里仅验证可访问的全局类型关系

// 编译期断言工具类型
type Assert<T extends true> = T;

// typeof 收窄：typeof 变量返回字面量字符串类型
const _testValue = "";
type T01_TypeofGuard = Assert<typeof _testValue extends string ? true : false>;
// expected: true ✅

// instanceof 与实际类型的关系
type T02_ErrorExtendsObject = Assert<Error extends object ? true : false>;
// expected: true ✅

// never 与所有类型的子类型关系
type T03_NeverExtendsObject = Assert<never extends object ? true : false>;
// expected: true ✅

// 函数返回值类型（协变）
type T04_FunctionReturn = Assert<(() => string | null) extends (() => string | number | null) ? true : false>;
// expected: true ✅

// 编译期断言汇总：引用所有断言类型，避免 noUnusedLocals 警告
// export 使 TS 认为该类型可能被外部使用
export type _GuardAssertions = [
  T01_TypeofGuard,
  T02_ErrorExtendsObject,
  T03_NeverExtendsObject,
  T04_FunctionReturn,
];

// =============================================================
// 主入口
// =============================================================

function main(): void {
  typeofGuardDemo();
  instanceofGuardDemo();
  inGuardDemo();
  customTypePredicateDemo();
  exhaustivenessCheckDemo();
  cfaLimitations();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：TS 有 5 种类型守卫机制，但控制流分析有明确的局限。");
  console.log('is 谓词是定义\u201C编译期信任\u201D的桥梁——需要你手动保证正确性。');
  console.log("never 穷尽检查是维护 discriminated union 的最佳实践。");
}

main();

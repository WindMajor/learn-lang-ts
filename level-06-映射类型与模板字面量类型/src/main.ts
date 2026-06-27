/**
 * Level 06 主代码：映射类型与模板字面量类型
 *
 * 本文件演示：
 * 1. 映射类型基础：{ [K in keyof T]: ... }
 * 2. 实现 Six Essential Utility Types（Partial/Required/Readonly/Pick/Omit/Record）
 * 3. keyof / typeof 操作符
 * 4. 映射修饰符：? / -? / readonly / +readonly
 * 5. 模板字面量类型（Template Literal Types）
 * 6. 递归映射类型（深度 Partial/Readonly）
 *
 * 运行方式：
 *   npx ts-node src/main.ts
 */

// =============================================================
// 第一部分：映射类型基础
// =============================================================

function mappedTypesBasics() {
  console.log("=== 映射类型基础 ===");

  // WHAT: 映射类型遍历对象类型的每个键，为每个键"计算"一个类型
  // WHY: 这是 TS 类型体操的核心工具——让你批量转换类型属性
  // CONTRAST: Rust 的 macro_rules! / proc macro——编译期代码生成
  //           Rust 的宏生成的是代码（struct 定义、impl 块）
  //           TS 的映射类型生成的是"类型"（不是代码）
  //           Rust 的宏在代码生成阶段，TS 的映射类型在类型检查阶段
  // CONTRAST: C++ 的模板偏特化——`template<typename T> struct Partial { ... }`
  //           与 TS 映射类型概念相似：都是"对类型的变换"
  //           但 C++ 模板生成代码，TS 映射类型不生成任何运行时代码
  // CONTRAST: Kotlin/Java——完全没有映射类型的概念

  interface User {
    id: number;
    name: string;
    email: string;
    active: boolean;
  }

  // 类型层：所有字段变成可选
  type PartialUser = {
    [K in keyof User]?: User[K];
    // ^^^^^^^^^^^^^   ^^^^^^^
    // 遍历 User 的每个键  取 User[K] 类型 + ?
  };
  // 展开：{ id?: number; name?: string; email?: string; active?: boolean }

  // 类型层：所有字段变成只读
  type ReadonlyUser = {
    readonly [K in keyof User]: User[K];
  };
  // 展开：{ readonly id: number; readonly name: string; ... }

  // 类型层：所有字段变成 string（不管原来是什么类型）
  type StringifyUser = {
    [K in keyof User]: string;
  };
  // 展开：{ id: string; name: string; email: string; active: string }

  // 值层：使用这些类型创建值
  const partialUser: PartialUser = { name: "Alice" }; // ✅ 只提供部分字段
  const readonlyUser: ReadonlyUser = {
    id: 1,
    name: "Bob",
    email: "bob@example.com",
    active: true,
  };
  // readonlyUser.name = "Robert";  // ❌ Cannot assign to 'name' because it is a read-only property

  console.log(`Partial User: ${JSON.stringify(partialUser)}`);
  console.log(`Readonly User name: ${readonlyUser.name}`);

  // ===== keyof 操作符 =====
  // 类型层：keyof T 获取 T 的所有键的联合类型
  type UserKeys = keyof User; // "id" | "name" | "email" | "active"
  const keys: UserKeys = "name"; // ✅ 只能是这四个之一
  console.log(`User 的键联合类型之一: ${keys}`);

  // ===== typeof 操作符（在类型位置） =====
  // WHAT: typeof 在类型位置时，获取值的类型（不是 JS 的运行时 typeof）
  // WHY: 让你从值推导类型——DRY
  const config = {
    host: "localhost",
    port: 8080,
    debug: true,
  };
  type ConfigType = typeof config;
  // { host: string; port: number; debug: boolean }
  console.log("typeof config 提取了值的类型结构 ✅");
}

// =============================================================
// 第二部分：实现 Six Essential Utility Types
// =============================================================

// 类型层：以下六个类型实现了 TS 最常用的内置工具类型
// 值层：它们不产生任何 JS 代码（纯类型运算）

// 1️⃣ Partial<T>：所有属性变为可选
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// 2️⃣ Required<T>：移除可选标记（所有属性必填）
type MyRequired<T> = {
  [K in keyof T]-?: T[K]; // -? 移除可选标记
};

// 3️⃣ Readonly<T>：所有属性只读
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

// 4️⃣ Pick<T, K>：从 T 中选取一组属性 K
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 5️⃣ Omit<T, K>：从 T 中排除一组属性 K
type MyOmit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

// 6️⃣ Record<K, V>：构造一个键为 K、值为 V 的对象类型
type MyRecord<K extends keyof never, V> = {
  [P in K]: V;
};

function utilityTypesDemo() {
  console.log("\n=== 六大内置工具类型的实现 ===");

  interface Product {
    id: number;
    name: string;
    price: number;
    description: string;
    category: string;
  }

  // Partial：更新时只需要提供部分字段
  function updateProduct(id: number, updates: MyPartial<Product>): void {
    console.log(`更新产品 ${id}，字段: ${JSON.stringify(updates)}`);
  }

  updateProduct(1, { price: 19.99 });          // ✅ 只更新价格
  updateProduct(2, { name: "New Name", price: 29.99 }); // ✅ 更新名称和价格

  // Pick：创建 DTO（Data Transfer Object）
  type ProductSummary = MyPick<Product, "id" | "name" | "price">;
  // { id: number; name: string; price: number }

  const summary: ProductSummary = {
    id: 1,
    name: "TypeScript Book",
    price: 39.99,
  };
  console.log(`Pick<Product> 摘要: ${summary.name} - ¥${summary.price}`);

  // Omit：排除敏感字段
  type PublicProduct = MyOmit<Product, "description" | "category">;
  // { id: number; name: string; price: number }

  const publicProduct: PublicProduct = {
    id: 1,
    name: "TypeScript Book",
    price: 39.99,
  };
  console.log(`Omit<Product> 公开字段: ${publicProduct.name}`);

  // Record：构建映射表
  type Status = "pending" | "active" | "completed" | "cancelled";
  type StatusLabelMap = MyRecord<Status, string>;

  const statusLabels: StatusLabelMap = {
    pending: "待处理",
    active: "进行中",
    completed: "已完成",
    cancelled: "已取消",
  };
  console.log(`Record<Status, string>: pending → ${statusLabels.pending}`);

  // Required：让所有字段必填
  interface OptionalConfig {
    host?: string;
    port?: number;
    retries?: number;
  }

  type RequiredConfig = MyRequired<OptionalConfig>;
  // 所有字段移除 ? —— { host: string; port: number; retries: number }

  // const config: RequiredConfig = {};  // ❌ 编译错误：缺少所有必填字段
  const fullConfig: RequiredConfig = {
    host: "localhost",
    port: 8080,
    retries: 3,
  };
  console.log(`Required<OptionalConfig>: ${JSON.stringify(fullConfig)}`);

  // CONTRAST: TS 的映射类型 vs Rust 的宏
  //   Rust 中实现类似 Partial 的行为需要 proc macro:
  //     #[derive(PartialMacro)]
  //     struct Product { ... }
  //   → 宏生成 `ProductPartial { id: Option<u32>, name: Option<String>, ... }`
  //   → 这需要在编译期生成新的 struct，产生新的代码
  //   TS 的 Partial 不生成新代码——纯粹的"类型层面"操作
}

// =============================================================
// 第三部分：映射修饰符与递归映射
// =============================================================

function mappedModifiers() {
  console.log("\n=== 映射修饰符与递归映射 ===");

  // WHAT: 映射修饰符控制属性的可选性（?）和可变性（readonly）
  //   +?  -?   添加/移除可选
  //   +readonly -readonly   添加/移除只读
  //   默认 + 可以省略

  // ===== as 重映射（Key Remapping，TS 4.1+） =====
  // WHAT: as 关键字在映射类型中重命名键
  type WithGetter<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
  };

  interface Person {
    name: string;
    age: number;
  }

  type PersonGetters = WithGetter<Person>;
  // { getName: () => string; getAge: () => number }
  console.log("as 重映射：将 Person 的键映射为 getter 方法名 ✅");

  // ===== 递归映射类型（Deep Partial） =====
  interface NestedConfig {
    server: {
      host: string;
      port: number;
      ssl: {
        enabled: boolean;
        cert: string;
      };
    };
    database: {
      url: string;
      pool: number;
    };
  }

  // 类型层：递归地将所有嵌套属性变为可选
  type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object
      ? T[K] extends Function
        ? T[K]  // 函数不转换
        : DeepPartial<T[K]>
      : T[K];
  };

  // 值层：使用 DeepPartial
  const partialConfig: DeepPartial<NestedConfig> = {
    server: {
      host: "localhost",
      // port 和 ssl 都省略了——因为 DeepPartial
    },
    // database 也省略了
  };
  console.log(`DeepPartial 配置: ${JSON.stringify(partialConfig)}`);
  console.log("TS 递归映射有 50 层的深度限制 ✅");

  // CONTRAST: 递归映射的深度限制
  //   TS 限制：递归层数 ≤ 50（防止编译器无限循环）
  //   Rust：没有深度限制——const generics 和 proc macro 可以处理任意深度
  //   C++：模板递归也有深度限制（编译器默认 ~1024，可通过 -ftemplate-depth 配置）
}

// =============================================================
// 第四部分：模板字面量类型
// =============================================================

function templateLiteralTypes() {
  console.log("\n=== 模板字面量类型 ===");

  // WHAT: 模板字面量在类型位置使用时，做字符串层面的类型操作
  // WHY: 让你在类型层面构造字符串模式——对字符串类型做"正则"级别的约束
  // CONTRAST: Rust——没有字符串层面的类型操作
  // CONTRAST: C++——`consteval` 可以做编译期字符串操作（C++20），但不在类型层面
  // CONTRAST: Kotlin/Java——无
  // CONTRAST: Python——typing.LiteralString（PEP 675），但能力有限

  // ===== 基础：构造字符串字面量联合 =====
  type EventName = `on${string}`;  // 任何以 "on" 开头的字符串
  type Color = `#${string}`;       // 任何以 "#" 开头的字符串

  let event: EventName = "onClick";     // ✅
  // event = "handleClick";             // ❌ 不是以 on 开头
  console.log(`EventName '${event}' — 必须以 "on" 开头`);

  // ===== 字符串联合类型的笛卡尔积 =====
  type EmailProvider = "gmail" | "outlook" | "qq";
  type EmailTLD = "com" | "cn" | "org";

  type Email = `${string}@${EmailProvider}.${EmailTLD}`;
  // 匹配 "user@gmail.com"、"hello@qq.cn" 等——自动生成 3×3=9 种模式！

  const email1: Email = "alice@gmail.com";   // ✅
  // const email2: Email = "bob@yahoo.com";  // ❌ yahoo 不在 EmailProvider 中
  console.log(`Email 模式：${email1}`);

  // ===== 实战：类型安全的事件系统 =====
  type MouseEvent = "click" | "dblclick" | "mousedown" | "mouseup";
  type UIElement = "button" | "link" | "input" | "form";

  // 类型层：生成所有可能的组合事件名
  // "button:click" | "button:dblclick" | "button:mousedown" | ... | "form:mouseup"
  // = 4 × 4 = 16 种组合
  type UIEvent = `${UIElement}:${MouseEvent}`;

  function subscribe(event: UIEvent, handler: () => void): string {
    handler();
    return `订阅了事件: ${event}`;
  }

  console.log(subscribe("button:click", () => console.log("clicked!")));
  console.log(subscribe("form:submit" as UIEvent, () => {})); // 用 as 断言
  // subscribe("div:click");  // ❌ "div" 不是 UIElement

  // ===== 类型安全的路由参数 =====
  type ExtractRouteParams<T extends string> =
    T extends `${string}:${infer Param}/${infer Rest}` ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${string}:${infer Param}` ? Param
    : never;

  type Route = "/user/:id/post/:postId";
  type RouteParams = ExtractRouteParams<Route>; // "id" | "postId"

  // 验证：RouteParams 确实是 "id" | "postId"
  const validParam: RouteParams = "id";
  console.log(`路由参数提取: ${validParam}`);

  // ===== 内置字符串工具类型 =====
  type Name = "hello world";
  type Upper = Uppercase<Name>;      // "HELLO WORLD"
  type Lower = Lowercase<Name>;      // "hello world"
  type Capital = Capitalize<Name>;    // "Hello world"
  type Uncapital = Uncapitalize<"Hello">; // "hello"

  console.log("内置字符串工具：Uppercase / Lowercase / Capitalize / Uncapitalize ✅");
}

// =============================================================
// 第五部分：编译期类型验证
// =============================================================

// Utility types
type MyP<T> = { [K in keyof T]?: T[K] };
type MyR<T> = { readonly [K in keyof T]: T[K] };
type MyO<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };
type MyRec<K extends keyof never, V> = { [P in K]: V };

interface TestObj {
  id: number;
  name: string;
  active: boolean;
}

type MappedTypeTests = {
  // Partial 后类型字段可选
  t01_partial: MyP<TestObj> extends { id?: number; name?: string; active?: boolean } ? true : false;
  // expected: true

  // Readonly 后字段只读
  t02_readonly: MyR<TestObj>["id"] extends number ? true : false;
  // expected: true

  // Omit 排除了指定字段
  t03_omit: MyO<TestObj, "id"> extends { name: string; active: boolean } ? true : false;
  // expected: true

  // Record 构造
  t04_record: MyRec<"a" | "b", number> extends { a: number; b: number } ? true : false;
  // expected: true

  // 模板字面量类型
  t05_template: `on${string}` extends string ? true : false;
  // expected: true

  // 字符串联合笛卡尔积
  t06_cartesian: `${"a" | "b"}${1 | 2}` extends "a1" | "a2" | "b1" | "b2" ? true : false;
  // expected: true（2 × 2 = 4 种组合）
};

// =============================================================
// 主入口
// =============================================================

function main(): void {
  mappedTypesBasics();
  utilityTypesDemo();
  mappedModifiers();
  templateLiteralTypes();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：映射类型是 TS 的'类型变换引擎'——批量转换对象类型。");
  console.log("模板字面量类型是 TS 的'字符串类型运算'——构造模式匹配的字符串类型。");
  console.log("六大工具类型的实现代码就是最好的映射类型教材。");
  console.log("递归映射有 50 层的编译器深度限制。");
}

main();

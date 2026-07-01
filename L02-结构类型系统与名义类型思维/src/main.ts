/**
 * Level 02 主代码：结构类型系统与名义类型思维
 *
 * 本文件演示：
 * 1. 结构类型（Structural Typing）—— 类型兼容基于"形状"而非"名称"
 * 2. 鸭子类型（Duck Typing）—— 如果它叫起来像鸭子，它就是鸭子
 * 3. 可赋值性（Assignability）规则
 * 4. private/protected 在结构类型中的特殊行为（唯一的名义行为）
 * 5. 品牌类型（Branded Type）—— 打破结构兼容性
 *
 * 运行方式：
 *   npx ts-node src/main.ts
 *   或 npx tsc && node dist/main.js
 */

// =============================================================
// 第一部分：结构类型的本质 —— 形状决定一切
// =============================================================

function structuralTypingBasics() {
  console.log("=== 结构类型基础 ===");

  // WHAT: 定义两个名字不同但结构完全相同的接口
  // CONTRAST: 在 Rust / Kotlin / Java 中，这两个类型是截然不同的
  //           Rust: `struct Point { x: f64, y: f64 }` 和 `struct Vector { x: f64, y: f64 }`
  //                 是不同的类型，不能互相赋值
  //           Kotlin/Java: `class Point(val x: Double, val y: Double)` 和 `class Vector(…)`
  //                       即使是 data class，名字不同就不兼容
  interface Point {
    x: number;
    y: number;
  }

  interface Vector {
    x: number;
    y: number;
  }

  // WHAT: 创建一个 Point 类型的值
  const p: Point = { x: 10, y: 20 };

  // 类型层：TS 检查"这个对象的形状是否满足 Point 的要求？"→ 是！
  // 值层：就是一个普通的 JS 对象，没有任何类型标记
  const v: Vector = p; // ✅ 编译通过！结构相同 → 兼容
  //              ^^
  // 在 Rust / Kotlin / Java 中，这行会编译失败——类型名称不同

  console.log(`Point { x: ${v.x}, y: ${v.y} } 被当作 Vector 使用 — 完全合法！`);

  // WHAT: 即使字段顺序不同也可以（但实践中代码应该是确定的顺序）
  const p2: Point = { y: 30, x: 40 }; // ✅ 也可以，结构完整即可
  console.log(`Point { x: ${p2.x}, y: ${p2.y} } — 字段顺序无关`);

  // WARNING: 结构类型的"意外兼容"是最容易坑来自名义语言背景的开发者的陷阱
  //          两个语义完全不同的类型（如 UserId 和 ProductId）如果结构相同，
  //          就可以互相赋值——这是 bug 的温床！
}

// =============================================================
// 第二部分：可赋值性规则（Assignability）
// =============================================================

function assignabilityRules() {
  console.log("\n=== 可赋值性规则 ===");

  // WHAT: TS 使用结构子类型（Structural Subtyping）规则
  //       如果 S 的结构 >= T 的结构（即 S 包含 T 的所有成员且类型兼容），
  //       则 S 可以赋值给 T（S 是 T 的子类型）

  interface Named {
    name: string;
  }

  interface Person {
    name: string;
    age: number;
  }

  const alice: Person = { name: "Alice", age: 30 };

  // Person 有 { name, age }，Named 只需要 { name }
  // Person 的结构 >= Named 的结构 → Person 可以赋值给 Named
  const named: Named = alice; // ✅ 编译通过
  console.log(`Person '${named.name}' 可以当作 Named 使用`);

  // ✅ 反过来不行（Named 缺少 age）：
  // const person: Person = named;  // ❌ 编译错误
  //   error TS2741: Property 'age' is missing in type 'Named' but required in type 'Person'.

  // CONTRAST: Rust 的 trait 机制类似但更严格：
  //   `fn display(item: &impl Display)` — 任何实现 Display trait 的类型都可以传入
  //   但你不能把一个 `Point` 赋给 `Vector` 类型的变量，即使它们结构完全相同
  //   trait 约束的是"行为"，结构类型约束的是"形状"

  // CONTRAST: Go 的接口也是结构类型（Go 称为隐式接口）
  //   Go 中只要类型实现了接口的所有方法，就自动满足接口——不需要显式声明
  //   这与 TS 的接口结构匹配完全一致！
  //   但 Go 的 struct 赋值仍然需要类型名称一致（struct 是名义的）
}

// =============================================================
// 第三部分：private/protected 的结构类型行为
// =============================================================

function privateStructuralBehavior() {
  console.log("\n=== private 的结构类型行为 ===");

  // WHAT: TS 中，private 不仅控制访问，还影响结构兼容性！
  // WHY: 这是 TS 在结构类型系统中唯一的名义类型行为
  // CONTRAST: Rust 的 `pub(crate)` / `pub(self)` 只是访问控制，
  //           不影响类型兼容性——两个不同的 struct 永远不兼容
  // CONTRAST: Kotlin/Java 的 `private` 也只是访问控制
  //           类型名称不同就不兼容，与 private 无关

  class User {
    // 类型层：name 是 `string`（public）
    // 值层：this.name 就是普通 JS 属性
    constructor(
      public id: number,
      public name: string,
      private password: string, // private: 访问控制 + 结构兼容性影响
    ) {}

    verifyPassword(input: string): boolean {
      return this.password === input;
    }
  }

  // 这个类与 User 结构相同，但 private 字段来源不同
  class Admin {
    constructor(
      public id: number,
      public name: string,
      private password: string, // 虽然字段名相同，但来自 Admin 类
    ) {}

    verifyPassword(input: string): boolean {
      return this.password === input;
    }
  }

  const user = new User(1, "Alice", "secret123");
  const admin = new Admin(1, "Alice", "secret123");

  // 类型层：User 和 Admin 看起来结构相同，但因为 private 字段，它们不兼容
  // 值层：两个对象在运行时是一样的 JS 对象
  console.log(`名义类型检查：User(${user.name}) 和 Admin(${admin.name}) 因 private 字段不兼容`);
  // const u: User = admin;  // ❌ 编译错误
  //   error TS2322: Type 'Admin' is not assignable to type 'User'.
  //     Types have separate declarations of a private property 'password'.

  // ✅ 如果没有 private 字段（全部 public），就可以互相赋值
  class PublicUser {
    constructor(
      public id: number,
      public name: string,
    ) {}
  }

  class PublicAdmin {
    constructor(
      public id: number,
      public name: string,
    ) {}
  }

  const publicUser: PublicUser = new PublicAdmin(1, "Bob"); // ✅ 结构相同，兼容！
  console.log(`PublicUser '${publicUser.name}' (来自 PublicAdmin 实例) — 结构类型生效`);

  // CONTRAST: 在 Rust/Kotlin/Java 中，PublicUser 和 PublicAdmin 即使 public 字段相同
  //           也不能互相赋值——因为是名义类型，名字不同就不兼容
  //           TS 的 private 行为相当于："结构类型，但 private 带来了名义行为"
}

// =============================================================
// 第四部分：品牌类型（Branded Type）—— 打破结构兼容性
// =============================================================

function brandedTypeDemo() {
  console.log("\n=== 品牌类型（Branded Type）===");

  // WHAT: 品牌类型是在类型层面给基本类型打上"标记"
  // WHY: 防止两个语义不同但结构相同的类型被意外混淆
  //  例如 UserId 和 ProductId 都是 number，但把它们搞混是灾难性的
  // CONTRAST: Rust 的 newtype 模式：
  //   `struct UserId(u64);` — 用包装类型区分语义
  //   编译后零成本（Rust 的 newtype 在优化后不增加运行时开销）
  //   但 TS 的品牌类型在运行时也是零成本的（类型擦除后就是原始值）
  // CONTRAST: Kotlin 的 inline value class：
  //   `@JvmInline value class UserId(val value: Long)` — 类似 Rust newtype
  // CONTRAST: Haskell 的 newtype（零成本包装）

  // 类型层：定义一个带有品牌标记的类型
  // 品牌标记是一个"幽灵类型"字段（phantom type），只在类型层存在
  type Brand<T, Brand extends string> = T & { __brand: Brand };

  // 使用品牌类型创建"语义化"的原始类型
  type UserId = Brand<number, "UserId">;
  type ProductId = Brand<number, "ProductId">;
  type Email = Brand<string, "Email">;

  // 值层：创建品牌值需要类型断言（因为 __brand 是幽灵字段）
  // 类型层：as 断言告诉 TS "相信我，这是 UserId"
  function createUserId(id: number): UserId {
    return id as UserId; // WARNING: 这是类型断言！运行时不会做任何验证
  }

  function createProductId(id: number): ProductId {
    return id as ProductId;
  }

  function createEmail(email: string): Email {
    // 值层：可以在这里做运行时验证
    if (!email.includes("@")) {
      throw new Error(`Invalid email: ${email}`);
    }
    return email as Email;
  }

  const userId = createUserId(42);
  const productId = createProductId(99);

  // 类型层：接收 UserId 类型
  function getUserById(id: UserId): string {
    return `User with ID: ${id}`;
  }

  function getProductById(id: ProductId): string {
    return `Product with ID: ${id}`;
  }

  console.log(getUserById(userId));
  // getUserById(productId);  // ❌ 编译错误！
  //   error TS2345: Argument of type 'ProductId' is not assignable to parameter of type 'UserId'.
  //     Type 'ProductId' is not assignable to type '{ __brand: "UserId"; }'.
  //     Types of property '__brand' are incompatible.
  //       Type '"ProductId"' is not assignable to type '"UserId"'.

  console.log(getProductById(productId));

  const email = createEmail("alice@example.com");
  console.log(`Email value: ${email}`); // 运行时就是一个普通字符串

  // 品牌类型的本质是"编译期类型安全 + 零运行时成本"
  // 对比 Rust: `struct UserId(u64)` 在 debug 模式下可能有包装开销
  // 但 release 模式 LLVM 会优化掉——所以 Rust newtype 也是零成本的
  // TS 的类型擦除自然就是零成本的
}

// =============================================================
// 第五部分：结构类型的经典陷阱 —— 意外兼容
// =============================================================

function structuralTypingTraps() {
  console.log("\n=== 结构类型的经典陷阱 ===");

  // 场景：定义一个表示线性代数中 2D 向量的类型
  interface Vector2D {
    x: number;
    y: number;
  }

  // 场景：定义一个表示地里坐标的类型（语义完全不同！）
  interface GeoLocation {
    x: number; // 经度
    y: number; // 纬度
  }

  // 场景：定义一个表示屏幕像素坐标的类型
  interface PixelCoord {
    x: number;
    y: number;
  }

  // 这三个类型结构完全相同！但它们分别表示向量、经纬度、像素坐标
  // 在名义类型系统中，它们严格区分；在 TS 中它们可以互相赋值！

  function normalizeVector(v: Vector2D): Vector2D {
    const length = Math.sqrt(v.x * v.x + v.y * v.y);
    return { x: v.x / length, y: v.y / length };
  }

  function getCity(loc: GeoLocation): string {
    // 模拟：根据经纬度找城市
    if (loc.x === 116.4 && loc.y === 39.9) return "北京";
    return "未知";
  }

  const beijing: GeoLocation = { x: 116.4, y: 39.9 };
  const pixel: PixelCoord = { x: 640, y: 480 };

  // ❌ 结构类型的陷阱：以下调用全部编译通过，但语义完全错误！
  const normalized = normalizeVector(beijing); // 把经纬度当向量做归一化——毫无意义！
  const city = getCity(pixel);                 // 把像素坐标当地理坐标——毫无意义！
  const worldCoord = normalizeVector(pixel);   // 演示正确的用法：像素坐标转世界坐标

  console.log(`把北京坐标当向量归一化: { x: ${normalized.x}, y: ${normalized.y} }`);
  console.log(`把像素坐标当地理坐标: ${city}`);
  console.log(`像素坐标转换世界坐标: { x: ${worldCoord.x.toFixed(2)}, y: ${worldCoord.y.toFixed(2)} }`);

  // ✅ 修复方案：使用品牌类型
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type BrandVector2D = Vector2D & { __brand: "Vector2D" };
  type BrandGeoLocation = GeoLocation & { __brand: "GeoLocation" };
  type BrandPixelCoord = PixelCoord & { __brand: "PixelCoord" };
  // 演示品牌类型用法（消除未使用警告）
  const brandedV: BrandVector2D = { x: 1, y: 2, __brand: "Vector2D" } as BrandVector2D;
  const brandedG: BrandGeoLocation = { x: 116.4, y: 39.9, __brand: "GeoLocation" } as BrandGeoLocation;
  const brandedP: BrandPixelCoord = { x: 640, y: 480, __brand: "PixelCoord" } as BrandPixelCoord;
  void brandedV; void brandedG; void brandedP;

  // 用品牌类型后，normalizeVector(brandBeijing) 会在编译期报错
  // 这就是品牌类型的价值——阻止"结构兼容但语义不同"的意外赋值
}

// =============================================================
// 第六部分：编译期类型验证
// =============================================================

// 类型层：验证结构类型的各种关系
// 值层：以下代码不产生任何 JS——纯粹的类型运算
export type StructuralTypingTests = {
  // 结构相同 → 兼容
  test_01_same_structure: { x: number; y: number } extends { x: number; y: number }
    ? true
    : false;
  // expected: true

  // 子集兼容（多的可以赋值给少的）
  test_02_subset: { x: number; y: number; z: number } extends { x: number; y: number }
    ? true
    : false;
  // expected: true

  // 反过来不兼容（少的不能赋值给多的）
  // test_03_superset: { x: number; y: number } extends { x: number; y: number; z: number }
  // expected: false

  // 空对象兼容所有非 null/undefined 类型
  test_04_empty_object: { name: string; age: number } extends {}
    ? true
    : false;
  // expected: true 🔥 这是一个常见陷阱！`{}` 几乎兼容一切

  // string 不是对象字面量类型的超集（有额外属性也不行）
  test_05_excess_properties: { x: number; y: number; extra: string } extends { x: number; y: number }
    ? true
    : false;
  // expected: true — 在类型声明中，多余的属性是允许的
  // 但在对象字面量直接赋值时，TS 会做额外属性检查（excess property checking）
};

// =============================================================
// 第七部分：额外属性检查（Excess Property Checking）
// =============================================================

function excessPropertyChecking() {
  console.log("\n=== 额外属性检查 ===");

  interface SquareConfig {
    width: number;
    height?: number;
    color?: string;
  }

  function createSquare(config: SquareConfig): string {
    const h = config.height ?? config.width;
    return `正方形 ${config.width}x${h}，颜色: ${config.color ?? "黑色"}`;
  }

  // ✅ 变量赋值：可以有多余属性
  const configWithExtra = {
    width: 100,
    height: 100,
    color: "red",
    borderRadius: 10, // 额外属性，但先赋值给变量再传入 → OK
  };

  console.log(createSquare(configWithExtra));

  // ❌ 对象字面量直接传入：不能有多余属性（额外属性检查）
  // createSquare({ width: 100, height: 100, color: "red", borderRadius: 10 });
  //   error TS2353: Object literal may only specify known properties,
  //                 and 'borderRadius' does not exist in type 'SquareConfig'.

  console.log("额外属性检查只在对象字面量直接传入时触发");
  console.log("这是防止拼写错误的设计——不是结构类型规则的例外！");
}

// =============================================================
// 主入口
// =============================================================

function main(): void {
  structuralTypingBasics();
  assignabilityRules();
  privateStructuralBehavior();
  brandedTypeDemo();
  structuralTypingTraps();
  excessPropertyChecking();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：TS 的类型兼容基于形状，不是名字。");
  console.log("来自 Rust/Kotlin/Java 的开发者最容易掉进 '意外兼容' 的陷阱。");
  console.log("品牌类型（Branded Type）是打破结构兼容性的关键武器。");
}

main();

/**
 * Level 03 主代码：类型层级与高级类型操作
 *
 * 本文件演示：
 * 1. TS 类型层级：unknown → ... → never
 * 2. 联合类型（Union Types）与类型收窄
 * 3. 交叉类型（Intersection Types）与组合
 * 4. 字面量类型（Literal Types）与 as const
 * 5. satisfies 操作符（TS 4.9+）
 * 6. 类型断言（as / as const / satisfies）的精确语义
 *
 * 运行方式：
 *   npx ts-node src/main.ts
 */

// =============================================================
// 第一部分：TS 类型层级（Type Hierarchy）
// =============================================================

function typeHierarchyDemo() {
  console.log("=== TS 类型层级 ===");

  // WHAT: TS 的类型形成了一个层级结构
  // 顶层：unknown（最宽泛的类型，所有类型都可以赋值给它）
  // 底层：never（最窄的类型，可以赋值给任何类型，但没有任何值）

  // CONTRAST: TS 的类型层级 vs Rust 的类型层级：
  //   Rust 没有"顶层类型"的概念（dyn Any 不算真正的顶层）
  //   Rust 有 `!`（never type）——与 TS 的 never 类似但用途更窄
  //   Rust 中 `fn diverge() -> !` 表示函数永不返回，可赋值给任何类型
  // CONTRAST: Kotlin 的 * 投影：`MutableList<*>`  ≈ `MutableList<out Any?>`，但也不是真正的顶层类型
  //   Kotlin 的 Nothing 与 never 完全对应——Nothing 是所有类型的子类型

  // 类型层：以下类型层级关系在编译期成立
  // 值层：这些 type 语句在运行时不存在

  // never（底层类型）→ 任何类型的子类型
  //   never 是空集，没有任何值属于 never
  type NeverSubtype1 = never extends string ? true : false;          // true
  type NeverSubtype2 = never extends number ? true : false;          // true
  type NeverSubtype3 = never extends { x: number } ? true : false;  // true
  // never 可以赋值给任何类型，因为"什么都匹配不了的值"可以匹配所有约束
  // 这听起来反直觉，但在类型系统中是正确的：空集是所有集合的子集

  // unknown（顶层类型）→ 任何类型的超类型
  //   any 的类型也可以赋值给 unknown，但 unknown 不能赋值给其他类型
  type UnknownSupertype1 = string extends unknown ? true : false;      // true
  type UnknownSupertype2 = number extends unknown ? true : false;      // true
  type UnknownSupertype3 = { x: number } extends unknown ? true : false; // true

  // 中间层级的包含关系
  type StringIsObject = string extends object ? true : false;  // false！
  //   string 是 primitive，不是 object
  type ObjectIsEmptyObject = { x: number } extends {} ? true : false; // true
  //   任何对象都是 `{}` 的子类型（见 Level 02 的陷阱）

  console.log("类型层级在编译期已验证 ✅");
  console.log("never 是任何类型的子类型");
  console.log("unknown 是任何类型的超类型");
  console.log("string 不是 object 的子类型（primitive vs object 的区分）");

  // ===== 值层的演示 =====
  // unknown：可以接受任何值，但不能直接操作
  let unknownValue: unknown = 42;
  unknownValue = "hello";
  unknownValue = { name: "Alice" };
  // console.log(unknownValue.name); // ❌ 不能直接访问属性
  if (typeof unknownValue === "object" && unknownValue !== null) {
    // 类型收窄后也不确定结构
    console.log(`unknownValue 是一个对象`);
  }
}

// =============================================================
// 第二部分：联合类型（Union Types）
// =============================================================

function unionTypesDemo() {
  console.log("\n=== 联合类型 ===");

  // WHAT: `A | B` 表示"要么是 A，要么是 B"
  // WHY: TS 没有 sum type / tagged union 的原生支持，用 union 模拟
  // CONTRAST: Rust 的 enum（真正的 tagged union）：
  //   enum Result<T, E> { Ok(T), Err(E) }
  //   每个变体可以携带不同的数据，且必须通过 match 穷尽匹配
  //   而 TS 的联合类型是"不带标签的"——你需要 discriminated union 来模拟
  // CONTRAST: Kotlin 的 sealed class：
  //   sealed class Result<out T, out E> {
  //     data class Ok<T>(val value: T) : Result<T, Nothing>()
  //     data class Err<E>(val error: E) : Result<Nothing, E>()
  //   }
  //   与 Rust enum 非常相似，继承自共同父类
  // CONTRAST: C++ 的 std::variant<Types...>：
  //   运行时 tagged union，编译期不能直接访问变体成员（需要 visit）

  // 类型层：定义联合类型
  type ApiResult =
    | { status: "success"; data: string }   // 成功：有 data
    | { status: "error"; error: string }    // 失败：有 error
    | { status: "loading" };                // 加载中：没有额外数据

  // 值层：处理联合类型的函数
  function handleApiResult(result: ApiResult): string {
    // 使用 discriminant（status 字段）进行类型收窄
    switch (result.status) {
      case "success":
        // 这里 result 被收窄为 { status: "success"; data: string }
        return `成功：${result.data}`;
      case "error":
        // 这里 result 被收窄为 { status: "error"; error: string }
        return `失败：${result.error}`;
      case "loading":
        // 这里 result 被收窄为 { status: "loading" }
        return "加载中...";
      // 如果漏掉一个 case，加上 noFallthroughCasesInSwitch 会报错
      // 如果用 never 的穷尽检查（见 Level 04），也会报错
      default: {
        // 穷尽检查：确保所有分支已处理
        const _exhaustive: never = result;
        return `未预期的状态：${_exhaustive}`;
      }
    }
  }

  console.log(handleApiResult({ status: "success", data: "用户数据" }));
  console.log(handleApiResult({ status: "error", error: "网络超时" }));
  console.log(handleApiResult({ status: "loading" }));

  // WHAT: 访问联合类型的成员——只能访问"共有"的成员
  function getStatus(result: ApiResult): string {
    return result.status; // ✅ status 在所有分支都存在
    // return result.data; // ❌ data 只在 success 分支存在
  }

  console.log(`所有分支共有的 status: ${getStatus({ status: "loading" })}`);

  // WARNING: 联合类型的"非标签"形式很容易出错
  // 如果你用 `string | number | null` 而没有 discriminant，类型收窄全靠 typeof
  function processValue(value: string | number | null): string {
    if (value === null) return "null";
    if (typeof value === "number") return `数字：${value}`;
    return `字符串：${value}`;
  }

  console.log(processValue("hello"));
  console.log(processValue(42));
  console.log(processValue(null));
}

// =============================================================
// 第三部分：交叉类型（Intersection Types）
// =============================================================

function intersectionTypesDemo() {
  console.log("\n=== 交叉类型 ===");

  // WHAT: `A & B` 表示"即是 A 又是 B"
  // WHY: 用于组合多个类型的特征——类似多重继承但更灵活
  // CONTRAST: Rust 没有交叉类型。
  //   你必须用 trait 组合：`fn foo<T: TraitA + TraitB>(x: T)`
  //   但这只是约束，不是"把两个类型合并成一个新类型"
  // CONTRAST: C++ 的多重继承最接近 TS 的交叉类型：
  //   class C : public A, public B { };
  //   但 C++ 多重继承有"菱形继承"问题（虚继承），TS 交叉类型没有

  interface Nameable {
    name: string;
    getName(): string;
  }

  interface Ageable {
    age: number;
    getAge(): number;
  }

  // 类型层：交叉类型 = 同时拥有两者的所有成员
  type Person = Nameable & Ageable;

  // 值层：创建一个满足交叉类型的值（同时满足 Nameable 和 Ageable）
  const person: Person = {
    name: "Alice",
    age: 30,
    getName(): string {
      return this.name;
    },
    getAge(): number {
      return this.age;
    },
  };

  console.log(`${person.getName()}，${person.getAge()} 岁`);

  // WARNING: 同名属性的交叉——类型取交叉
  // 如果两个类型的同名属性类型不兼容，结果可能是 never
  interface A {
    x: number;
    y: string;
  }

  interface B {
    x: string; // 与 A.x 类型冲突
    z: boolean;
  }

  type AB = A & B;
  // AB 的类型：{ x: number & string; y: string; z: boolean }
  // x: number & string → 没有值同时是 number 和 string → never
  // 因此 x 的类型是 never，AB 类型的 x 永远无法赋值

  // 值层：你实际上无法创建满足这个交叉类型的值
  // const ab: AB = { x: ???, y: "hello", z: true };  // x 无法赋值！

  // 同名字段是基本类型时冲突 → never
  // 同名字段是对象类型时合并（递归交叉）
  interface HasConfigA {
    config: { db: string };
  }
  interface HasConfigB {
    config: { cache: number };
  }
  type Combined = HasConfigA & HasConfigB;
  // config: { db: string } & { cache: number } → { db: string; cache: number }
  // ✅ 对象类型的交叉是合并字段

  const combined: Combined = {
    config: {
      db: "postgres",
      cache: 300,
    },
  };
  console.log(`合并配置：db=${combined.config.db}, cache=${combined.config.cache}s`);
}

// =============================================================
// 第四部分：字面量类型与 as const
// =============================================================

function literalTypesAndAsConst() {
  console.log("\n=== 字面量类型与 as const ===");

  // WHAT: TS 中，"hello" 本身就是一个类型——字面量类型
  // WHY: 这让你可以把值作为类型约束使用（比如状态机、枚举替代）
  // CONTRAST: Rust / Kotlin / Java / C++ 中，值不是类型。
  //   你不能写 `fn foo(x: "hello")`——值"hello"不是一个类型。
  //   相反，你定义一个枚举或一个类型，然后用那个类型的值。
  //   TS 的字面量类型是类型系统的独特能力。
  // CONTRAST: Python（带 typing.Literal，Python 3.8+）：
  //   `def foo(x: Literal["hello"])` —— Python 也逐渐加入了字面量类型支持

  // 类型层：这些是字面量类型
  type Direction = "north" | "south" | "east" | "west";
  type HttpStatus = 200 | 301 | 404 | 500;
  type YesOrNo = true | false;

  // 值层：函数只能接受精确的字面量值
  function move(direction: Direction, distance: number): string {
    return `向 ${direction} 移动 ${distance} 米`;
  }

  console.log(move("north", 10));
  console.log(move("east", 5));
  // move("up", 3);  // ❌ 编译错误：'"up"' 不是 Direction 的有效值

  // ===== as const 断言 =====
  // WHAT: as const 把对象的类型推断为"最窄"的字面量类型（冻结/只读）
  // WHY: 默认推断会扩大类型，as const 告诉 TS "我不会修改这个值"

  // 默认推断——类型扩大了
  const config1 = {
    host: "localhost",    // 推断为 string（不是 "localhost"）
    port: 8080,           // 推断为 number（不是 8080）
    debug: true,          // 推断为 boolean（不是 true）
  };
  // config1.host = "other";  // ✅ 允许（推断为 string，所以可以改值）

  // as const——类型冻结为最窄
  const config2 = {
    host: "localhost",
    port: 8080,
    debug: true,
  } as const;
  // config2 的类型：{ readonly host: "localhost"; readonly port: 8080; readonly debug: true }
  // config2.host = "other";  // ❌ 编译错误：Cannot assign to 'host' because it is a read-only property.

  console.log(`config2.host 的类型是 "${config2.host}"（字面量类型，不是 string）`);

  // as const 对数组也有作用——变成只读元组
  const colors = ["red", "green", "blue"];           // string[]
  const frozenColors = ["red", "green", "blue"] as const; // readonly ["red", "green", "blue"]

  // colors.push("yellow");       // ✅ 可以修改
  // frozenColors.push("yellow"); // ❌ 只读数组，无法修改
  console.log(`frozenColors 的元素类型是具体的字面量，不是 string`);

  // WARNING: as const 和 Object.freeze 的区别
  // as const 是类型层面的只读（编译期），不影响运行时
  // Object.freeze 是值层面的冻结（运行时），类型推断仍然是可变的
  const frozenAtRuntime = Object.freeze({ key: "value" });
  // frozenAtRuntime 的类型仍是 { key: string }，不是 { readonly key: "value" }
  // 要同时冻结类型和值：用 as const（TS 4.5+ 自动识别 Object.freeze）
}

// =============================================================
// 第五部分：satisfies 操作符（TS 4.9+）
// =============================================================

function satisfiesOperator() {
  console.log("\n=== satisfies 操作符 ===");

  // WHAT: `expression satisfies Type` 验证表达式匹配类型，但保留表达式自身的推断类型
  // WHY: `: Type` 会把变量类型框定为 Type（丢失更精确的推断），satisfies 不会

  // ===== 对比 : 标注和 satisfies =====

  // 用 : 标注——推断类型丢失了具体信息
  const palette1: Record<string, string | number[]> = {
    red: "#FF0000",
    green: "#00FF00",
    sizes: [16, 24, 32],
  };

  // palette1.red 的类型是 string | number[]（来自 Record 的映射）
  // 所以这行在类型层面合法，但运行时错误：
  // const upperRed = palette1.red.toUpperCase();  // ❌ 类型错误！red 可能是 number[]

  // 用 satisfies——保留每个字段的具体类型
  const palette2 = {
    red: "#FF0000",
    green: "#00FF00",
    sizes: [16, 24, 32],
  } satisfies Record<string, string | number[]>;

  // 现在 palette2.red 被精确推断为 string
  const upperRed = palette2.red.toUpperCase(); // ✅ 编译通过！知道 red 是 string
  console.log(`red 大写：${upperRed}`);

  // palette2.sizes 被精确推断为 number[]
  palette2.sizes.push(48); // ✅
  console.log(`sizes: ${palette2.sizes}`);

  // satisfies 的价值：
  // 1. 验证 palette2 确实满足 Record<string, string | number[]> 约束
  // 2. 但不丢失每个字段的具体类型——保留了更精确的推断
  // 3. 这在你需要"满足某个接口"但不想"丢失精确类型信息"时非常有用

  // ===== satisfies 用于属性检查 =====
  type Color = {
    hex: string;
    rgb: [number, number, number];
  };

  // 对象字面量在 = 右边时，TS 会做额外属性检查
  // satisfies 也会做同样检查
  const myColor = {
    hex: "#FF0000",
    rgb: [255, 0, 0] as const,
    // extraField: "oops",  // ❌ 不满足 Color 约束（额外属性）
  } satisfies Color;

  console.log(`颜色 hex=${myColor.hex}, rgb=[${myColor.rgb.join(", ")}]`);

  // satisfies vs 类型标注 vs as const 总结：
  // : Type       → 框定变量类型，丢失精确推断
  // as const     → 冻结为最窄类型，值不可变
  // satisfies    → 验证约束，但保留精确推断（TypeScript 4.9+）
}

// =============================================================
// 第六部分：类型断言（as / ! / satisfies）
// =============================================================

function typeAssertions() {
  console.log("\n=== 类型断言 ===");

  // WHAT: as 告诉 TS "相信我，这是 X 类型"——绕过编译期检查
  // WARNING: as 是危险的！它不会在运行时做任何验证
  //          滥用 as 相当于在自己脚下放了一颗地雷
  // CONTRAST: Rust 的 `unsafe`——也需要手动保证正确性，但标记更显眼
  // CONTRAST: Kotlin 的 `as`——会在运行时做类型转换检查，失败抛 ClassCastException
  //           TS 的 as 在运行时什么都不做——它是纯粹的编译期指令

  // 安全使用场景：你知道的比 TS 多
  const raw: unknown = '{"name": "Alice", "age": 30}';
  const parsed = JSON.parse(raw as string) as { name: string; age: number };
  //                         ^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //                         告诉TS这是string  断言parse结果的结构
  // 这是 as 的合理使用——JSON.parse 返回 any，你需要"断言"具体结构
  console.log(`${parsed.name}, ${parsed.age} 岁`);

  // 危险使用场景：绕过类型检查
  // const x: number = "not a number" as unknown as number;
  //    编译通过，但 x 在运行时是 string，之后做数学运算会出问题

  // ===== ! 非空断言（Non-null Assertion） =====
  // WHAT: expr! 告诉 TS "我确定这个值不是 null/undefined"
  // WARNING: 运行时如果真的是 null/undefined，就会崩溃
  function getMaybeNull(getIt: boolean): string | null {
    return getIt ? "got it" : null;
  }

  // 安全方式：显式检查
  const result1 = getMaybeNull(true);
  if (result1 !== null) {
    console.log(`安全：${result1}`);
  }

  // 使用 ! 断言：跳过检查（仅在你 100% 确定不为 null 时使用）
  const result2 = getMaybeNull(true)!;
  console.log(`断言为非null：${result2}`);

  // 危险！如果 getMaybeNull(false)! → 运行时 null → 崩！
  // const crash = getMaybeNull(false)!;
  // console.log(crash.toUpperCase());  // 💥 TypeError

  // CONTRAST: Rust 中 `unwrap()` — 运行时检查，None 则 panic
  // CONTRAST: Kotlin 中 `!!` — 运行时检查，null 则 NPE
  // TS 的 `!` 更危险——编译期指令，运行时无任何检查
}

// =============================================================
// 第七部分：编译期类型验证
// =============================================================

type TypeHierarchyTests = {
  // never 是所有类型的子类型
  t01_never_subtype: never extends unknown ? true : false;
  // expected: true —— never 可赋值给 unknown

  // unknown 是所有类型的超类型
  t02_unknown_supertype: "hello" extends unknown ? true : false;
  // expected: true

  // string 字面量是 string 的子类型
  t03_literal_subtype: "hello" extends string ? true : false;
  // expected: true

  // string 不是 string 字面量的子类型
  t04_string_not_literal: string extends "hello" ? true : false;
  // expected: false

  // number 字面量联合仍然是 number 的子类型
  t05_union_subtype: 1 | 2 | 3 extends number ? true : false;
  // expected: true

  // void 和 undefined 的关系（strictNullChecks 打开时）
  t06_void_undefined: void extends undefined ? true : false;
  // 这个结果取决于 TS 版本和配置：
  //   strictNullChecks: true  → false（void 不是 undefined 的子类型）
  //   但在函数返回类型中，void 可以接受 undefined 的返回值

  // 联合类型的关系
  t07_union_of_literal: "a" | "b" extends string ? true : false;
  // expected: true

  // 交叉类型的关系
  t08_intersection_subtype: { x: number } & { y: string } extends { x: number } ? true : false;
  // expected: true —— 交叉类型是每个成员的超类型
};

// =============================================================
// 主入口
// =============================================================

function main(): void {
  typeHierarchyDemo();
  unionTypesDemo();
  intersectionTypesDemo();
  literalTypesAndAsConst();
  satisfiesOperator();
  typeAssertions();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：TS 的类型层级从 never（底层）到 unknown（顶层）。");
  console.log("联合类型是一组可能性的"或"，交叉类型是特征的组合"且"。");
  console.log("satisfies 比类型标注更适合"验证而不改变推断"的场景。");
}

main();

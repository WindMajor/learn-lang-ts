/**
 * bug_01：分配性条件类型的"意外行为"——条件被分发到联合类型的每个成员
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_01_分配性条件类型陷阱.ts
 *
 * 预期 tsc 输出：
 *   （分配性本身不会报编译错误——它是设计行为，不是 bug。
 *    但分配性可能产生你意想不到的类型结果——这就是"陷阱"）
 *
 *   如果你期望 IsString<string | number> = false，实际结果是 true | false
 *   然后 true | false 被传递到下游类型，产生连锁的"意外"。
 */

// ================================================================
// 错误代码：对分配性条件类型的结果感到意外
// ================================================================

// 定义一个条件类型来判断是否为 string
type IsString<T> = T extends string ? "yes" : "no";

// 😱 你以为的结果：
type Expected = "no";  // 你期望：string | number 不完全是 string，所以返回 "no"

// 😵 实际的结果：
type Actual = IsString<string | number>;
//           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//           实际结果是 "yes" | "no"！
//           因为分配性拆分了联合类型：
//           对 string: "yes"
//           对 number: "no"
//           → "yes" | "no"

// ================================================================
// 更危险的场景：分配性 + extends = 筛选
// ================================================================

type HasName = { name: string };
type HasAge = { age: number };
type HasBoth = HasName & HasAge;

// 定义一个条件类型来"提取"有 name 属性的
type ExtractWithName<T> = T extends { name: string } ? T : never;

// 对于单一类型，行为可预测：
type Test1 = ExtractWithName<HasName>;   // HasName ✅
type Test2 = ExtractWithName<HasAge>;    // never   ✅

// 对于联合类型，分配性导致每个成员独立判断：
type Test3 = ExtractWithName<HasName | HasAge>;
//          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//          = ExtractWithName<HasName> | ExtractWithName<HasAge>
//          = HasName | never
//          = HasName ✅ （你想要的结果——筛选出有 name 的）

// 但如果你要的是"整体判断"——判断整个联合是否满足条件呢？
// ExtractWithName<HasName | HasAge> 拆成了两个成员分别判断

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// 分配性是 TS 条件类型的核心设计。
// 它让你把联合类型"映射"到另一个联合类型——本质是类型层面的 map。
//
// 但当你需要"整体判断"（不拆分）时，分配性就成了陷阱。
//
// 【对比 Rust】：
//   Rust 的泛型在编译期单态化——不存在"联合类型"的概念。
//   如果你用 enum，每个变体是独立的——`match` 必须穷尽。
//   所以 Rust 没有分配性这个概念的对应物。
//
// 【对比 C++】：
//   C++ 的 `std::is_same_v<T, U>` 判断的是"整个类型 T 是否等于 U"。
//   `std::is_same_v<int | float, int>` 不存在——C++ 没有联合类型。
//   `std::variant<int, float>` 是一个具体类型，不是 `int | float`。
//
// 【对比 Kotlin/Java】：
//   没有联合类型的概念。`sealed class` 是最接近的——每个子类是独立类型。
//   通过 `when` 进行分支，不需要分配性。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 抑制分配性：用 [T] 包装
type IsStringSafe<T> = [T] extends [string] ? "yes" : "no";

type SafeResult = IsStringSafe<string | number>;  // "no" ✅
// [string | number] 作为一个整体被检查——不分配

// ✅ 通用模式：抑制分配性的包装
type NonDistributive<T extends [unknown], U> = T extends [U] ? true : false;
type Test = NonDistributive<[string | number], string>;  // false

// ✅ 记忆口诀：
//   裸 T（T extends U）→ 分配
//   包装 [T]（[T] extends [U]）→ 不分配
*/

export {};

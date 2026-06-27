/**
 * bug_02：交叉类型的同名属性冲突导致 never
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_02_交叉类型同名属性冲突导致never.ts
 *
 * 预期 tsc 错误输出：
 *   error TS2322: Type 'string' is not assignable to type 'never'.
 *
 *   error TS2322: Type 'number' is not assignable to type 'never'.
 *
 *   error TS2345: Argument of type '{ value: number; name: string; }' is not assignable to parameter of type 'Merged'.
 *     Types of property 'value' are incompatible.
 *       Type 'number' is not assignable to type 'never'.
 */

// ================================================================
// 错误代码：交叉类型的同名属性类型冲突
// ================================================================

// 场景：两个配置接口有同名但不同类型的属性
interface HasStringValue {
  value: string;
  name: string;
}

interface HasNumberValue {
  value: number; // 与 HasStringValue.value 冲突！
  id: number;
}

// 类型层：交叉后，value 的类型是 string & number → never
// 这意味着你没有可以赋给 Merged 的实际值
type Merged = HasStringValue & HasNumberValue;
// 展开后：{ value: never; name: string; id: number }
//             ^^^^^^^^^^^
//             value 不可能同时是 string 和 number → never

// BUG: 尝试创建满足 Merged 类型的值
//   string 不能赋值给 never（string & number 中，string 不满足 number）
// const merged: Merged = { value: "hello", name: "test", id: 1 };
//   error TS2322: Type 'string' is not assignable to type 'never'.

//   同理，number 也不满足 never
// const merged2: Merged = { value: 42, name: "test", id: 1 };
//   error TS2322: Type 'number' is not assignable to type 'never'.

// BUG: 尝试把满足交叉类型之一的值传给期望交叉类型的函数
function processMerged(merged: Merged): void {
  console.log(merged);
}

const partialObj = {
  value: 42,
  name: "test",
  id: 1,
};

// processMerged(partialObj);  // ❌ 编译错误
//   error TS2345: Argument of type '{ value: number; ... }' is not assignable to parameter of type 'Merged'.
//     Types of property 'value' are incompatible.
//       Type 'number' is not assignable to type 'never'.

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// 交叉类型的 `&` 语义是"必须同时满足两边"。
// 对于同名的非对象属性（string & number），不存在同时是两者的值 → never。
// 这是数学上的"交集为空"在类型系统中的表现。
//
// 【对比 Rust】：Rust 没有交叉类型。
//   你需要 trait 组合：`T: TraitA + TraitB`，trait 的方法签名不同名所以不冲突
//   如果两个 trait 有同名方法，编译器会报歧义错误——而不是隐式合并
//
// 【对比 Kotlin】：Kotlin 没有交叉类型。
//   与 Rust 类似，接口组合 `interface C : A, B` 如果有冲突方法会报错
//
// 【对比 C++】：多重继承 `class C : public A, public B`
//   同名成员会引发歧义（需要 `A::member` 或 `B::member` 消歧义）
//   不会隐式地把两个类型合并成一个不可能的类型
//
// 【对比 Java】：Java 接口的多重继承 `interface C extends A, B`
//   同名方法如果返回类型兼容则合并，否则编译错误（不是 never）

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：使用不同的属性名（设计阶段避免冲突）
interface ConfigA {
  stringValue: string;
  name: string;
}

interface ConfigB {
  numberValue: number;
  id: number;
}

type SafeMerged = ConfigA & ConfigB;
// { stringValue: string; name: string; numberValue: number; id: number }
// ✅ 没有冲突，可以正常使用

// ✅ 方案 2：如果需要同名不同含义，用品牌类型区分
type Brand<T, B extends string> = T & { __brand: B };
type EmailString = Brand<string, "Email">;
type UserNameString = Brand<string, "UserName">;

interface WithEmail {
  value: EmailString;
}
interface WithUserName {
  value: UserNameString;
}
// 即使用了品牌类型，交叉后 value 仍然是 EmailString & UserNameString
// EmailString 展开是 string & { __brand: "Email" }
// UserNameString 展开是 string & { __brand: "UserName" }
// value 类型 = string & { __brand: "Email" } & { __brand: "UserName" }
// 这意味着 value 必须同时有 __brand: "Email" 和 __brand: "UserName"
// 这仍然不可实现！交叉类型不适合同名属性冲突的场景

// ✅ 方案 3：使用联合类型（如果逻辑是"或"而不是"且"）
type Either = HasStringValue | HasNumberValue;
// 用 discriminated union 区分
*/

export {};

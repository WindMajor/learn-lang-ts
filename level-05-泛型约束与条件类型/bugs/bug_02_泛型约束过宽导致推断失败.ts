/**
 * bug_02：泛型约束过宽——T extends string 允许了 string 而不只是字面量
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_02_泛型约束过宽导致推断失败.ts
 *
 * 预期 tsc 错误输出：
 *   error TS2322: Type 'string' is not assignable to type '"north" | "south" | "east" | "west"'.
 */

// ================================================================
// 错误代码：泛型约束太宽，推导出的类型不精确
// ================================================================

type Direction = "north" | "south" | "east" | "west";

// BUG: 约束 T extends string 太宽松
// 函数设计意图是只接受 Direction，但约束只要求了 string
function createMove<T extends string>(direction: T, distance: number): T {
  return direction;
}

// ✅ 字面量参数：T 推断为 "north"（精确！）
const move1 = createMove("north", 10);
// move1 的类型是 "north" ✅

// BUG: 如果传入一个普通的 string 变量
const userInput: string = "north";
const move2 = createMove(userInput, 10);
// move2 的类型是 string ❌ —— 太宽了！
// 你期望 move2 是 Direction（或至少是字面量），但它只是 string

// const invalidMove: Direction = move2;  // ❌ 编译错误！
//   error TS2322: Type 'string' is not assignable to type '"north" | "south" | "east" | "west"'.

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 的泛型推断很"精确"——给定 string 参数，推断出 string 类型参数。
// 当你使用一个变量（类型为 string）而不是字面量时，
// 泛型推断出的 T 是 string，而不是具体的字面量类型。
//
// 这是 TS 泛型推断的天生限制——它在调用点看到什么就是什么。
//
// 【对比 Rust】：
//   fn create_move<T: AsRef<str>>(direction: T) -> T { direction }
//   给定 &str，T 推断为 &str——同样精确。
//   但 Rust 的 trait 约束 + 关联类型可以更精确地描述返回类型。
//
// 【对比 C++】：
//   template<typename T> T create_move(T direction) { return direction; }
//   同样：给定 const char* 参数，T = const char*。
//   但 C++ 可以用模板偏特化或 SFINAE 来区分"字面量"和"变量"。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：用具体类型代替泛型（如果不需要泛型的话）
function createMoveFixed1(direction: Direction, distance: number): Direction {
  return direction;
}
// 简单直接，没有泛型的推断问题

// ✅ 方案 2：在调用点用 as const 或类型断言
const move3 = createMove("north" as const, 10);
// T 推断为 "north" ✅

// ✅ 方案 3：用 satisfies 确保输入是 Direction
const dir = userInput satisfies Direction;
// 但 dir 的类型仍是 string —— 因为 satisfies 不改变推断

// ✅ 方案 4：用重载
function createMoveFixed4(direction: "north", distance: number): "north";
function createMoveFixed4(direction: "south", distance: number): "south";
function createMoveFixed4(direction: "east", distance: number): "east";
function createMoveFixed4(direction: "west", distance: number): "west";
function createMoveFixed4(direction: Direction, distance: number): Direction {
  return direction;
}
// 字面量调用的返回类型精确，string 调用返回 Direction
*/

export {};

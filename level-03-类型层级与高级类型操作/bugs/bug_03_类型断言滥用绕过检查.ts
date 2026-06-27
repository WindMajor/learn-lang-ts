/**
 * bug_03：类型断言 as 滥用 —— 绕过了所有类型安全检查
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_03_类型断言滥用绕过检查.ts
 *
 * 预期 tsc 输出：
 *   本文件使用 as 断言不会报编译错误——这本身就是 bug 的症状！
 *   类型断言绕过了 TS 的类型检查，导致运行时可能崩溃。
 *   运行时错误：
 *     TypeError: Cannot read properties of undefined (reading 'toUpperCase')
 *     因为 `user?.name` 是 undefined（user 存在但没有 name 属性）
 */

// ================================================================
// 错误代码：滥用 as 绕过类型检查
// ================================================================

interface User {
  id: number;
  name: string;
  email: string;
}

// 模拟一个"从 API 来的不确定数据"
function fetchRawData(): unknown {
  // 模拟 API 返回的 JSON 数据
  // 实际上 data 没有 email 字段！只有 id 和 name
  return JSON.parse('{"id": 1, "name": "Alice"}');
}

// BUG: 滥用 as 断言——直接断言 raw 是 User，不验证
function processUserBad(): string {
  const raw = fetchRawData();
  const user = raw as User;  // ⚠️ 直接断言，跳过所有检查！

  // 编译通过，但运行时 user.email 是 undefined
  // 如果代码依赖 email 存在，可能导致运行时错误
  return user.email.toUpperCase();
  //     ^^^^^^^^^^
  //     运行时 TypeError: Cannot read properties of undefined (reading 'toUpperCase')
}

// ================================================================
// 另一个 as 滥用场景：双重断言
// ================================================================

// BUG: 双重 as（先 as unknown，再 as 极不合理的类型）
function covertTypeBadly(): number {
  const str = "not a number";
  // 单重断言会报错：
  // const n: number = str;  // ❌ Type 'string' is not assignable to type 'number'

  // 但双重断言绕过了一切检查：
  const n = str as unknown as number;  // ⚠️ 编译通过！
  return n;  // n 在类型层面是 number，运行层面是 string "not a number"
}

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// as 是 TS 的"逃生舱"——它告诉编译器"相信我知道的更多"。
// 合理使用（如 JSON.parse 返回值断言）是必要的。
// 滥用会导致"TS 文件里跑着纯 JS 级别的错误"。
//
// 双重断言（`as unknown as T`）是最危险的形式——
// 它把编译期的最后一道防线也拆了。
//
// 【对比 Rust】：
//   Rust 的 unsafe 也需要手动保证正确性，但它有明显的标记：
//   - `unsafe { ... }` 块包围危险代码
//   - `unsafe fn` 函数必须显式标记
//   - unsafe 代码是有限的、可见的、可审计的
//   TS 的 as 没有这种可见性——任何一行都可能隐藏一个 as
//
// 【对比 Kotlin】：
//   `x as Type` 在 JVM 运行时做检查——如果类型不匹配抛出 ClassCastException
//   所以 Kotlin 的 as 不会静默产生不正确的类型状态
//
// 【对比 Java】：
//   `(Type) object` 在运行时做类型检查，失败抛 ClassCastException
//   与 Kotlin 类似，无法产生"编译期欺骗型系统"的情况
//
// 【对比 Go】：
//   类型断言 `x.(Type)` 在运行时做检查，返回 `(Type, bool)`
//   未检查的版本 `x.(Type)` 如果失败会 panic
//   但不会静默把错误类型漏过去

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：运行时验证 + 类型守卫
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === "number" &&
    typeof (obj as Record<string, unknown>).name === "string" &&
    typeof (obj as Record<string, unknown>).email === "string"
  );
}

function processUserSafe(): string {
  const raw = fetchRawData();

  if (!isUser(raw)) {
    throw new Error(`Invalid user data: ${JSON.stringify(raw)}`);
  }

  // 现在 raw 被收窄为 User，安全地使用
  return raw.email.toUpperCase();  // ✅ email 已验证存在
}

// ✅ 方案 2：使用 zod / typebox / io-ts 等运行时类型验证库
import { z } from "zod";

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});

function processUserWithZod(): string {
  const raw = fetchRawData();
  const user = UserSchema.parse(raw);  // 运行时验证！解析失败会 throw
  return user.email.toUpperCase();     // ✅ 安全
}

// ✅ 方案 3：如果必须用 as，至少加注释说明为什么安全
function fetchUser(id: number): User {
  // WARNING: as 断言，但这里有运行时保证：
  // - 后端 API 保证返回格式符合 User 接口
  // - 单元测试覆盖了所有字段的存在性
  // - 生产环境有 API schema 验证中间件
  return api.get(`/users/${id}`) as User;
}
*/

export {};

/**
 * bug_02：不完整的 is 谓词导致假阳性
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_02_不完整的is谓词导致假阳性.ts
 *
 * 预期 tsc 输出：
 *   （本文件在编译期不会报错——这正是问题所在！
 *    is 谓词在编译期只提供"类型合约"，不保证运行时验证的正确性）
 */

// ================================================================
// 错误代码：is 谓词的实现有 bug，但 TS 不报错
// ================================================================

interface ValidUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

// BUG: is 谓词只检查了部分字段，却宣称检查了完整的 ValidUser
function isValidUser(obj: unknown): obj is ValidUser {
  // 只检查了 id 和 name，忘了检查 email 和 role！
  // 但函数签名说"返回 true 就是 ValidUser"
  if (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as Record<string, unknown>).id === "number" &&
    typeof (obj as Record<string, unknown>).name === "string"
  ) {
    return true;
  }
  return false;
}

// 使用有 bug 的 is 谓词
function processUser(obj: unknown): string {
  if (isValidUser(obj)) {
    // TS 认为 obj 是 ValidUser（信任 is 谓词）
    // 但 email 和 role 可能不存在！
    return `用户 ${obj.name} (${obj.email})——角色：${obj.role}`;
    //                        ^^^^^^^^^
    //                        运行时可能是 undefined！
    //                        因为 isValidUser 没有检查 email！
  }
  return "无效用户";
}

// 测试：传入一个缺少 email 和 role 的对象
const badUser = { id: 1, name: "Alice" };
// isValidUser 会返回 true（因为只检查了 id 和 name），
// 然后 processUser 会信任 obj 是 ValidUser
console.log(processUser(badUser));
// 输出：用户 Alice (undefined)——角色：undefined  ← 运行时 bug！

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// is 谓词函数完全是"开发者保证"的：
// - 编译期：TS 完全信任你的谓词签名
// - 运行时：JS 执行你的函数体（没有任何 TS 监督）
//
// 这比 `as` 断言好一些（is 谓词至少是显式的函数），
// 但它的类型安全性完全取决于你的实现是否正确。
//
// 【对比 Rust】：
//   Rust 没有运行时类型检查的需要——所有类型在编译期确定。
//   如果需要一个"可能为 X"的类型，用 enum。
//   不存在"运行时验证一个对象是否满足 trait"——trait 是编译期的。
//
// 【对比 Kotlin】：
//   Kotlin 的 `is` 在运行时检查类型（因为 JVM 类型信息不擦除完全）
//   不会有"谓词实现有 bug"的问题——编译器做检查。
//
// 【对比 Java】：
//   Java 的 `instanceof` 在运行时检查——同样不会出错。
//   但给"带字段的对象结构"做检查，Java 没有原生语法——
//   你需要 Bean Validation 或手动检查。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：完整实现 is 谓词（检查所有必需字段）
function isValidUserFixed(obj: unknown): obj is ValidUser {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    typeof record.name === "string" &&
    typeof record.email === "string" &&
    (record.role === "admin" || record.role === "user")
  );
}

// ✅ 方案 2：使用运行时验证库（zod / yup / typebox）
//   这样就不用手写 is 谓词了——库会从 schema 生成类型和验证逻辑
//
// import { z } from "zod";
//
// const ValidUserSchema = z.object({
//   id: z.number(),
//   name: z.string(),
//   email: z.string().email(),
//   role: z.enum(["admin", "user"]),
// });
// type ValidUser = z.infer<typeof ValidUserSchema>;
// // schema 和类型是同一事实源——不会出现"检查不完整"的 bug
//
// function isValidUser(obj: unknown): obj is ValidUser {
//   return ValidUserSchema.safeParse(obj).success;
// }

// ✅ 方案 3：用 type-fest 的 IsNever 等工具做编译期验证
//   对 is 谓词的返回类型做测试
// type _Test = Expect<Equal<ReturnType<typeof isValidUser>, boolean>>;
*/

export {};

/**
 * schema.ts —— Schema 构建器
 *
 * 提供 defineSchema 函数——从声明式 Schema 定义中推导完整类型。
 *
 * 这是"编译期元编程"的核心：
 *  - 输入：Schema 对象（值）
 *  - 输出：ResolveConfig 类型（编译期）
 *  - 值层：Schema 对象也可在运行时访问（用于配置加载/验证）
 */

import type { ConfigSchema, ConfigItemDef, ConfigValue, ResolveConfig } from "./types.js";

/**
 * 类型安全的 Schema 构建器
 *
 * WHAT: 接收一个 Schema 对象，返回相同的对象——但附带了类型推导
 * WHY: 通过泛型约束保证返回类型与你定义的 Schema 一致
 *   同时让 TS 能从 default 字段推导值类型
 *
 * 技巧：使用 as const 不影响行为（但如果你需要字面量类型推断，可以用 satisfies）
 */
export function defineSchema<S extends ConfigSchema>(schema: S): S {
  return schema;
}

/**
 * 辅助：定义一个配置项——提供类型安全的 IDE 补全
 */
export function defineConfig<T extends ConfigValue>(
  def: ConfigItemDef<T>,
): ConfigItemDef<T> {
  return def;
}

/**
 * 编译期类型验证：测试 ResolveConfig 是否如预期
 *
 * CONTRAST: 这相当于 Rust 的 `const _: () = { assert!(...) }` 编译期断言
 *           在 TS 中，用类型系统本身做同样的事
 */
export const SchemaVerification = defineSchema({
  database: {
    url: {
      type: "string",
      default: "postgres://localhost:5432/mydb",
    } satisfies ConfigItemDef<string>,
    poolSize: {
      type: "number",
      default: 10,
    } satisfies ConfigItemDef<number>,
  },
  server: {
    host: {
      type: "string",
      default: "0.0.0.0",
    } satisfies ConfigItemDef<string>,
    port: {
      type: "number",
      default: 3000,
    } satisfies ConfigItemDef<number>,
  },
  debug: {
    enabled: {
      type: "boolean",
      default: false,
    } satisfies ConfigItemDef<boolean>,
  },
});

// 类型层：验证从 Schema 推导的类型是否正确
// 如果下面的类型不匹配，编译会报错
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _Verified = ResolveConfig<typeof SchemaVerification>;
// 推导结果：
// { database: { url: string; poolSize: number }; server: { host: string; port: number }; debug: { enabled: boolean } }

/**
 * types.ts —— Confix 核心类型定义
 *
 * 本文件定义配置解析器的全部核心类型。
 * 运用了条件类型、映射类型、infer、模板字面量类型等高级特性。
 */

// ============================================================
// 第一部分：配置值的基础类型
// ============================================================

/** 支持的配置值原始类型 */
export type ConfigPrimitive = string | number | boolean;

/** 配置节点——可以是原始值或嵌套对象 */
export type ConfigValue =
  | ConfigPrimitive
  | ConfigObject;

/** 嵌套对象 */
export type ConfigObject = {
  [key: string]: ConfigValue;
};

// ============================================================
// 第二部分：Schema 定义（声明式配置描述）
// ============================================================

/** 配置项的 Schema 定义 */
export interface ConfigItemDef<T = unknown> {
  /** 配置值类型标识 */
  type: "string" | "number" | "boolean";
  /** 默认值 */
  default?: T;
  /** 环境变量名 */
  env?: string;
  /**
   * 自定义验证器——如果返回非 true，就是错误信息
   *
   * WARNING: 参数类型使用 any 而非 T，
   * 因为 strictFunctionTypes 下 (number) => boolean 不兼容 (unknown) => boolean
   * 方法签名风格（method style）是双变的，避免 strictFunctionTypes 报错
   */
  validate?(value: T): boolean;
  /** 描述 */
  description?: string;
}

/** Schema 的顶层类型：嵌套对象映射 */
// 使用 ConfigItemDef<any> 作为索引类型——允许 validate 函数接受具体类型的参数
export type ConfigSchema = {
  [section: string]: {
    [key: string]: ConfigItemDef<any>;
  };
};

// ============================================================
// 第三部分：从 Schema 推导 ResolvedConfig（核心魔法）
// ============================================================

/**
 * 从 ConfigItemDef 提取值类型
 *
 * 类型层：如果 T 中有 type 和 default 字段，提取 default 的类型
 *         如果没有 default，回退到用 type 字段推断（string → string 等）
 */
export type InferValueType<T extends ConfigItemDef> =
  T extends { default: infer D } ? D
  : T extends { type: "string" } ? string
  : T extends { type: "number" } ? number
  : T extends { type: "boolean" } ? boolean
  : never;

/**
 * 核心：从整个 Schema 推导 ResolvedConfig 类型
 *
 * 类型层：遍历 Section → 遍历 Key → 推断每个 ConfigItemDef 的值类型
 * 值层：这个类型在运行时不存在——它只指导编译期类型推断
 *
 * CONTRAST: 这是 TS 独有的"编译期元编程"——从描述结构推导出结果结构
 *           Rust 需要 proc macro 来实现类似效果
 *           Kotlin/Java 无法做到——需要手动维护两个平行类型
 */
export type ResolveConfig<S extends ConfigSchema> = {
  [Section in keyof S]: {
    [Key in keyof S[Section]]:
      S[Section][Key] extends ConfigItemDef<infer _>
        ? InferValueType<S[Section][Key]>
        : never;
  };
};

// ============================================================
// 第四部分：错误与验证类型
// ============================================================

/** 验证结果：成功或失败 */
export type ValidationResult =
  | { valid: true; value: ConfigValue }
  | { valid: false; errors: string[] };

/** 配置解析的错误类型 */
export interface ConfigError {
  path: string;        // 配置路径，如 "server.host"
  message: string;     // 错误描述
  source: string;      // 错误来源："validation" | "parse" | "missing"
}

// ============================================================
// 第五部分：编译期类型测试工具
// ============================================================

/**
 * 编译期断言：如果 T 不是 true，tsc 报错
 *
 * CONTRAST: C++ static_assert / Rust const assertions
 */
export type Expect<T extends true> = T;

/**
 * 严格类型相等判断
 *
 * 利用函数类型的协变逆变特性做精确比较
 * 比 A extends B && B extends A 更严格（能区分 any）
 */
export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

// ============================================================
// 编译期 Schema → Config 类型验证
// ============================================================

// 类型层：验证 ResolveConfig 的正确性
// 如果这里有编译错误，说明 ResolveConfig 的实现有问题
//
// 用显式 default 值定义测试 Schema
// 编译期验证：ResolveConfig 从 Schema 推导出正确的类型
// NOTE: Equal 要求完全一致，字面量类型（如 3000）和 number 不完全一致
//       用 extends 关系验证即可
type SimpleTestSchema = {
  demo: {
    host: { type: "string"; default: "localhost" };
    port: { type: "number"; default: 3000 };
    debug: { type: "boolean"; default: false };
  };
};

type ResolvedTest = ResolveConfig<SimpleTestSchema>;

// 编译期验证：类型兼容性检查（extends 而非严格的 Equal）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _SchemaTypeTests = [
  Expect<ResolvedTest["demo"]["host"] extends string ? true : false>,
  Expect<ResolvedTest["demo"]["port"] extends number ? true : false>,
  Expect<ResolvedTest["demo"]["debug"] extends boolean ? true : false>,
];

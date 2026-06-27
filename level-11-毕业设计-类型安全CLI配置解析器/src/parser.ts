/**
 * parser.ts —— 配置解析引擎
 *
 * 核心逻辑：遍历 Schema + 源数据 → 解析 + 验证 → 返回类型安全的配置对象
 *
 * 运行：此模块是值层逻辑（运行时执行），类型推导在编译期完成
 */

import type { ConfigSchema, ConfigItemDef, ResolveConfig, ConfigError } from "./types.js";
import { formatErrors } from "./errors.js";
import { validateValue } from "./validators.js";

// ============================================================
// 类型守卫：判断是否为嵌套对象
// ============================================================

/**
 * 类型守卫：判断 ConfigItemDef 或嵌套 Schema
 *
 * WHAT: 自定义类型谓词帮助 TS 区分"叶子节点"和"分支节点"
 * WHY: Schema 的顶层是 section 对象，section 下是 key → ConfigItemDef
 *       我们需要类型守卫来正确分派
 */
function isConfigItemDef(obj: unknown): obj is ConfigItemDef {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "type" in obj &&
    typeof (obj as ConfigItemDef).type === "string" &&
    ["string", "number", "boolean"].includes((obj as ConfigItemDef).type)
  );
}

// ============================================================
// 配置解析主函数
// ============================================================

export interface ParseOptions {
  /** CLI 参数列表 */
  cliArgs?: string[];
  /** 配置文件路径 */
  configFile?: string;
}

/**
 * 解析配置 Schema，返回类型安全的配置对象
 *
 * WHAT: 从 Schema 定义 + 多配置源 → 解析出完整的配置对象
 * WHY: 统一配置加载流程，确保所有必填项都被处理
 */
export function parseConfig<S extends ConfigSchema>(
  schema: S,
  options: ParseOptions = {},
): ResolveConfig<S> {
  const errors: ConfigError[] = [];
  const result = {} as Record<string, Record<string, unknown>>;

  // 遍历 Schema 中的每个 section
  for (const [sectionName, sectionDef] of Object.entries(schema)) {
    result[sectionName] = {};

    // 遍历 section 中的每个配置项
    for (const [key, def] of Object.entries(sectionDef)) {
      if (!isConfigItemDef(def)) {
        // 嵌套 Schema？跳过（Confix 目前只支持两层结构）
        continue;
      }

      const path = `${sectionName}.${key}`;
      const rawValue = resolveValue(path, def, options);

      const { value, errors: validationErrors } = validateValue(
        rawValue,
        def,
        path,
      );

      errors.push(...validationErrors);
      result[sectionName][key] = value;
    }
  }

  // 如果有错误，打印并抛出
  if (errors.length > 0) {
    const errorMessage = formatErrors(errors);
    console.error(errorMessage);
    // 在严格模式下，配置错误应该终止程序
    if (errors.some((e) => e.source === "missing")) {
      throw new Error(`配置解析失败：${errors.length} 个错误`);
    }
  }

  // 返回类型安全的配置对象（类型由 ResolveConfig<S> 决定）
  return result as ResolveConfig<S>;
}

/**
 * 解析单个配置项的值
 *
 * 优先级：CLI 参数 > 环境变量 > 配置文件 > 默认值
 */
function resolveValue(
  path: string,
  def: ConfigItemDef,
  options: ParseOptions,
): string | undefined {
  // 1. CLI 参数（最高优先级）
  if (options.cliArgs) {
    const cliValue = extractCliValue(options.cliArgs, path);
    if (cliValue !== undefined) return cliValue;
  }

  // 2. 环境变量
  if (def.env) {
    const envValue = process.env[def.env];
    if (envValue !== undefined) return envValue;
  }

  // 3. 配置文件（简化实现）
  if (options.configFile) {
    // 实际项目中使用 fs.readFileSync 读取 JSON
    // 这里只做演示
  }

  // 4. 默认值——由 validateValue 处理（返回 undefined 时用 default）
  return undefined;
}

/**
 * 从 CLI 参数中提取值
 *
 * 支持格式：
 *   --server.host=localhost
 *   --host=localhost（与 path 的最后一段匹配）
 */
function extractCliValue(args: string[], path: string): string | undefined {
  for (const arg of args) {
    // 精确匹配 section.key=value
    const exactMatch = arg.match(new RegExp(`^--${escapeRegex(path)}=(.+)$`));
    if (exactMatch) return exactMatch[1];

    // 简写匹配（只用 key）
    const keyOnly = path.split(".").pop();
    if (keyOnly) {
      const shortMatch = arg.match(new RegExp(`^--${escapeRegex(keyOnly)}=(.+)$`));
      if (shortMatch) return shortMatch[1];
    }
  }

  return undefined;
}

/** 转义正则特殊字符 */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

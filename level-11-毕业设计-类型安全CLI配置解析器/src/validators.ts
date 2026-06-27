/**
 * validators.ts —— 内置验证器
 */

import type { ConfigItemDef, ConfigError, ConfigValue } from "./types.js";
import { createError } from "./errors.js";

/**
 * 验证单个配置值
 *
 * WHAT: 对配置值进行类型转换 + 自定义验证
 * WHY: Schema 定义的 validate 函数需要运行时执行——这是值层逻辑，不是类型层
 *
 * CONTRAST: TS 的类型注解在编译期检查，但运行时需要手动验证
 *           Kotlin 的 `init` 块 / Java 的 Constructor 验证
 *           Rust 可以用 `new()` 返回 `Result<Self, Error>`
 */
export function validateValue(
  raw: string | undefined,
  def: ConfigItemDef,
  path: string,
): { value: ConfigValue; errors: ConfigError[] } {
  const errors: ConfigError[] = [];

  // 如果值是 undefined 且有默认值，用默认值
  if (raw === undefined) {
    if (def.default !== undefined) {
      return { value: def.default as ConfigValue, errors: [] };
    }
    errors.push(createError(path, "缺少必填配置项", "missing"));
    return { value: "", errors };
  }

  // 类型转换
  let parsed: ConfigValue;
  switch (def.type) {
    case "number": {
      const num = Number(raw);
      if (isNaN(num)) {
        errors.push(createError(path, `"${raw}" 不是有效的数字`, "parse"));
        return { value: 0, errors };
      }
      parsed = num;
      break;
    }
    case "boolean": {
      const lower = raw.toLowerCase();
      if (lower === "true" || lower === "1" || lower === "yes") {
        parsed = true;
      } else if (lower === "false" || lower === "0" || lower === "no") {
        parsed = false;
      } else {
        errors.push(createError(path, `"${raw}" 不是有效的布尔值`, "parse"));
        return { value: false, errors };
      }
      break;
    }
    case "string":
    default:
      parsed = raw;
      break;
  }

  // 自定义验证器——运行时逻辑，类型系统保证验证器签名正确
  if (def.validate && !def.validate(parsed as never)) {
    errors.push(
      createError(path, `"${String(parsed)}" 未通过自定义验证`, "validation"),
    );
  }

  return { value: parsed, errors };
}

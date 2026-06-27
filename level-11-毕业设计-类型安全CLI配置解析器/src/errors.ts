/**
 * errors.ts —— 错误处理
 */

import type { ConfigError } from "./types.js";

/** 创建配置错误 */
export function createError(
  path: string,
  message: string,
  source: ConfigError["source"] = "validation",
): ConfigError {
  return { path, message, source };
}

/** 格式化错误为人类可读的消息 */
export function formatErrors(errors: ConfigError[]): string {
  const lines = errors.map((e) => `  [${e.source}] ${e.path}: ${e.message}`);
  return `配置错误 (${errors.length}):\n${lines.join("\n")}`;
}

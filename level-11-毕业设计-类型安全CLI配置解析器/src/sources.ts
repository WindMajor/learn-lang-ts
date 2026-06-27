/**
 * sources.ts —— 配置源加载
 *
 * 从多个源加载配置值：
 * 1. 默认值（在 Schema 中定义）
 * 2. 配置文件（JSON）
 * 3. 环境变量（process.env）
 * 4. CLI 参数（--key=value 格式）
 */

import type { ConfigSchema } from "./types.js";

/** 配置源：映射 { section.key => raw string value } */
export type ConfigSource = Map<string, string>;

/** 从环境变量加载 */
export function loadEnvSource(schema: ConfigSchema): ConfigSource {
  const source: ConfigSource = new Map();

  for (const [section, keys] of Object.entries(schema)) {
    for (const [key, def] of Object.entries(keys)) {
      const envName = def.env ?? `${section}_${key}`.toUpperCase();
      const envValue = process.env[envName];
      if (envValue !== undefined) {
        source.set(`${section}.${key}`, envValue);
      }
    }
  }

  return source;
}

/** 从 CLI 参数加载（--section.key=value 或 --key=value 格式） */
export function loadCliSource(args: string[]): ConfigSource {
  const source: ConfigSource = new Map();

  for (const arg of args) {
    // 匹配 --section.key=value 或 --key=value
    const match = arg.match(/^--(\S+?)=(.+)$/);
    if (match) {
      source.set(match[1], match[2]);
    }
  }

  return source;
}

/** 从 JSON 文件加载 */
export function loadFileSource(filePath: string): ConfigSource {
  // 简化的实现——生产环境需要用 fs.readFileSync + JSON.parse
  // 这里仅返回空的 source 作为演示
  console.log(`[confix] 将从 ${filePath} 加载配置文件（演示模式）`);
  return new Map();
}

/**
 * 合并多个配置源——按优先级：后来源覆盖前面的源
 *
 * 优先级（从低到高）：
 *   默认值 < 配置文件 < 环境变量 < CLI 参数
 */
export function mergeSources(sources: ConfigSource[]): ConfigSource {
  const merged: ConfigSource = new Map();

  for (const source of sources) {
    for (const [key, value] of source) {
      merged.set(key, value);
    }
  }

  return merged;
}

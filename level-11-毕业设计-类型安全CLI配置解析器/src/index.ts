/**
 * index.ts —— Confix 主入口
 *
 * 运行：npm start
 * 或：npx tsx src/index.ts --port=8080 --debug=true
 */

import { defineSchema } from "./schema.js";
import { parseConfig } from "./parser.js";

// ============================================================
// 第一步：定义 Schema（声明式配置描述）
// ============================================================

const appSchema = defineSchema({
  server: {
    // 类型层：TS 从 default: "localhost" 推导 host 为 string
    // 值层：如果所有源都没提供，用这个默认值
    host: {
      type: "string",           // 类型标识
      default: "localhost",     // 默认值
      env: "APP_HOST",          // 环境变量名
      description: "服务器地址",
    },

    port: {
      type: "number",
      default: 3000,
      env: "APP_PORT",
      description: "服务器端口",
      // 运行时验证：端口范围 [1, 65535]
      validate: (port: number) => port > 0 && port < 65536,
    },
  },

  database: {
    url: {
      type: "string",
      default: "postgres://localhost:5432/confix",
      env: "DATABASE_URL",
      description: "数据库连接 URL",
    },

    poolSize: {
      type: "number",
      default: 10,
      env: "DB_POOL_SIZE",
      // 运行时验证：连接池大小
      validate: (size: number) => size >= 1 && size <= 100,
    },

    ssl: {
      type: "boolean",
      default: false,
      env: "DB_SSL",
      description: "是否启用 SSL",
    },
  },

  logging: {
    level: {
      type: "string",
      default: "info",
      env: "LOG_LEVEL",
      // 运行时验证：合法的日志级别
      validate: (level: string) => ["debug", "info", "warn", "error"].includes(level),
    },

    format: {
      type: "string",
      default: "json",
      env: "LOG_FORMAT",
      // 运行时验证：合法的日志格式
      validate: (fmt: string) => ["json", "text", "pretty"].includes(fmt),
    },
  },

  app: {
    debug: {
      type: "boolean",
      default: false,
      env: "APP_DEBUG",
      description: "调试模式",
    },

    name: {
      type: "string",
      default: "Confix App",
      env: "APP_NAME",
      description: "应用名称",
    },
  },
});

// ============================================================
// 第二步：解析配置
// ============================================================

// 模拟 CLI 参数（实际项目用 process.argv）
const mockArgs = [
  "--server.port=8080",      // 覆盖默认端口
  "--debug=true",             // 简写形式匹配
  "--logLevel=debug",        // 小驼峰简写
];

console.log("=".repeat(60));
console.log("  Confix — 类型安全 CLI 配置解析器");
console.log("=".repeat(60));

try {
  // 类型层：config 的类型自动推导为 ResolveConfig<typeof appSchema>
  // 值层：运行时根据 Schema 和参数解析
  const config = parseConfig(appSchema, { cliArgs: mockArgs });

  console.log("\n📋 解析后的配置：\n");
  console.log(JSON.stringify(config, null, 2));

  // 编译期类型安全：以下代码在编译期验证 config 的结构
  console.log("\n✅ 编译期类型验证通过：");
  console.log(`   server.port 的类型是 number → ${typeof config.server.port}`);
  console.log(`   database.ssl 的类型是 boolean → ${typeof config.database.ssl}`);
  console.log(`   app.name 的类型是 string → ${typeof config.app.name}`);
  console.log(`   logLevel 的类型是 string → ${typeof config.logging.level}`);

  // 演示：类型系统防止误用
  // config.server.port.toUpperCase();  // ❌ 编译错误！number 没有 toUpperCase
  // config.app.debug.toFixed(2);       // ❌ 编译错误！boolean 没有 toFixed
  const port: number = config.server.port;  // ✅ 类型推断正确
  const debug: boolean = config.app.debug;    // ✅ 类型推断正确

  console.log(`\n🎯 服务地址：${config.server.host}:${port}`);
  console.log(`🐛 调试模式：${debug}`);
  console.log(`📊 日志级别：${config.logging.level}`);

} catch (error) {
  console.error("\n❌ 配置解析失败：", (error as Error).message);
  process.exit(1);
}

// ============================================================
// 第三步：运行完成
// ============================================================

console.log("\n🎓 Confix 毕业设计完成！");
console.log("   综合运用：高级泛型、条件类型、映射类型、类型守卫、严格模式、编译期验证");
console.log("   ResolveConfig 将 Schema 自动推导为类型安全的 Config 对象");
console.log("   编译期类型测试在 src/types.ts 中验证 ✅");

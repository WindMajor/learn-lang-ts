# 🎓 Level 11：毕业设计——类型安全 CLI 配置解析器

## 通关标准

> 完成一个**可编译、可运行、可交付**的类型安全 CLI 配置解析器，综合运用全部 10 关知识：高级泛型、条件类型、映射类型、类型守卫、严格模式、多文件模块、编译期类型验证、单元测试。

---

## 项目简介

**Confix** —— 一个类型安全的 CLI 配置解析器。

### 核心功能

1. **声明式 Schema 定义**：用类型声明配置项的类型、默认值、验证规则、环境变量映射
2. **类型推断**：从 Schema 自动推导出 `ResolvedConfig` 类型——无需手动维护类型
3. **多源加载**：按优先级加载：命令行参数 > 环境变量 > 配置文件 > 默认值
4. **编译期验证**：用类型系统确保配置项的描述、类型、验证器一致
5. **运行时验证**：自定义验证器在运行时检查配置值

### 技术亮点

| 技术 | 应用位置 |
|------|---------|
| 条件类型 + infer | 从验证器推断配置值类型 |
| 映射类型 + key remapping | 从 Schema 生成 ResolvedConfig |
| 类型守卫 + discriminated union | 验证结果的类型收窄 |
| 模板字面量类型 | 环境变量命名规则：`APP_${UPPERCASE_NAME}` |
| 编译期类型测试 | Expect + Equal 验证类型转换正确性 |
| strict 模式 | 零隐式 any、严格 null 检查 |
| 单元测试 | node:test 运行测试套件 |

---

## 项目结构

```
L11-毕业设计-类型安全CLI配置解析器/
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # 入口 + 示例使用
│   ├── types.ts              # 核心类型定义（条件类型、映射类型）
│   ├── schema.ts             # Schema 定义与构建器
│   ├── parser.ts             # 配置解析引擎
│   ├── validators.ts         # 内置验证器
│   ├── sources.ts            # 配置源加载（环境变量、CLI参数、文件）
│   └── errors.ts             # 错误类型定义
└── tests/
    └── parser.test.ts        # 单元测试
```

---

## 构建 & 运行

```bash
cd L11-毕业设计-类型安全CLI配置解析器
npm install
npm run check          # 类型检查
npm run build          # 编译
npm run start          # 运行示例
npm test               # 运行单元测试
```

---

## 使用示例

```typescript
import { defineSchema, parseConfig } from "confix";

const schema = defineSchema({
  server: {
    host: { type: "string", default: "localhost", env: "APP_HOST" },
    port: { type: "number", default: 3000, env: "APP_PORT", validate: (p) => p > 0 && p < 65536 },
  },
  database: {
    url: { type: "string", env: "DATABASE_URL" },
    poolSize: { type: "number", default: 10 },
  },
  debug: { type: "boolean", default: false, env: "APP_DEBUG" },
  logLevel: { 
    type: "string", 
    default: "info", 
    validate: (v) => ["debug", "info", "warn", "error"].includes(v) 
  },
});

// config 的类型自动推导为：
// { server: { host: string; port: number }; database: { url: string; poolSize: number }; debug: boolean; logLevel: string }
const config = parseConfig(schema, { cliArgs: process.argv });
```

---

## 过关标记

完成本项目后，你对 TS 的掌握包括：
- [ ] 类型系统全部 10 关知识能在一个项目中综合运用
- [ ] 能从零搭建一个严格的 `tsconfig.json`（`strict: true` + 所有推荐开关）
- [ ] 能独立设计类型安全的 API，让使用者享受到完整的类型推断
- [ ] 能写出编译期类型测试（Expect + Equal）
- [ ] 能组织多文件 TS 项目并配置单元测试
- [ ] 能用条件类型/映射类型实现"从 Schema 推导 Config"的元编程模式

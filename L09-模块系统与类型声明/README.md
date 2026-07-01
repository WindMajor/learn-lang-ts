# Level 09：模块系统与类型声明

## 通关标准

> 能编写 `.d.ts` 声明文件，理解 ESM vs CJS 的类型差异，正确配置路径映射（`paths`/`baseUrl`）。

---

## 核心概念速查

### ESM vs CJS 类型差异

- **ESM**：`import`/`export`，同步/异步，顶层 this 为 undefined
- **CJS**：`require`/`module.exports`，同步，顶层 this 为 module.exports
- **类型差异**：CJS 的 `module.exports =` 没有默认导出——需要 `esModuleInterop` 桥接

### `.d.ts` 声明文件

- **全局类型**：`*.d.ts` 中不包含 `export` 则为全局声明
- **模块类型**：包含 `export` 则为模块声明

### 路径映射

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

---

## 与 Rust / Go / Java 的对比

| 维度 | TS | Rust | Go | Java |
|------|-----|------|-----|------|
| 模块声明 | `export`/`import` | `pub`/`mod`/`use` | `package` + `import` | `package` + `import` |
| 类型声明 | `.d.ts`（手动/自动生成） | 不需要（编译期） | 不需要 | 不需要 |
| 路径别名 | `paths` in tsconfig | `use` as alias | import path alias | 无原生 |

---

## 编译 / 运行

```bash
cd L09-模块系统与类型声明
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能编写完整的 `.d.ts` 文件来声明第三方库的类型
- [ ] 能正确配置 `esModuleInterop` 和 `moduleResolution`
- [ ] 能解释 `paths` 映射与运行时模块解析的配合
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例

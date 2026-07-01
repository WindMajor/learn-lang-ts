# Level 04：类型守卫与类型收窄

## 通关标准

> 能熟练使用所有 5 种类型守卫（`typeof`/`instanceof`/`in`/`is` 自定义谓词/穷尽检查），理解控制流分析（CFA）的限制（闭包陷阱、赋值后收窄失效）。

---

## 核心概念速查

### 5 种类型守卫

1. **`typeof`** — 对 JS 原始类型收窄：`string`/`number`/`boolean`/`symbol`/`undefined`/`object`/`function`/`bigint`
2. **`instanceof`** — 对类实例收窄：`value instanceof Date` → 收窄为 `Date`
3. **`in`** — 检查属性存在性：`"x" in value` → 收窄为含 `x` 的类型
4. **自定义 `is` 谓词** — 用户定义的类型守卫：`function isFish(pet: Pet): pet is Fish`
5. **穷尽检查（`never`）** — 确保 switch 覆盖所有分支：`const _: never = value`

### 控制流分析（CFA）的局限

- TS 基于代码路径分析类型，不是基于"值的可能状态"
- 闭包中的变量可能被修改 → 收窄失效
- 赋值后类型重置为声明类型

---

## 与 Rust / Kotlin / Swift 的对比速查表

| 维度 | TS | Rust | Kotlin | Swift |
|------|-----|------|--------|-------|
| 类型守卫 | `typeof`/`instanceof`/`in`/`is` | `match` 模式匹配 | `when` + `is` 智能转换 | `switch` + `is`/`as?` |
| 穷尽检查 | `never` + `default` 分支 | 编译器自动检查 enum | `sealed class` + `when` 自动 | `enum` + `switch` 自动 |
| 自定义守卫 | `value is Type` 谓词 | 通过 match 提取 | `is` 智能转换不需要自定义守卫 | 类似 Kotlin |
| 闭包中的收窄 | ❌ 可能失效（赋值后） | ✅ 所有权系统阻止 | ✅ 不可变捕获 | ✅ 不可变捕获 |

---

## 编译 / 运行命令

```bash
cd L04-类型守卫与类型收窄
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能手写 5 种类型守卫的完整示例代码（不用 IDE 提示）
- [ ] 能解释为什么闭包中的类型收窄可能失效——以及如何避免
- [ ] 能解释 TS 的控制流分析与 Rust 的 `match` 穷尽检查的根本差异
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例
- [ ] 能向 Kotlin 开发者解释：TS 的 `is` 谓词与 Kotlin 的 `is` 智能转换有什么不同

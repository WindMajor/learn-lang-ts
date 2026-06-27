# Level 03：类型层级与高级类型操作

## 通关标准

> 能手绘 TS 的类型层级图（`never` → 字面量 → 基本类型 → `unknown`），精通联合类型、交叉类型、字面量类型、`as const`、`satisfies` 操作符。

---

## 核心概念速查

### TS 类型层级（Type Hierarchy）

```
            unknown (顶层类型——所有类型的超类型)
           /      \
       object    primitive types (string | number | boolean | symbol | ...)
       /    \       |
  {} .... Record   字面量类型 ("hello" | 42 | true)
       \    /       |
        never (底层类型——所有类型的子类型，最终收窄类型)
```

### 联合类型（Union）vs 交叉类型（Intersection）

- **Union (`|`)**：值可以是 A 或 B（或关系）。只有两个类型**共有的**成员才能安全访问。
- **Intersection (`&`)**：值必须同时满足 A 和 B（且关系）。共用成员取交集，同名属性取交叉。

### `as const` 的冻结语义

```typescript
const arr = [1, 2, 3] as const;
// 类型：[1, 2, 3]（只读元组，不是 number[]）
```

### `satisfies` 操作符（TS 4.9+）

不改变表达式的推断类型，只验证类型是否满足约束。

---

## 与 Rust / Kotlin / Java 的对比速查表

| 维度 | TS | Rust | Kotlin | Java | C++ |
|------|-----|------|--------|------|-----|
| `never` / `Nothing` | `never` — 底层类型，永不返回 | `!` — never type（发散） | `Nothing` — 所有类型的子类型 | 无直接对应（`void` 不同） | `void` — 不同概念 |
| `unknown` / `Any` | `unknown` — 顶层安全类型 | `dyn Any` — 类型擦除后 | `Any` — 所有非空类型的超类型 | `Object` — 近似 | `auto`? 不同概念 |
| 联合类型 | 原生 `A \| B` | `enum`（标签联合） | `sealed class`（密封类） | 无原生支持 | `std::variant` |  
| 交叉类型 | 原生 `A & B` | 无（需 trait 组合） | 接口多继承 | 接口多继承 | 多重继承 |
| 字面量类型 | 原生 `"hello"` / `42` | 无（类型不等于值） | 无（类型不等于值） | 无 | 无（`constexpr` 不同概念） |
| `as const` | 冻结推断为最窄类型 | `const` 声明变量不可变 | `val` + `const`（编译期） | `final` | `const` / `constexpr` |

---

## 编译 / 运行命令

```bash
cd level-03-类型层级与高级类型操作
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能手绘 TS 的类型层级图，并解释 `never extends string` 为什么为 `true`
- [ ] 能用联合类型描述"要么成功要么失败"的返回类型，并正确使用类型收窄
- [ ] 能解释 `as const` 和普通 `const` 的区别，以及何时使用
- [ ] 能解释 `satisfies` 和类型标注（`: type`）的区别
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例

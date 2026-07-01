# Level 02：结构类型系统与名义类型思维

## 通关标准

> 能准确判断两个类型是否"结构兼容"，理解 `private`/`protected` 在结构类型中的特殊行为，能用品牌类型（Branded Type）打破结构兼容性。

---

## 核心概念速查

### 结构类型（Structural Typing）的本质

TS 的类型兼容性基于**形状（Shape）**，而非**名称（Name）**。

```typescript
interface Point { x: number; y: number; }
interface Vector { x: number; y: number; }
// Point 和 Vector 完全兼容！因为它们的"形状"一样。
// 这就是鸭子类型："如果它走起来像鸭子，叫起来像鸭子，它就是鸭子。"
```

### 名义类型 vs 结构类型

| 特性 | 结构类型（TS/Go） | 名义类型（Rust/Kotlin/Java） |
|------|-------------------|---------------------------|
| 兼容性判定 | 基于结构（字段/方法签名） | 基于名称（类型名+声明位置） |
| 同结构不同名 | **兼容！**（大多数情况） | **不兼容！**（必须是同一类型） |
| 防止意外兼容 | 需要品牌类型（Branded Type） | 天然隔离 |
| 接口实现 | 隐式（不需要 `implements`） | 显式（必须声明 `implements`） |

### `private`/`protected` 的结构类型行为

TS 中，`private`/`protected` 修改了结构兼容规则：
- 两个类即使结构相同，如果同名字段 `private` 且来源不同类，则**不兼容**。
- 这是 TS 在结构类型中的唯一"名义"行为。

---

## 与 Rust / Kotlin / Java / Go 的对比速查表

| 维度 | TS | Rust | Kotlin | Java | Go |
|------|-----|------|--------|------|-----|
| 类型系统 | 结构类型 | 名义类型（通过 trait 可获部分结构效果） | 名义类型 | 名义类型 | 隐式接口（结构类型） |
| 接口兼容 | 形状匹配即可 | 必须显式 `impl Trait for Type` | 必须显式 `: Interface` | 必须 `implements Interface` | 方法签名匹配即可 |
| 防止意外兼容 | 品牌类型（Branded Type） | 天然隔离（不同名=不同类型） | 天然隔离 | 天然隔离 | 无（Go 也是结构类型） |
| `private` 行为 | 影响结构兼容性（名义行为） | 纯访问控制，不影响类型兼容 | 纯访问控制 | 纯访问控制 | 小写=包私有（非类型层面） |
| 空接口 | `{}` 或 `Record<string, never>` | `dyn Trait`（需要至少一个方法） | `Any` | `Object` | `interface{}` / `any` |

---

## 编译 / 运行命令

```bash
cd L02-结构类型系统与名义类型思维
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能手写一个品牌类型（Branded Type），阻止两个结构相同但语义不同的类型互相赋值
- [ ] 能解释为什么 TS 选择结构类型（与 JS 的鸭子类型哲学一致），以及它在大型项目中的优缺点
- [ ] 能解释 `private` 修饰符在结构类型中的特殊行为，及其与 Rust 的"封装"的根本差异
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例
- [ ] 能向 Rust 开发者解释：为什么他们的名义类型直觉在 TS 中会导致"意外兼容"，以及如何用品牌类型补救

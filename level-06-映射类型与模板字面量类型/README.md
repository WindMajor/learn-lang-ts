# Level 06：映射类型与模板字面量类型

## 通关标准

> 能手写 `Partial`/`Required`/`Readonly`/`Pick`/`Omit`/`Record` 的实现原理，能用模板字面量类型做字符串层面的类型级操作。

---

## 核心概念速查

### 映射类型基础语法

```typescript
type Mapped<T> = {
  [K in keyof T]: T[K];  // 基础：不变映射
};
```

### keyof / typeof 操作符

- `keyof T` → 取 T 的所有键的联合类型
- `typeof value` → 在类型位置取值的类型（与 JS 的 typeof 不同）

### 内置工具类型实现原理

```typescript
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyOmit<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P] };
type MyRecord<K extends keyof never, V> = { [P in K]: V };
```

### 模板字面量类型

```typescript
type Greeting = `Hello, ${string}!`;  // 模式匹配字符串
type EventNames = `on${Capitalize<string>}`;  // on + 首字母大写
```

---

## 与 Rust / C++ / Kotlin 的对比速查表

| 维度 | TS 映射类型 | Rust 宏 | C++ 模板特化 | Kotlin |
|------|-----------|---------|------------|--------|
| 类型转换 | `{ [K in keyof T]: NewType }` | `macro_rules!` 生成结构体 | 模板偏特化生成类型 | 无直接对应 |
| "使所有字段可选" | `Partial<T>` | 需要 proc macro | SFINAE + `std::optional` | 手动定义 |
| 字符串级类型操作 | 模板字面量类型 | `concat!` 等宏（不是类型） | `consteval` + string | 无 |
| 递归类型 | 有限支持（50 层深度限制） | 无限制（const generic） | 无限制（编译期展开） | 无 |

---

## 编译 / 运行命令

```bash
cd level-06-映射类型与模板字面量类型
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能手写 `Partial`/`Required`/`Readonly`/`Pick`/`Omit`/`Record` 的实现代码
- [ ] 能解释映射类型的 `keyof`、`in`、`-?`（移除可选）、`+readonly` 等修饰符
- [ ] 能写出 `type EventName = \`on${Capitalize&lt;string&gt;}\`` 并解释其用途
- [ ] 能解释 TS 映射类型与 Rust 宏在"编译期代码生成"上的本质差异
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例

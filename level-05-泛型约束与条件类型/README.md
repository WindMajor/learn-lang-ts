# Level 05：泛型、约束与条件类型

## 通关标准

> 能熟练编写泛型约束（`extends`）、条件类型（`T extends U ? X : Y`）、`infer` 推断，理解分配性条件类型的陷阱和解决方案。

---

## 核心概念速查

### 泛型声明 vs 泛型实例化

```typescript
// 声明
function identity<T>(value: T): T { return value; }
// 实例化
const num = identity<number>(42);  // T = number
```

### 条件类型基础

```typescript
type IsString<T> = T extends string ? true : false;
// 分配性：IsString<string | number> = true | false
```

### 分配性条件类型（Distributive Conditional Type）

当 `T` 是裸类型参数时，`T extends U ? X : Y` 会把联合类型的每个成员分开处理：
- `IsString<string | number>` → `(string extends string ? true : false) | (number extends string ? true : false)` → `true | false`

### 抑制分配性

```typescript
type IsString<T> = [T] extends [string] ? true : false;
// [T] 包装阻止了分配
```

---

## 与 Rust / C++ / Java 的对比速查表

| 维度 | TS（擦除） | Rust（单态化） | C++（模板展开） | Java/Kotlin（擦除） |
|------|-----------|---------------|----------------|-------------------|
| 泛型函数 | `fn<T>(x: T): T` | `fn<T>(x: T) -> T` | `template<T> T fn(T x)` | `<T> T fn(T x)` |
| 约束 | `T extends Foo` | `T: Trait` | `requires` (C++20) / SFINAE | `T extends Foo` |
| 条件类型 | ✅ 原生 `X extends Y ? A : B` | ❌ 无直接对应 | ✅ SFINAE / `if constexpr` | ❌ 无 |
| 运行时类型信息 | ❌ 无（擦除） | ✅ 有（单态化） | ✅ 有（模板实例化） | ❌ 无（擦除） |

---

## 编译 / 运行命令

```bash
cd level-05-泛型约束与条件类型
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能手写条件类型的基本三要素：`T extends U ? X : Y`、`infer`、分配性
- [ ] 能解释为什么 `IsString<string | number>` 结果是 `true | false` 而不是 `false`
- [ ] 能写一个条件类型提取数组元素类型 `type ElementOf<T> = T extends (infer E)[] ? E : never`
- [ ] 能解释 TS 泛型（擦除）与 Rust 泛型（单态化）在设计哲学上的差异
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例

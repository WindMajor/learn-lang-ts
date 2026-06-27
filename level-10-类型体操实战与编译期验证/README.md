# Level 10：类型体操实战与编译期验证

## 通关标准

> 能用类型系统实现状态机、管道类型、编译期类型断言（`Expect<Equal<A, B>>`），能在类型层面做复杂计算。

---

## 核心概念

### 编译期类型测试

```typescript
type Expect<T extends true> = T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type _Test = Expect<Equal<SomeType, ExpectedType>>;
```

### 类型层面的"编程"

TS 的类型系统是图灵完备的（在限制内）：
- 条件类型 = if/else
- 映射类型 = map
- 递归类型 = 递归函数
- 模板字面量 = 字符串操作
- 分配性条件 + never = filter

---

## 与 Rust / C++ 的对比

| 维度 | TS 类型体操 | Rust const generics | C++ 模板元编程 |
|------|-----------|-------------------|-------------|
| 表达力 | 图灵完备（有限深度） | 计算能力有限 | 图灵完备 |
| 字符串操作 | ✅ 模板字面量类型 | ❌ 有限（`concat!` 宏） | ✅ `consteval` (C++20) |
| 递归限制 | 50 层 | 编译期常量的自然限制 | 编译器深度限制（~1024） |
| 数值计算 | 有限（通过元组长度） | ✅ `const fn` + const generics | ✅ `constexpr` + 模板 |

---

## 编译 / 运行

```bash
cd level-10-类型体操实战与编译期验证
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能手写 `Expect` 和 `Equal` 类型测试工具
- [ ] 能用类型系统实现简单的状态机（编译期验证状态转换合法性）
- [ ] 能写出一个管道（Pipe）类型——组合多个函数类型
- [ ] 能解释 TS 类型体操的 50 层递归限制及其绕过技巧
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例

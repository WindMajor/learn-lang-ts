# Level 07：函数类型、协变逆变与重载

## 通关标准

> 能准确判断函数赋值规则（参数逆变、返回值协变），理解 `strictFunctionTypes` 的影响，能手写函数重载。

---

## 核心概念速查

### 协变（Covariance）与逆变（Contravariance）

- **协变**：`A extends B` → `Wrapper<A> extends Wrapper<B>`（返回值方向）
- **逆变**：`A extends B` → `Wrapper<B> extends Wrapper<A>`（参数方向）
- **双变（Bivariance）**：两个方向都成立（TS 默认，除非开 `strictFunctionTypes`）

### 记忆口诀

"返回值协变（子 → 父 OK），参数逆变（父 → 子 OK，但 strictFunctionTypes 开启后）。"

---

## 与 Rust / C++ / Kotlin 的对比

| 维度 | TS | Rust | Kotlin | Java |
|------|-----|------|--------|------|
| 函数参数 | 默认双变，strict 后逆变 | 不变（invariant） | 逆变（`in`） | 逆变（`? super`） |
| 返回值 | 协变 | 不变 | 协变（`out`） | 协变（`? extends`） |
| 函数重载 | 声明式（多签名 + 单实现） | 无（trait + impl 不同函数） | 函数重载 | 函数重载 |

---

## 编译 / 运行命令

```bash
cd L07-函数类型协变逆变与重载
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能解释为什么数组是协变的（`Dog[] extends Animal[]`）以及潜在风险
- [ ] 能解释 `strictFunctionTypes` 打开后函数参数的行为变化
- [ ] 能手写一个有 3 个以上重载签名的函数
- [ ] 能用 `this` 参数类型约束函数中的 `this` 上下文
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例

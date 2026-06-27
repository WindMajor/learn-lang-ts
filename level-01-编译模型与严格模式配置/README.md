# Level 01：编译模型与严格模式配置

## 通关标准

> 能独立配置一个"零隐式 any、零空值穿透、启用所有 strict 子开关"的 `tsconfig.json`，并理解 `tsc` 的编译流程（TS → JS + 类型擦除）。

---

## 核心概念速查

### TS 编译流程

```
  .ts 文件
    ↓ tsc 编译
  ① 类型检查（仅编译期，不在运行时）
     - 检查类型错误
     - 如果报错，默认仍会输出 .js（可用 --noEmit 阻止）
  ② 降级转换（Downleveling）
     - TS 语法 → JS 语法（根据 target）
     - 类型注解全部擦除
     - 枚举 → IIFE（或 const enum → 内联）
     - namespace → IIFE
     - 装饰器 → __decorate 辅助函数
  ③ 输出 .js + .d.ts + .js.map
```

### 关键认知

- **类型擦除**：`let x: number = 1` 编译后变成 `let x = 1`。类型仅存在于编译期。
- **编译和类型检查分离**：`tsc` 做了两件事——类型检查和代码转换。这两步是独立的。
- **strict 不是"一个开关"**：`"strict": true` 是 8 个子开关的快捷方式。

---

## 与 Rust / Kotlin / Java 的对比速查表

| 维度 | TypeScript | Rust | Kotlin | Java | C++ | Go |
|------|-----------|------|--------|------|-----|-----|
| 编译模型 | TS → JS（类型擦除） | Rust → 机器码（零成本抽象） | Kotlin → JVM 字节码（类型擦除） | Java → JVM 字节码（类型擦除） | C++ → 机器码（模板展开，非擦除） | Go → 机器码 |
| 类型存在时机 | 仅编译期 | 编译期+运行期（单态化） | 编译期+部分运行期（reified） | 编译期+部分运行期（反射） | 编译期+运行期（模板实例化） | 编译期+运行期 |
| 泛型实现 | 擦除（运行时无类型信息） | 单态化（每个实例化生成新代码） | 擦除 + reified 关键字例外 | 擦除（`List<Integer>` 运行时是 `List`） | 模板展开（代码膨胀） | 单态化（Go 1.18+） |
| 构建工具 | `tsc` / `tsup` / `esbuild` | `cargo` | `gradle` / `maven` | `javac` / `maven` | `g++` / `cmake` | `go build` |
| 严格性控制 | `strict` + 8 个子开关 | 编译器默认严格，无等价开关 | 编译器默认严格 | 编译器默认严格 | 编译器默认严格 | 编译器默认严格 |
| null 安全 | 可选（`strictNullChecks`） | 内置（`Option<T>`） | 内置（`?`） | 无（`Optional` 只是包装类） | 无（原始指针可为 null） | 内置（`nil`） |

---

## 编译 / 运行命令

```bash
cd level-01-编译模型与严格模式配置

# 安装依赖
npm install

# 仅类型检查（不生成 .js）
npx tsc --noEmit

# 编译 + 运行
npx tsc && node dist/main.js

# 或使用 ts-node 直接运行
npx ts-node src/main.ts

# 检查 bugs 目录的错误（用它来学习 tsc 的错误信息）
npx tsc --noEmit --strictNullChecks bugs/bug_02_strictNullChecks关闭导致空值穿透.ts
```

---

## 严格模式子开关速查

| 开关 | 默认（strict: true） | 作用 | 关闭后的风险 |
|------|---------------------|------|-------------|
| `strictNullChecks` | ON | `null`/`undefined` 不是其他类型的子类型 | 所有类型均可为 null，类似 Kotlin 关闭了空安全 |
| `noImplicitAny` | ON | 禁止推断为隐式 `any` | 函数参数无类型标注 → `any`，丢失所有类型安全 |
| `strictFunctionTypes` | ON | 函数参数逆变检查 | 允许不安全的函数赋值（参数类型过于宽松） |
| `strictBindCallApply` | ON | `bind`/`call`/`apply` 类型检查 | `fn.call(wrongThis)` 不报错 |
| `strictPropertyInitialization` | ON | 类属性必须在声明或构造函数中初始化 | 类属性可能为 `undefined` 而不报错 |
| `noImplicitReturns` | OFF | 函数所有分支必须有返回值 | 忘记 `return` 也不报错 |
| `noFallthroughCasesInSwitch` | OFF | switch case 必须 `break` 或 `return` | case 穿透可能导致 bug |
| `noUnusedLocals` | OFF | 禁止未使用的局部变量 | 重构遗留的无效变量 |
| `noUnusedParameters` | OFF | 禁止未使用的参数 | 接口实现中为了签名而忽略的参数 |

---

## 自检清单

- [ ] 能手写出 `tsconfig.json` 的 `strict` 模式包含哪些子开关，以及每个开关的用途
- [ ] 能解释 TS 的"类型擦除"与 Rust 的"单态化"、Java 的"擦除"之间的本质差异
- [ ] 能解释为什么 `strictNullChecks` 是 TS 最重要的一个开关（对比 Kotlin 的 `?`）
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例，并能逐行解读 `tsc` 的错误输出
- [ ] 能向 Java 开发者解释为什么打开 `noImplicitAny` 对代码质量的影响相当于 Java 从不写泛型参数

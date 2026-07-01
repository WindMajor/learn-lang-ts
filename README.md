# learn-lang-ts：TypeScript 高级类型系统闯关项目

> **目标**：从"会写 TS"进化到"精通 TS 类型系统"——深入类型体操、条件类型、协变逆变、编译期元编程。
>
> **适合人群**：资深 TypeScript 使用者，熟悉多语言（Rust / Kotlin / Java / Go / C++），追求原理理解的学习者。
>
> **不教什么**：let / const / if / for / class 基础语法。已经会了，跳过。

---

## 环境准备

```bash
# 确保使用 Node.js 20+
node --version   # >= 20.0.0

# 全局安装 TypeScript（推荐 5.3+）
npm install -g typescript@latest
tsc --version    # >= 5.3.0

# 可选：安装 ts-node 用于直接运行 .ts 文件
npm install -g ts-node
```

---

## 项目结构

```
learn-lang-ts/
├── README.md                          # ← 你在这里
├── L01-编译模型与严格模式配置/
├── L02-结构类型系统与名义类型思维/
├── L03-类型层级与高级类型操作/
├── L04-类型守卫与类型收窄/
├── L05-泛型约束与条件类型/
├── L06-映射类型与模板字面量类型/
├── L07-函数类型协变逆变与重载/
├── L08-类装饰器与元数据/
├── L09-模块系统与类型声明/
├── L10-类型体操实战与编译期验证/
└── L11-毕业设计-类型安全CLI配置解析器/
```

---

## 闯关路线图

| 关卡 | 主题 | 核心技能 | 预计时间 | 衔接已有知识 |
|------|------|---------|---------|-------------|
| 01 | 编译模型与严格模式 | `tsc` 编译流程、`tsconfig.json` 全开关、类型擦除 | 30-45 min | Rust cargo / C++ 编译链接 / Java javac 擦除 |
| 02 | 结构类型系统 | 鸭子类型、可赋值性、品牌类型、`private` 结构行为 | 45-60 min | Rust/Kotlin/Java 名义类型 vs TS 结构类型；Go 隐式接口 |
| 03 | 类型层级与操作 | `unknown/any/never/void`、联合/交叉、字面量、`satisfies` | 45-60 min | Rust `!` never / Kotlin `Nothing` / C++ `void` |
| 04 | 类型守卫与收窄 | `typeof/instanceof/in/is`、控制流分析、穷尽检查 | 45-60 min | Rust `match` 穷尽 / Kotlin 智能转换 / Swift `is/as` |
| 05 | 泛型与条件类型 | 泛型约束、条件类型、`infer`、分配性条件类型 | 60-90 min | Rust 泛型+trait bounds / C++ SFINAE / Java 泛型擦除 |
| 06 | 映射与模板字面量 | `keyof/typeof`、映射类型工具实现、模板字面量类型 | 60-90 min | Rust 宏 / C++ 模板特化 |
| 07 | 函数与协变逆变 | 参数逆变、返回值协变、`strictFunctionTypes`、函数重载 | 45-60 min | Rust `Fn/FnMut/FnOnce` / C++ 重载 / Kotlin 函数类型 |
| 08 | 类与装饰器 | 参数属性、装饰器、反射元数据、抽象类 | 45-60 min | Java/Kotlin 类 / C++ 访问控制 / Python 装饰器 |
| 09 | 模块与类型声明 | ESM/CJS 差异、`.d.ts`、路径映射、全局类型 | 45-60 min | Rust `mod/pub/use` / Go 包 / Java 包 |
| 10 | 类型体操实战 | 状态机类型、管道类型、编译期测试、字符串格式类型 | 60-90 min | Rust const generics / C++ 模板元编程 |
| 11 | 🎓 毕业设计 | 完整 CLI 配置解析器（全部知识点） | 90-120 min | 综合应用，可交付作品 |

---

## 学习原则

### 1. 代码即教程
每个关卡的 `.ts` 文件就是教材。`.md` 文件只做路线说明和速查。

### 2. 能跑才算学会
```bash
# 每个关卡都这样验证
cd level-XX-xxx
npx tsc --noEmit          # 先检查类型是否正确
npx ts-node src/main.ts   # 再运行看到输出
```

### 3. 站在已知看未知
每个新概念都会显式对比 Rust / Kotlin / Java / C++ / Go / Swift / Python 的对应概念。

### 4. 错误是最好的老师
每个关卡都有 `bugs/` 目录，故意写错的代码 + 真实 `tsc` 错误信息 + 修复方案。

---

## 通关标准

完成所有 11 关后，你应该能：

- [ ] 独立编写复杂条件类型、映射类型、模板字面量类型
- [ ] 理解并运用 TS 的协变/逆变规则（包括 `strictFunctionTypes` 的影响）
- [ ] 用类型系统做编译期验证（杜绝运行时错误）
- [ ] 编写可发布的 `.d.ts` 类型声明文件
- [ ] 精确配置 `tsconfig.json` 的每一个开关
- [ ] 向 Rust / Kotlin / Java 开发者清晰解释 TS 类型系统的设计哲学
- [ ] 在脑海中有"类型层"与"值层"的分离直觉

---

## 关于 TS 类型系统最关键的 4 个认知

这 4 点贯穿全部关卡，提前记住：

### 1. 结构类型（Structural Typing）
TS 看的是"形状"，不是"名字"。两个结构相同的类型完全兼容——无论它们是否来自不同模块、不同名称。
> 【对比】Rust / Kotlin / Java：名义类型——类型名称不同就不兼容，即使字段一模一样。

### 2. 类型擦除（Type Erasure）
编译后类型全部消失，运行时是纯 JavaScript。泛型也是擦除的——运行时拿不到类型参数。
> 【对比】Rust：编译期单态化，每个泛型实例化生成独立代码，运行时类型信息完整。
> 【对比】C++：模板在编译期展开（也是代码生成），不是擦除。
> 【对比】Java/Kotlin：同样使用类型擦除，但它们是名义类型。

### 3. 类型层 vs 值层
TS 有一套完整的"类型编程"语法（条件类型、映射类型、模板字面量类型），只在编译期运行。值就是 JavaScript 值。
> 【对比】Rust 的 macro_rules!/proc macro 和 const generics 是 Rust 中最近似"编译期类型计算"的机制。
> 【对比】C++ 的模板元编程（SFINAE, constexpr）是相同概念，但 C++ 模板在编译期生成代码，TS 类型在编译期被擦除。

### 4. 协变逆变（Variance）
TS 数组默认协变（允许风险）、函数参数默认双变（`strictFunctionTypes` 改为逆变）、返回值协变。
> 【对比】Rust：所有类型不变（invariant），除非使用 `PhantomData` 或协变标记。
> 【对比】Kotlin：使用 `in`（逆变）和 `out`（协变）在声明处标记。
> 【对比】Java：使用 `? super T`（逆变）和 `? extends T`（协变）在使用处标记。

---

准备好了？进入第一关：`L01-编译模型与严格模式配置/`

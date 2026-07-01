# Level 08：类、装饰器与元数据

## 通关标准

> 能使用参数属性、访问修饰符、装饰器（含参数装饰器），理解 TS 类的"类型层"与"值层"双重身份。

---

## 核心概念速查

### 类的双重身份

TS 类同时存在于"类型层"和"值层"：
- **类型层**：`class Foo` 可以作为类型（实例类型 + 构造器类型）
- **值层**：`class Foo` 是运行时的构造函数（编译后生成 JS 函数）

### 参数属性（Parameter Properties）

```typescript
class User {
  constructor(
    public name: string,     // 声明 + 赋值
    private password: string,
    readonly id: number,
  ) {}
}
```

### 装饰器类型（TS 5.0+ Decorators）

```typescript
function logged(target: Function, context: ClassMethodDecoratorContext) {
  // ...
}
```

---

## 与 Java / Kotlin / Python 的对比

| 维度 | TS | Kotlin | Java | Python |
|------|-----|--------|------|--------|
| 参数属性 | ✅ `constructor(public x: T)` | ✅ `class Foo(val x: T)` | ❌ 需要手动声明 | ❌ |
| 装饰器 | ✅ 实验性/TS 5.0+ Stage 3 | ❌ 用注解替代 | ❌ 用注解替代 | ✅ 原生装饰器 |
| 抽象类 | ✅ `abstract class` | ✅ `abstract class` | ✅ `abstract class` | ✅ `ABC` |
| 反射 | `reflect-metadata` 库 | `KClass` (受限) | 完整的 Reflection API | `inspect` 模块 |

---

## 编译 / 运行命令

```bash
cd L08-类装饰器与元数据
npm install
npx tsc --noEmit
npx ts-node src/main.ts
```

---

## 自检清单

- [ ] 能手写参数属性语法（`constructor(public x: T)`）并解释其展开效果
- [ ] 能写一个类方法装饰器，用于日志/性能统计/权限检查
- [ ] 能解释 TS 类的"类型层 + 值层"双重身份，以及 `typeof MyClass` 的含义
- [ ] 能解释 TS 抽象类与 Rust trait 的根本差异
- [ ] 能独立修复 `bugs/` 目录下的 3 个错误案例

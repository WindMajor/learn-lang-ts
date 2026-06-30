/**
 * 学习目标：
 * 1. 掌握泛型约束 extends（对标 Rust Trait Bound）
 * 2. 理解条件类型 T extends U ? X : Y
 * 3. 学会 infer 关键字在类型推断中的使用
 * 4. 了解映射类型（Mapped Types）基础
 * 5. 对比 Rust Trait：TS 如何通过 interface + extends 实现多态与约束
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 没有泛型约束（typing.TypeVar 的 bound 参数有限），运行时全靠鸭子类型
 * - Java 的泛型约束用 `T extends SomeClass & SomeInterface`；TS 语法与 Java 几乎一致
 * - Rust 的 `T: Display + Clone`（Trait Bound）与 TS 的 `T extends Display & Clone` 概念高度对应
 * - TS 的条件类型和 infer 是独特的类型级编程特性，Rust 有类似的类型级计算但语法不同
 */

// ==========================================
// 示例 1：泛型约束（Generic Constraints）
// 使用场景：限制泛型参数必须满足某些条件（有某些属性或方法）
// ==========================================

interface Printable {
  print(): void;
}

function printItem<T extends Printable>(item: T): void {
  item.print();
}

class Document implements Printable {
  constructor(private title: string) {}
  print(): void {
    console.log(`Document: ${this.title}`);
  }
}

printItem(new Document('Report'));

// ==========================================
// 示例 2：多个约束条件
// 使用场景：泛型参数需要同时满足多个接口
// ==========================================

interface Serializable {
  serialize(): string;
}

interface Comparable {
  compareTo(other: Comparable): number;
}

function processData<T extends Serializable & Comparable>(item: T): void {
  console.log(item.serialize());
}

class RecordItem implements Serializable, Comparable {
  constructor(public value: number) {}
  serialize(): string {
    return String(this.value);
  }
  compareTo(other: Comparable): number {
    return 0; // 简化实现
  }
}

processData(new RecordItem(42));

// ==========================================
// 示例 3：用 interface + extends 模拟 Trait
// 使用场景：定义行为契约，让多个类共享相同接口
// ==========================================

// 模拟 Rust 的 Iterator trait
interface Iterator<T> {
  next(): T | undefined;
  hasNext(): boolean;
}

class ArrayIterator<T> implements Iterator<T> {
  private index = 0;

  constructor(private items: T[]) {}

  next(): T | undefined {
    return this.items[this.index++];
  }

  hasNext(): boolean {
    return this.index < this.items.length;
  }
}

// 泛型函数接受任何实现 Iterator 的类型
function collectAll<T>(iterator: Iterator<T>): T[] {
  const result: T[] = [];
  while (iterator.hasNext()) {
    const item = iterator.next();
    if (item !== undefined) {
      result.push(item);
    }
  }
  return result;
}

const iter = new ArrayIterator([1, 2, 3]);
console.log(collectAll(iter)); // [1, 2, 3]

// ==========================================
// 示例 4：条件类型（Conditional Types）
// 使用场景：根据类型关系选择不同的类型
// ==========================================
// 这里的 extends 不是传统 OOP 的继承，而是类型系统中的兼容性判断或子类型关系
type IsString<T> = T extends string ? true : false;

type A = IsString<string>; // A是字面量类型true
type B = IsString<number>; // B是字面量类型false

// 实际应用：提取类型中的某部分
type NonNullable<T> = T extends null | undefined ? never : T;

type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // 类型明确是 string

// ==========================================
// 示例 5：infer 关键字 —— 类型推断
// 使用场景：从复杂类型中提取子类型
// ==========================================

// 场景1：提取 Promise 的返回值类型
// T如果是被Promise包裹的类型，那么就从Promise中取出被包裹的类型，作为最终类型。否则就使用原类型T
type PromiseType<T> = T extends Promise<infer R> ? R : T;

type P = PromiseType<Promise<string>>; // string
type Q = PromiseType<number>; // number

// 场景2：提取函数返回类型
// T如果是一个函数类型（包括箭头函数和所有函数类型），那就把箭头函数的返回值作为最终返回值，否则就是never类型（传入了非函数的类型，比如基本类型、对象等）
type ReturnTypeOf<T> = T extends (...args: unknown[]) => infer R ? R : never;
// 在条件类型的 false 分支返回 never，当传入非法类型时，结果类型会被排除（联合类型中自动消失），从而实现类型约束

function greet(): string {
  return 'hello';
}

type GreetReturn = ReturnTypeOf<typeof greet>; // 得到string类型

// 场景3：提取数组元素类型
// T如果是一个数组类型，那就把数组内的元素类型提取出来作为最终的类型，否则就是never类型
type ElementType<T> = T extends (infer E)[] ? E : never;

type NumArr = number[];
type Num = ElementType<NumArr>; // 得到number类型

// ==========================================
// 示例 6：映射类型（Mapped Types）基础
// 使用场景：基于已有类型创建新类型（如将所有属性变为可选/只读）
// ==========================================

interface User {
  name: string;
  age: number;
  email: string;
}

// 将所有属性变为可选
type PartialUser = {
  // K in keyof User 拿到左边的属性名："name" | "age" | "email"
  // User[k] 拿到右边的属性类型 string | number| string
  [K in keyof User]?: User[K];
};

// 将所有属性变为只读
type ReadonlyUser = {
  readonly [K in keyof User]: User[K];
};

const partialUser: PartialUser = { name: 'Alice' }; // age 和 email 可省略
const readonlyUser: ReadonlyUser = { name: 'Bob', age: 30, email: 'b@example.com' };
// readonlyUser.name = "Charlie"; // ❌ 这是编译时的契约，不是运行时的保护机制，对象在运行时依然可以变

// ==========================================
// 示例 7：映射类型 + 条件类型组合
// 使用场景：更复杂的类型转换
// ==========================================

// 提取所有 string 类型的属性名
// 花括号里是映射类型，不是对象
type StringKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];

// 得到一个全部都是string类型的 新的联合类型
type UserStringKeys = StringKeys<User>; // "name" | "email"

// 将 null 属性变为非 null
type NonNullProperties<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

interface NullableUser {
  name: string | null;
  age: number | undefined;
}

type StrictUser = NonNullProperties<NullableUser>;
// { name: string; age: number }

// ==========================================
// 示例 8：keyof 与泛型约束结合
// 使用场景：确保传入的键确实存在于对象中
// ==========================================

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const userObj = { name: 'Alice', age: 30 };
console.log(getProperty(userObj, 'name')); // "Alice"
// getProperty(userObj, "email"); // ❌ 编译错误，email 不在对象中

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error 泛型约束不满足：number 没有 print 方法
printItem(42);

// type BadInfer<T> = infer R; // ❌ infer 只能在 extends 子句中使用

// type BadKeyof = keyof number; // 实际上是合法的，但返回 number 自身的方法名

function requireName<T extends { name: string }>(obj: T): void {
  console.log(obj.name);
}
// @ts-expect-error 对象缺少 name 属性，不满足泛型约束
requireName({ age: 20 });

// ==========================================
// 本章小结
// ==========================================
// 1. 泛型约束 extends 让泛型参数必须满足特定条件，类似 Rust Trait Bound
// 2. 多个约束用 & 连接：T extends A & B
// 3. interface + extends 可模拟 Trait 的行为契约，类 implements 实现多态
// 4. 条件类型 T extends U ? X : Y 是类型级编程的核心工具
// 5. infer 在条件类型中提取子类型，是类型体操的利器
// 6. 映射类型 [K in keyof T] 批量转换属性特性，配合 readonly/? 使用
// 7. keyof + extends keyof 确保键名安全，是 getProperty 等工具函数的基础

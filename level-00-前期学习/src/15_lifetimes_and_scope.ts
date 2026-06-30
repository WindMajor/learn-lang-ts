/**
 * 学习目标：
 * 1. 理解块级作用域与类型系统的交互
 * 2. 掌握类型收窄的作用域传播与失效
 * 3. 了解闭包（Closure）中的类型捕获
 * 4. 对比 Rust 所有权模型：TS 的内存安全由 JS 引擎管理，类型安全由编译器静态检查
 * 5. 掌握 readonly 与浅层不可变性、深层不可变性的实现
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 没有块级作用域（函数作用域），变量在函数内随处可访问；TS 的 let/const 有块级作用域
 * - Java 的对象引用类似 TS，没有所有权概念；GC 管理内存
 * - Rust 有严格的所有权和生命周期系统，编译期管理内存；TS 完全依赖 JS 的 GC，没有所有权概念
 * - TS 的 readonly 只是编译期约束，运行时可被绕过；Rust 的 mut 是编译期保证
 */

// ==========================================
// 示例 1：块级作用域与类型声明
// 使用场景：在块内声明临时变量，避免污染外部命名空间
// ==========================================

function blockScopeDemo(): void {
  const outer = 'outer';

  if (true) {
    const inner = 'inner';
    console.log(outer, inner); // 内层可访问外层
  }

  console.log(outer);
  // console.log(inner); // ❌ inner 在块外不可访问
}

blockScopeDemo();

// ==========================================
// 示例 2：类型收窄的作用域传播
// 使用场景：理解类型收窄只在当前块内有效
// ==========================================

function narrowingScope(value: string | number): void {
  if (typeof value === 'string') {
    console.log(value.toUpperCase()); // 此处 value 是 string
  }

  // 出了 if 块，value 恢复为 string | number
  // value.toUpperCase(); // ❌ 编译错误

  // 需要重新收窄
  if (typeof value === 'string') {
    console.log(value.toLowerCase());
  }
}

narrowingScope('hello');

// ==========================================
// 示例 3：类型收窄的失效场景
// 使用场景：理解何时类型收窄会被编译器「忘记」
// ==========================================

function narrowingPreserved(items: string[] | null): void {
  if (items !== null) {
    console.log(items.length); // 此处 items 是 string[]

    // 直接调用数组方法 .push() 不会使 narrowing 失效，items 仍为 string[]
    items.push('new'); // 可以，因为 items 是数组
    console.log(items.length);
  }
}

narrowingPreserved(['a', 'b']);

// 函数调用可能导致 narrowing 失效的示例
let mutableUnion: string | number = 'hello';

function mightChange(): void {
  mutableUnion = 42;
}

function narrowingInvalidatedAfterCall(): void {
  if (typeof mutableUnion === 'string') {
    const captured = mutableUnion;
    // 调用外部函数后，编译器无法保证 mutableUnion 仍是 string
    mightChange();
    // 此时必须用已捕获的 captured（类型仍为 string），而非 mutableUnion（收窄已失效）
    console.log(captured.toUpperCase());
    console.log(mutableUnion.toUpperCase()); // ❌ 报错！TS 无法保证 mutableUnion 还是 string
  }
}

// ==========================================
// 示例 4：闭包中的类型捕获
// 使用场景：理解闭包如何捕获外部变量的类型
// ==========================================

function createCounter(): () => number {
  // count 本来活不过 createCounter — 函数返回后局部变量就该销毁了。
  // 但返回的内部箭头函数引用了 count — JavaScript引擎发现"有人还惦记着这个变量"
  let count = 0; // 被闭包捕获
  // count存在哪里？存在堆内存（Heap）里的词法环境对象（Lexical Environment）中，而不是栈上。

  // 总结：count 存在堆内存的词法环境对象中，因为闭包（返回的函数）持有它的引用，所以不会被 GC 回收，一直活到没有任何引用指向它为止。
  return (): number => {
    count++;
    return count;
  };
}

const counter = createCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3

// 每次调用 createSeparate() 都在堆上新建一个词法环境对象，所以 c1 和 c2 各有一个独立的 count。
const c1 = createCounter(); // c1 有自己的 [[Environment]]，count 独立
const c2 = createCounter(); // c2 有另一个 [[Environment]]，count 独立

c1(); // 1
c1(); // 2
c2(); // 1  ← c2 用的是自己的 count，从 0 开始

// 与 createCounter 不同，这里闭包捕获的是「对象引用」（数组）
// closure<items>: 内部函数持有 items 数组的引用，push 操作共享同一个数组实例
function createAccumulator<T>(initial: T): (value: T) => T[] {
  // items 数组实例驻留在堆内存的词法环境中，被返回的闭包引用
  const items: T[] = [initial];

  return (value: T): T[] => {
    items.push(value); // 修改被捕获的数组，外部不可见但闭包内共享
    return items; // 每次返回的都是同一个数组引用
  };
}

const acc1 = createAccumulator(10);
const acc2 = createAccumulator(100); // 独立实例，有自己的 items

console.log(acc1(20)); // [10, 20]      ← acc1 的 items
console.log(acc2(200)); // [100, 200]    ← acc2 的 items，完全独立
console.log(acc1(30)); // [10, 20, 30]   ← acc1 不受 acc2 影响
console.log(acc2(300)); // [100, 200, 300] ← acc2 也不受 acc1 影响

// ==========================================
// 示例 5：readonly 与浅层不可变性
// 使用场景：防止引用被重新赋值，但允许修改内部属性
// ==========================================

const readonlyObj = {
  name: 'Alice',
  address: { city: 'Beijing', zip: '100000' },
} as const; // 这种方式所有层级都变成只读，深层也是只读了

// as const 是给字面量用的"既只读又收窄类型，

// readonlyObj.name = "Bob"; // ❌ as const 使所有属性只读
// readonlyObj.address.city = "Shanghai"; // ❌ 深层也是只读的

// 仅顶层 readonly，只给属性name和age加readonly，不能改属性重新赋值，属性如果是对象，对象内的可以改
interface Person {
  readonly name: string;
  readonly age: number;
}

const person: Person = { name: 'Alice', age: 30 };
// person.name = "Bob"; // ❌

// ==========================================
// 示例 6：深层不可变性
// 使用场景：递归地将对象的所有嵌套属性变为只读
// ==========================================

type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// DeepReadonly<T> 是给已有类型做"递归加 readonly"的类型工具

interface NestedData {
  user: {
    profile: {
      name: string;
      settings: {
        theme: string;
      };
    };
  };
}

type ImmutableNested = DeepReadonly<NestedData>;

const immutableData: ImmutableNested = {
  user: {
    profile: {
      name: 'Alice',
      settings: { theme: 'dark' },
    },
  },
};

// immutableData.user.profile.settings.theme = "light"; // ❌ 深层只读

// ==========================================
// 示例 7：冻结对象（运行时可变性）
// 使用场景：在运行时真正阻止对象被修改（但 TS 类型系统不会因此改变）
// ==========================================

const frozen = Object.freeze({ x: 10, y: 20 });
// frozen.x = 100; // 运行时静默失败（strict mode 下报错）

// Object.freeze 返回的类型没有自动变为 readonly，需要配合 as const 或手动标注
const strictlyFrozen = Object.freeze({ a: 1, b: 2 } as const);

// ==========================================
// 示例 8：对比 Rust 所有权模型
// 使用场景：理解 TS 与 Rust 在内存管理上的根本差异
// ==========================================

// TS/JavaScript：GC 管理内存，变量是引用，可以共享
const sharedArray = [1, 2, 3];
const alias = sharedArray;
alias.push(4);
console.log(sharedArray); // [1, 2, 3, 4] —— 两个引用指向同一对象

// Rust 中这不会这样工作：
// let shared = vec![1, 2, 3];
// let alias = shared; // shared 被移动，之后不能再使用
// 与大多数主流语言一样，TS 没有移动语义，所有赋值都是引用拷贝
// 移动语义是 Rust/C++ 特有的，并非主流语言的默认行为

// ==========================================
// 示例 9：const 与不可变性的区别
// 使用场景：理解 const 只保证绑定不可变，不保证值不可变
// ==========================================

const mutableContents = [1, 2, 3];
mutableContents.push(4); // ✅ const 不阻止修改数组内容
console.log(mutableContents);

const mutableObj = { value: 10 };
mutableObj.value = 20; // ✅ const 不阻止修改对象属性
console.log(mutableObj.value);

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

function badScope(): void {
  {
    const blockVar = 'inside';
  }
  // @ts-expect-error 在块级作用域外访问块内变量
  console.log(blockVar);
}

function mutateReadonly(p: Person): void {
  // @ts-expect-error readonly 属性不能重新赋值
  p.age = 31;
}

const fixedArray = [1, 2, 3] as const;
// @ts-expect-error as const 的数组是 readonly，不能调用 push
fixedArray.push(4);

// ==========================================
// 本章小结
// ==========================================
// 1. TS 的块级作用域与 C++/Java/Rust 一致，不同于 Python 的函数作用域
// 2. 类型收窄只在当前控制流块内有效，跨函数调用后可能失效
// 3. 闭包捕获变量的引用，类型信息随引用传播
// 4. TS 没有 Rust 的所有权系统，内存安全由 JS GC 保证；TS 只提供类型安全
// 5. const 保证绑定不可变，readonly 保证属性不可变，但都只是浅层约束
// 6. 深层不可变性可通过递归 Readonly 类型或 Object.freeze 实现
// 7. 所有编译期的 readonly/const 在运行时都可被绕过，不能作为安全边界

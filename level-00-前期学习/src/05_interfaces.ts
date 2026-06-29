/**
 * 学习目标：
 * 1. 掌握 interface 定义对象形状的基本用法
 * 2. 理解可选属性、只读属性、索引签名的作用
 * 3. 学会接口继承（extends）和类实现接口（implements）
 * 4. 了解接口的声明合并（Declaration Merging）特性
 * 5. 能与 Python Dataclass / Java 接口 / Rust Trait 进行对比思考
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 的 dataclass 定义数据结构，没有编译期接口检查；TS 的 interface 是编译期概念
 * - Java 的 interface 定义行为规范，类必须实现所有方法；TS 的 interface 也可以描述对象形状（数据 + 方法）
 * - Rust 的 struct 对应 TS 中「类实现接口后的对象」；Rust 的 trait 更接近 TS 的 interface（定义行为契约）
 * - TS 独有的特性：接口可以声明合并（同名的 interface 会自动合并）
 */

// ==========================================
// 示例 1：基本接口定义
// 使用场景：定义对象必须具有的属性和方法
// ==========================================

interface Person {
  name: string;
  age: number;
}

const alice: Person = {
  name: 'Alice',
  age: 30,
};

console.log(alice);

// ==========================================
// 示例 2：可选属性（Optional Properties）
// 使用场景：某些属性不是每个对象都必须有
// ==========================================

interface Product {
  id: number;
  name: string;
  description?: string; // 可选属性
  price?: number; // 可选属性
}

const book: Product = {
  id: 1,
  name: 'TypeScript 进阶',
};

const laptop: Product = {
  id: 2,
  name: 'MacBook Pro',
  price: 14999,
  description: '高性能笔记本电脑',
};

console.log(book, laptop);

// ==========================================
// 示例 3：只读属性（Readonly Properties）
// 使用场景：创建后不应修改的属性，如 ID、创建时间等
// ==========================================

interface Point {
  readonly x: number;
  readonly y: number;
}

const origin: Point = { x: 0, y: 0 };
// origin.x = 10; // ❌ 不能修改只读属性

// 但只读是浅层的，对象内部的可变属性仍可修改
interface MutableInside {
  readonly coords: number[];
}

const mutable: MutableInside = { coords: [1, 2] };
mutable.coords.push(3); // 可以，因为数组本身是可变的

// 只读的四种组合（从松到严）：
interface Demo {
  a: number[]; // 属性可变，数组可变
  readonly b: number[]; // 属性只读，数组可变
  c: readonly number[]; // 属性可变，数组不可变
  readonly d: readonly number[]; // 属性只读，数组只读 ✅ 等价 as const
}

// ==========================================
// 示例 4：索引签名（Index Signatures）
// 使用场景：对象的键是动态字符串/数字，值是同类型
// 只确定键的类型和值的类型，键名无所谓，你随便加，都算我这个类型。上面的interface都是键名固定的.
// ==========================================

interface StringDictionary {
  [key: string]: string;
}

const translations: StringDictionary = {
  hello: '你好',
  world: '世界',
  goodbye: '再见',
};

console.log(translations.hello);

// 混合索引签名与已知属性
interface MixedDict {
  name: string; // 已知属性
  [key: string]: string | number; // 索引签名需兼容已知属性
}

const mixed: MixedDict = {
  name: 'test',
  age: 25,
  city: 'Beijing',
};

// ==========================================
// 示例 5：接口继承（Interface Inheritance）
// 使用场景：基于已有接口扩展新功能，避免重复定义
// ==========================================

interface Animal {
  name: string;
  move(): void;
}

interface Bird extends Animal {
  wingspan: number;
  fly(): void;
}

const sparrow: Bird = {
  name: 'Sparrow',
  wingspan: 25,
  move() {
    console.log('Jumping');
  },
  fly() {
    console.log('Flying high');
  },
};

sparrow.fly();

// 多继承（一个接口可继承多个接口）
interface CanSwim {
  swim(): void;
}

interface CanFly {
  fly(): void;
}

interface Duck extends Animal, CanSwim, CanFly {}

const duck: Duck = {
  name: 'Donald',
  move() {
    console.log('Waddling');
  },
  swim() {
    console.log('Swimming');
  },
  fly() {
    console.log('Flying');
  },
};

// ==========================================
// 示例 6：类实现接口（Class Implements Interface）
// 使用场景：强制类遵循某种契约，确保实现必要的属性和方法
// ==========================================

interface Logger {
  log(message: string): void;
  error(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[LOG] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

const logger = new ConsoleLogger();
logger.log('System started');

// ==========================================
// 示例 7：接口的声明合并（Declaration Merging）
// 使用场景：扩展第三方库的类型定义，或分散定义大型接口
// ==========================================

interface Window {
  customProperty: string;
}

// 在同文件中再次声明同名接口，会自动合并
interface Window {
  anotherProperty: number;
}

// 注意：实际在浏览器环境中使用 window 需要 declare global
// 这里仅演示接口声明合并的机制
const mockWindow: Window = {
  customProperty: 'hello',
  anotherProperty: 42,
};

console.log(mockWindow);

// ==========================================
// 示例 8：函数类型接口
// 使用场景：用接口描述函数签名，比 type 别名更具扩展性
// ==========================================

interface SearchFunc {
  (source: string, subString: string): boolean;
}

const mySearch: SearchFunc = (source, subString) => {
  return source.includes(subString);
};

console.log(mySearch('hello world', 'world')); // true

// 这是一个调用签名（Call Signature）：接口描述的不是"对象有 xx 方法"，
// 而是"接口本身可以当函数调用"。没有方法名，直接 () 就用。
// 对比 type F = (a: number) => string 也可以，但 interface 可以 extends / 声明合并。
// 类比 Python 的 Callable[[str, str], bool]，Java 的 @FunctionalInterface。

// 对比：普通方法 vs 调用签名
interface NormalSearcher {
  find(source: string, sub: string): boolean;  // 普通方法 → 通过 .find() 调用
}
const s1: NormalSearcher = { find: (a, b) => a.includes(b) };
s1.find('hello', 'lo');  // ✅ 有方法名

// 调用签名的优势：可以声明合并（给函数类型加属性）
interface RichFunc {
  (input: string): string;  // 可调用
  description: string;       // 同时有属性
}
const r: RichFunc = Object.assign(
  (input: string) => input.toUpperCase(),
  { description: '转大写' },
);
console.log(r('hello'));       // 'HELLO'
console.log(r.description);    // '转大写'

// ==========================================
// 示例 9：结构类型系统（Structural Typing）—— TS 的"鸭子类型"
// 使用场景：理解为什么不需要 implements 也能兼容同一个 interface
// TypeScript 的核心设计就是结构类型系统（Structural Typing），本质上就是"静态版的鸭子类型"
// ==========================================
// TypeScript —— 形状对了就行，不需要声明
interface Named {
  name: string;
}

// ✅ 不需要 implements —— 形状匹配就兼容
const dog = { name: '旺财', bark: '汪' };
const cat = { name: '咪咪', color: 'orange' };

const animal1: Named = dog; // ✅ 有 name 就通过
const animal2: Named = cat; // ✅ 有 name 就通过

// 对比 Java：必须显式声明 implements，必须 class Dog implements Named { ... }
// 对比 Python：运行时鸭子类型，跑得通就行，不编译期检查，检查类型，跑的时候有这个属性就行
// TS 的独特位置：编译期的结构检查，不要求显式声明，但又能提前发现错误

interface Point2 {
  x: number;
  y: number;
}

// ✅ 结构类型：不需要 implements，形状匹配就兼容
const p1: Point2 = { x: 0, y: 0 }; // 对象字面量，有 x, y → 通过
class MapPoint {
  x: number = 0;
  y: number = 0;
} // 类没声明 implements Point2

const p2: Point2 = new MapPoint(); // ✅ 有 x, y → 通过 ✅ 形状匹配就通过
// 这里Point2 和 MapPoint 是什么关系？没有声明关系、纯靠形状兼容。没有声明关系！没有继承链！没有显式关系，就像两个陌生人恰好长得很像
// Java: 必须显式声明关系（implements），Java 必须看户口本，TS 只看长相不看户口本

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// @ts-expect-error 缺少必填属性 'age'
const incompletePerson: Person = {
  name: 'Bob',
};

const extraProps: Person = {
  name: 'Charlie',
  age: 25,
  // @ts-expect-error 对象字面量中不能有多余的属性（除非接口有索引签名）
  hobby: 'coding',
};

// @ts-expect-error 只读属性不能重新赋值
origin.x = 100;

// ==========================================
// 本章小结
// ==========================================
// 1. interface 是 TS 中定义对象形状的核心工具，编译后会被擦除
// 2. 可选属性用 ? 标记，只读属性用 readonly 标记
// 3. 索引签名 [key: string]: T 允许动态键的对象，但已知属性必须兼容索引签名类型
// 4. 接口可以 extends 多个父接口，类可以 implements 多个接口
// 5. 声明合并是 TS 独有的特性：同名的 interface 定义会自动合并
// 6. 对比：Python dataclass 侧重数据，Java interface 侧重行为，Rust trait 类似接口但更严格；TS interface 兼具数据形状和行为契约

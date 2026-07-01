/**
 * 学习目标：
 * 1. 掌握 let / const / var 的区别，理解块级作用域与暂时性死区（TDZ）
 * 2. 学会为基本变量添加类型注解：string, number, boolean
 * 3. 理解类型推断机制，知道何时显式注解、何时依赖推断
 * 4. 掌握变量命名规范与解构赋值
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 没有块级作用域（until 3.12+ 的 PEP 695），变量在函数内可随处访问；TS/JS 的 let/const 有块级作用域
 * - Java 的变量声明必须带类型（或 var），且 final 对应 const；TS 的 const 是「引用不可变」，类似 Java final
 * - Rust 的 let 默认不可变（mut 才能变），TS 的 const 也是不可变绑定，但 Rust 有所有权系统，TS 没有
 */

// ==========================================
// 示例 1：let / const / var 的区别
// 使用场景：日常变量声明，优先使用 const，需要重新赋值时用 let
// ==========================================

// const：声明常量，引用不可变，不能再被赋值
const PI: number = 3.14159;
const USER_NAME: string = 'Alice';

// let：声明可变变量，可以再被赋值
let count: number = 0;
count = 1; // OK

// var：函数作用域，存在变量提升，应避免使用
function oldStyle(): void {
  var x = 10;
  if (true) {
    var x = 20; // 同一个变量！
  }
  console.log(x); // 20
}
oldStyle();

// ==========================================
// 示例 2：块级作用域（Block Scoping）
// 使用场景：for 循环、if 块中声明临时变量
// ==========================================

function blockScopeDemo(): void {
  if (true) {
    const blockConst = '只在 if 块内可见';
    let blockLet = 42;
    console.log(blockConst, blockLet);
  }
  // blockConst 和 blockLet 在这里不可访问
}
blockScopeDemo();

// ==========================================
// 示例 3：暂时性死区（Temporal Dead Zone, TDZ）
// 使用场景：不能在声明前访问 let/const 变量
// ==========================================

function temporalDeadZoneDemo(): void {
  // console.log(tdZVar); // ❌ 运行时错误：Cannot access 'tdZVar' before initialization
  const tdZVar = '声明后才能使用';
  console.log(tdZVar);
}
temporalDeadZoneDemo();

// ==========================================
// 示例 4：基本类型注解
// 使用场景：为变量明确指定类型，增强可读性和编译期检查
// ==========================================

const message: string = 'Hello, TypeScript!';
const score: number = 95.5;
const isActive: boolean = true;

// ==========================================
// 示例 5：类型推断机制
// 使用场景：简单初始化时让编译器自动推断类型，减少冗余代码
// ==========================================

const inferredString = 'TypeScript 会推断这是 string 类型'; // 自动推断为 string
const inferredNumber = 100; // 自动推断为 number

// 显式注解 vs 推断的选择原则：
// - 只有简单字面量初始化：依赖推断
// - 函数参数、返回值：显式注解
// - 复杂类型或意图不明确时：显式注解

// ==========================================
// 示例 6：变量命名规范
// 使用场景：遵循 TS/JS 社区惯用的 camelCase / UPPER_SNAKE_CASE 规范
// ==========================================

const MAX_RETRY_COUNT = 3; // 常量使用大写下划线
let currentUserName = 'Bob'; // 普通变量使用小驼峰
const isUserLoggedIn = true; // 布尔值用 is/has/should 前缀

// ==========================================
// 示例 7：解构赋值（数组/元组解构）
// 使用场景：从 数组/元组 中提取多个值，交换变量
// ==========================================

// [number, number]是元组类型注解，[10, 20]是数组字面量（值），最终coordinates是元组类型
const coordinates: [number, number] = [10, 20];

// 把元组解构赋值给变量
const [x, y] = coordinates;
console.log(x, y); // 10 20

// 解构时可以带默认值
const [first, second = 0] = [100];
console.log(first, second); // 100 0

// ==========================================
// 示例 8：解构赋值（对象解构）
// 使用场景：从对象中提取属性，函数参数解构
// ==========================================

// person的类型是匿名内联对象类型，花括号及其内容是对象字面量
const person = { name: 'Alice', age: 30, city: 'Beijing' };

// 对象解构，可以带默认值
const { name: personName, age, city = 'Unknown' } = person;
console.log(personName, age, city); // Alice 30 Beijing

// 函数参数中使用解构，直接把对象的属性都解构出来
function printUser({ name, age }: { name: string; age: number }): void {
  console.log(`${name} is ${age} years old`); // Tom is 25 years old
}
printUser({ name: 'Tom', age: 25 });

// ==========================================
// 示例 9：嵌套解构
// 使用场景：处理嵌套数据结构
// ==========================================

// nestedData的类型是匿名内联对象类型，花括号及其内容是对象字面量
const nestedData = {
  user: {
    id: 1,
    profile: {
      email: 'alice@example.com',
    },
  },
};

// 解构出 2 个变量：id 和 email
const {
  user: {
    id,
    profile: { email },
  },
} = nestedData;
// user: 和 profile: 是解构路径，不是变量声明，只有最终的 id 和 email 才是真正的变量
// 解构后，你不能访问 user 或 profile 变量（它们根本不存在）

console.log(id, email); // 1 alice@example.com

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// const 声明的变量不能重新赋值 TypeError: Assignment to constant variable.
// PI = 3.14;

function hoistingDemo(): void {
  // @ts-expect-error 在声明前访问 let 变量是错误（暂时性死区 TDZ）
  console.log(hoistedLet); // ReferenceError: Cannot access 'hoistedLet' before initialization
  let hoistedLet = 5;
}
hoistingDemo();

let strictNumber: number = 42;
// @ts-expect-error 类型 'string' 不能赋值给类型 'number'。但执行起来不报错，TypeScript 类型错误只在编译时检查，运行时 JavaScript 根本不关心类型
strictNumber = 'not a number';
console.log(strictNumber); // not a number

// ==========================================
// 本章小结
// ==========================================
// 1. 优先使用 const，需要重新赋值时使用 let，避免使用 var
// 2. TypeScript 的块级作用域与大多数现代语言一致（Java/Rust/C++ 都有）
// 3. let/const 存在暂时性死区（TDZ），声明前访问会报错。对比：var声明被提升并初始化为 undefined，提前访问不报错
// 4. 简单初始化可依赖类型推断，复杂场景显式注解更清晰
// 5. 解构赋值能大幅简化从数组/对象中提取数据的代码

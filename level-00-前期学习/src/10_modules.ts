/**
 * 学习目标：
 * 1. 掌握 ES Modules 的 import/export、default export、named export、export *
 * 2. 了解命名空间 namespace 的使用场景与局限
 * 3. 学会 import type 类型导入与隔离
 * 4. 理解动态导入 import() 的返回类型 Promise<T>
 * 5. 了解路径别名 paths / baseUrl 配置
 * 6. 掌握 declare module 扩展第三方模块类型
 *
 * 与 Python/Java/Rust 的对比提示：
 * - Python 用 import/from，没有默认导出的概念；每个 .py 文件是一个模块
 * - Java 的包（package）和 import 与 TS 的模块系统概念类似
 * - Rust 的 mod/use 与 TS 的 export/import 非常相似；Rust 的 crate 对应 TS 的 npm 包
 * - TS 的 namespace 已不推荐使用，现代项目完全可用 ES Modules 替代
 */

// ==========================================
// 示例 1：Named Export（命名导出）
// 使用场景：一个模块导出多个值，调用方按需导入
// ==========================================

export const MODULE_VERSION = '1.0.0'; // ✅ 合法，因为这是标准的命名导出
// export default const x = 1 ❌ 不合法，因为 default 后面不能跟 const/let/var 变量声明。
// 注意：export default function foo() {} 和 export default class Foo {} 是合法的。

export function add(a: number, b: number): number {
  return a + b;
}
// 函数和类前面加 default 是合法的：
// export default function add(a: number, b: number): number {
//   return a + b;
// }

export class Calculator {
  private value = 0;
  increment(): number {
    this.value++;
    return this.value;
  }
}

// ==========================================
// 示例 2：Default Export（默认导出）
// 使用场景：一个模块主要导出单个类/函数/对象
// ==========================================

const defaultConfig = {
  apiEndpoint: 'https://api.example.com',
  timeout: 5000,
};

export default defaultConfig;

// ==========================================
// 示例 3：重新导出（Re-export）
// 使用场景：在一个入口文件中聚合多个模块的导出
// ==========================================

// 从其他模块重新导出（以下为示意，实际需存在对应文件）
// export { add } from "./math.js";
// export * as utils from "./utils.js";

// 条件导出（TS 4.7+）
// export { type MyType } from "./types.js";

// ==========================================
// 示例 4：import type（类型导入）
// 使用场景：仅在类型层面使用导入的值，不生成运行时代码
// ==========================================

// 在当前项目中，由于 verbatimModuleSyntax: true，类型导入必须用 import type
// 以下为示意代码（因为不能自导入，所以用注释展示）

// import type { SomeInterface } from "./some-module.js";
// import { type SomeType, someValue } from "./some-module.js";

// type 导入在编译后会被完全擦除，不产生运行时依赖
// value 导入会保留，生成实际的 require/import 语句

// ==========================================
// 示例 5：动态导入 import()
// 使用场景：按需加载模块，减少初始包体积
// ==========================================

async function loadModuleDynamically(): Promise<void> {
  // 动态导入返回 Promise<T>
  const module = await import('./01_variables.js');
  console.log(module);
}

// 条件动态导入
async function loadOnDemand(condition: boolean): Promise<void> {
  if (condition) {
    // 01_variables.ts 没有导出 add，此处仅演示动态导入语法
    const module = await import('./20_comprehensive.js');
    console.log(module.ok);
  }
}

// ==========================================
// 示例 6：命名空间 namespace（了解即可，不推荐新项目使用）
// 使用场景：组织全局代码，在 ES Modules 普及前广泛使用
// ==========================================

namespace Geometry {
  export interface Point {
    x: number;
    y: number;
  }

  export function distance(p1: Point, p2: Point): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }
}

const p1: Geometry.Point = { x: 0, y: 0 };
const p2: Geometry.Point = { x: 3, y: 4 };
console.log(Geometry.distance(p1, p2)); // 5

// ⚠️ 现代 TS 项目推荐使用 ES Modules + 文件组织来替代 namespace

// ------------------------------------------
// 替代方案示例：用 ES Modules 重构上面的 namespace
// ------------------------------------------

// 文件: src/geometry/point.ts
// export interface Point {
//   x: number;
//   y: number;
// }

// 文件: src/geometry/distance.ts
// import { Point } from "./point.js";
// export function distance(p1: Point, p2: Point): number {
//   return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
// }

// 文件: src/geometry/index.ts（入口文件，聚合导出）
// export { Point } from "./point.js";
// export { distance } from "./distance.js";

// 使用方：
// import { Point, distance } from "./geometry/index.js";
// const p1: Point = { x: 0, y: 0 };
// const p2: Point = { x: 3, y: 4 };
// console.log(distance(p1, p2)); // 5

// 优势：
// 1. 每个文件职责单一，便于代码分割和 tree-shaking
// 2. 天然支持按需导入，不会把不需要的内容打包进来
// 3. 更符合现代前端工程化（Webpack/Vite/Rollup/Node.js ESM）习惯

// ==========================================
// 示例 7：路径别名（paths / baseUrl）
// 使用场景：避免深层相对路径 ../../../ 的导入地狱
// ==========================================

// tsconfig.json 中配置：
// {
//   "compilerOptions": {
//     "baseUrl": ".",
//     "paths": {
//       "@src/*": ["src/*"],
//       "@utils/*": ["src/utils/*"]
//     }
//   }
// }

// 使用路径别名的导入：
// import { helper } from "@utils/helper.js";

// ==========================================
// 示例 8：declare module 扩展第三方模块
// 使用场景：为没有类型定义的 JS 库补充类型，或扩展现有模块
// ==========================================

// 声明全局变量（非模块系统）
declare const GLOBAL_CONFIG: {
  env: string;
  debug: boolean;
};

// ==========================================
// 示例 9：模块的副作用导入
// 使用场景：导入只为执行副作用（如注册插件、加载 CSS）
// ==========================================

// 副作用导入的特点是：只执行模块里的代码，不接收任何导出值。
// 常用于初始化、注册、补丁、样式注入等场景。

// 1. 加载 polyfill（补丁）
// import "./polyfill.js";

// 2. 加载全局 CSS / SCSS（前端框架常见）
// import "tailwindcss";
// import "./styles/global.css";
// import "element-plus/dist/index.css";

// 3. 注册第三方库插件
// import "dayjs/locale/zh-cn"; // 注册中文语言包
// import "chart.js/auto";       // 注册 Chart.js 所有内置控制器

// 4. 注册 Vue / React 组件库
// import { createApp } from "vue";
// import ElementPlus from "element-plus";
// import "element-plus/dist/index.css"; // 样式就是纯副作用导入
// const app = createApp(App);
// app.use(ElementPlus);

// 5. 模块增强（module augmentation）
// 比如给 Vue 组件实例添加全局属性：
// import "./augmentation.js";
// 该文件内部可能写了：
// declare module "vue" {
//   interface ComponentCustomProperties {
//     $http: typeof axios;
//   }
// }

// 6. 初始化/挂载全局对象
// import "./sentry.js";   // 初始化错误监控
// import "./analytics.js"; // 初始化埋点

// 注意：副作用导入写在哪里，代码就大致在哪里执行。
// 打包工具（Webpack/Vite/Rollup）会根据它做 tree-shaking 的边界判断，
// 通常不会被删除，因为它“可能有副作用”。

// ==========================================
// 错误示例（故意编写，展示常见错误）
// ==========================================

// export default const x = 1; // ❌ 不能混合使用 default export 和 const
// 正确写法：const x = 1; export default x;

// import { Calculator } from "./10_modules.js"; // ❌ 若仅用于类型，应使用 import type

// 解释：Calculator 在本文件第 28 行被 export class Calculator 声明。
// 如果在另一个文件里只是拿它当类型用（例如声明变量类型、函数参数类型），
// 却写成普通 import，编译器会保留这条运行时依赖。
// 在开启 "verbatimModuleSyntax": true 时，TS 会强制要求你区分清楚。

// ✅ 仅用于类型时：
// import type { Calculator } from "./10_modules.js";
// const calc: Calculator = { add: (a, b) => a + b }; // 只当类型用

// ✅ 需要当作类实例化时：
// import { Calculator } from "./10_modules.js";
// const calc = new Calculator(); // 运行时真的需要这个类

// ❌ 错误：动态导入返回 Promise，缺少 await 直接解构
// const { add } = import("./01_variables.js");
// 运行时结果：add === undefined（解构的是 Promise 对象，不是模块导出）

// ✅ 正确写法：
// const { add } = await import("./01_variables.js");
// 或
// import("./01_variables.js").then(({ add }) => { ... });

// ==========================================
// 本章小结
// ==========================================
// 1. named export 用于导出多个值，default export 用于导出模块的主功能
// 2. import type 和 export type 在编译期被擦除，verbatimModuleSyntax 要求显式区分
// 3. 动态导入 import() 返回 Promise<T>，适合代码分割和懒加载
// 4. namespace 已过时，新项目应使用 ES Modules + 文件系统组织代码
// 5. paths/baseUrl 配置可大幅简化深层导入路径
// 6. declare module 是扩展第三方库类型的核心工具，.d.ts 文件常用于集中声明

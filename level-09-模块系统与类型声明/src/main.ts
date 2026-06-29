/**
 * Level 09 主代码：模块系统与类型声明
 *
 * 演示：
 * 1. ESM vs CJS 导出/导入语法
 * 2. export type / import type（类型安全的导入）
 * 3. .d.ts 声明文件的编写
 * 4. declare global 全局扩展
 * 5. 路径映射（paths）的概念
 *
 * 运行：npx ts-node src/main.ts
 */

// ========== 第一部分：export/import 语法全解 ==========

function exportImportSyntax() {
  console.log("=== export / import 语法 ===");

  // WHAT: TS 支持 ES Module 的全部导入导出语法
  // WHY: 与 JavaScript 生态完全兼容——TS 只是添加了类型层面的扩展
  // CONTRAST: Rust 的 `mod` / `pub` / `use`：
  //   `mod foo;` 声明子模块（需要 foo.rs 或 foo/mod.rs）
  //   `pub fn bar()` 标记公开
  //   `use crate::foo::bar;` 导入
  //   统一的模块系统——没有两套系统互操作
  // CONTRAST: Go 的包：目录即包，`go.mod` 声明 module path
  // CONTRAST: Java 的包：文件路径对应包名

  // ===== 命名导出（Named Export）=====
  // export const / function / class / interface / type / enum
  // 这些在本文件里，仅供演示

  // ===== 默认导出（Default Export）=====
  // export default function / class / object

  // ===== 导入语法 =====
  // import { named } from './module'
  // import defaultExport from './module'
  // import * as ns from './module'
  // import type { OnlyType } from './module'   (TS 3.8+)
  // import { type Foo, value } from './module'  (TS 5.0+, 内联 type)

  console.log("export / import 语法总结");
  console.log("命名导出: export const/function/class/interface/type");
  console.log("默认导出: export default X");
  console.log("类型导入: import type { X } / import { type X }");
}

// ========== 第二部分：声明文件（.d.ts）==========

// 声明一个"库"的类型——模拟 lodash 的类型声明
// @ts-expect-error: 教学演示——声明不存在的模块，展示 .d.ts 的模式
declare module "imaginary-lodash" {
  export function chunk<T>(array: T[], size: number): T[][];
  export function debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delay: number,
  ): (...args: Parameters<T>) => void;
  export function groupBy<T>(array: T[], iteratee: (item: T) => string): Record<string, T[]>;
}

// 声明全局变量（window 扩展）
declare global {
  interface Window {
    _imaginaryConfig: {
      debug: boolean;
      version: string;
    };
  }
}

function declarationFileDemo() {
  console.log("\n=== 声明文件 (.d.ts) ===");

  // 声明文件的三类声明：

  // 1️⃣ 模块声明（declare module "xxx"）
  //   为没有类型定义的第三方库提供类型
  //   上面已经声明了 "imaginary-lodash"

  // 2️⃣ 全局声明（declare var/let/function）
  //   声明全局变量——不推荐，用模块导入替代
  //   典型场景：global.d.ts 中声明 window 上挂载的属性
  console.log(`全局声明示例：declare const APP_VERSION; // 告诉 TS 有这个全局变量`);

  // 3️⃣ 全局扩展（declare global）
  //   扩展全局类型——如 Window、String
  console.log(`全局扩展 Window 类型 ✅`);

  // CONTRAST: Rust 的 extern crate / extern block
  //   `extern "C" { fn some_c_function(); }` — 声明 FFI 函数
  //   这是为 C ABI 编写的声明，不是为 JS 模块编写的类型
  // CONTRAST: Go 的 cgo 的 .h 文件 — 类似声明
}

// ========== 第三部分：import type vs 普通 import ==========

function importTypeDemo(): void {
  console.log("\n=== import type ===");

  // WHAT: import type 在编译后被完全移除——不留下任何 require/import 语句
  // WHY: 防止"仅用于类型的导入"变成运行时依赖
  //   如果模块在运行时不存在（如 dev dependency），普通 import 会报错
  //   import type 不会——因为它不产生运行时代码

  // 类型层：导入的类型（编译后消失）
  console.log("import type 只导入类型，编译后完全移除");
  console.log("适用于：接口、类型别名、enum（const enum 可以）、泛型参数");

  // CONTRAST: Rust 的 `use` 导入 trait 用于方法调用，运行时正常
  // CONTRAST: Kotlin 导入的类/接口/类型，编译后字节码保留
  // CONTRAST: Java 的 import 只是编译器提示，字节码使用全限定名

  // ===== inline type import (TS 5.0+) =====
  // import { type Foo, type Bar, value } from './module';
  // 更紧凑——值和类型在一行
}

// ========== 第四部分：路径映射概念 ==========

function pathMappingConcept() {
  console.log("\n=== 路径映射（paths）===");

  // 在 tsconfig.json 中配置 paths 后：
  //
  // {
  //   "compilerOptions": {
  //     "baseUrl": ".",
  //     "paths": {
  //       "@utils/*": ["src/utils/*"],
  //       "@components/*": ["src/components/*"]
  //     }
  //   }
  // }
  //
  // 然后可以这样导入：
  // import { helper } from "@utils/helper";
  // import { Button } from "@components/Button";
  //
  // WARNING: tsconfig 的 paths 只影响 TS 编译期解析！
  //          运行时（Node.js）不识别 @utils/ 这样的路径。
  //          需要额外的工具：
  //          - ts-node + tsconfig-paths/register
  //          - tsc-alias 后处理
  //          - module-alias 库
  //          - Node.js subpath imports（package.json 的 "imports" 字段）

  console.log("tsconfig 的 paths 影响编译器，不影响运行时");
  console.log("运行时需要 tsconfig-paths、tsc-alias 或 subpath imports 配合");

  // CONTRAST: Rust 的路径别名
  //   `use utils::helper;` — Cargo.toml 的 [dependencies] 定义路径
  //   编译器同时处理——不存在"编译期和运行期不一致"
  // CONTRAST: Go 的模块替换
  //   go.mod 中 `replace example.com/old => ./local/path`
  //   也由编译器/链接器统一处理
}

// ========== 主入口 ==========

function main(): void {
  exportImportSyntax();
  declarationFileDemo();
  importTypeDemo();
  pathMappingConcept();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：TS 的模块系统是 ES Module 的超集，增加了类型层面的扩展。");
  console.log("declare 是连接 TS 和外部 JS 世界的桥梁。");
  console.log("import type 防止运行时导入仅用于类型的模块。");
  console.log("paths 映射只影响编译器——运行时需要额外工具配合。");
}

main();

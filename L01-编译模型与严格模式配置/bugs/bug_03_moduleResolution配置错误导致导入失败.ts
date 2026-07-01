/**
 * bug_03：esModuleInterop 与模块系统不匹配导致导入失败
 *
 * 这个 bug 展示 TS 模块系统的常见配置陷阱。
 * 它不需要在 tsc 编译中直接复现，更重要的是理解：
 * - 当 `esModuleInterop` 关闭时，`import React from 'react'` 会失败
 * - CommonJS 模块（`module.exports = ...`）和 ESM 模块（`export default ...`）的类型差异
 * - `allowSyntheticDefaultImports` 与 `esModuleInterop` 的区别
 *
 * 编译方式：
 *   npx tsc --noEmit --esModuleInterop false bugs/bug_03_moduleResolution配置错误导致导入失败.ts
 */

// ================================================================
// 场景 1：esModuleInterop 关闭时导入 CommonJS 模块的问题
// ================================================================

// 假设有一个 CommonJS 模块 lodash：
// module.exports = { chunk: function(arr, size) { ... }, debounce: function(fn, delay) { ... } }
//
// 如果使用默认导入（需要合成）：
// import _ from "lodash";  // esModuleInterop: false → ❌ 报错
//   error TS1192: Module '"lodash"' has no default export.
//
// 因为 CommonJS 的 module.exports 不是 ESM 的 export default。
// esModuleInterop: true 会在编译时自动处理这个差异（生成辅助函数 __importDefault）

// ================================================================
// 场景 2：allowSyntheticDefaultImports 与 esModuleInterop 的区别
// ================================================================

// allowSyntheticDefaultImports：仅影响类型检查——允许你在 .ts 中写默认导入
//   但不影响编译输出！如果你只用 allowSyntheticDefaultImports 而不用 esModuleInterop，
//   类型检查通过了，但运行时可能找不到默认导出。
//
// esModuleInterop：同时影响类型检查和编译输出。
//   编译时会生成辅助函数来模拟默认导入行为。
//
// WARNING: 如果你想用 `import X from 'y'` 导入 CommonJS 模块，
//          必须同时开启 esModuleInterop（不仅是 allowSyntheticDefaultImports）

// ================================================================
// 场景 3：moduleResolution 配置错误
// ================================================================

// 如果 tsconfig 中 module: "Node16" 或 "NodeNext"，但你的 import 没有写扩展名：
// import { foo } from "./utils";    // ❌ 某些配置下会报错
// import { foo } from "./utils.js"; // ✅ Node16/NodeNext 要求写 .js 扩展名
//
// 这与 Node.js 的 ESM 规范保持一致。

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 需要兼容两套模块系统：
// 1. ESM（ES Module）：import/export，浏览器和现代 Node.js 原生支持
// 2. CommonJS：require/module.exports，Node.js 传统模块系统
//
// 两套系统互操作时，类型定义和运行时行为需要对齐。
// esModuleInterop 做的就是"允许你用 ESM 语法导入 CJS 模块"。

// 【对比 Rust】：Rust 的 `mod` / `use` 系统是统一的，没有两套系统混用的问题。
//   所有模块通过 `mod.rs` 或同名文件组织，`use` 导入。
//
// 【对比 Go】：Go 的包系统也是统一的。
//   `import "fmt"` 导入路径，包名由包声明决定。
//   不存在"默认导出"和"命名导出"的区别。
//
// 【对比 Java/Kotlin】：Java 的 `package` + `import` 完全基于文件系统路径。
//   Kotlin 的包与 Java 相同。不存在 ES/CJS 互操作。
//
// 【对比 Python】：Python 的 `import` 系统也是统一的（虽然有 `__init__.py` 的变化）。
//   不存在两套系统。

// ================================================================
// 修复方案
// ================================================================

/**
 * ✅ 在 tsconfig.json 中：
 *
 * {
 *   "compilerOptions": {
 *     "esModuleInterop": true,           // 运行时正确处理 CJS 默认导入
 *     "allowSyntheticDefaultImports": true, // 类型层面允许默认导入语法
 *     "module": "Node16",                // 明确模块系统
 *     "moduleResolution": "Node16"       // 与 module 保持一致的解析策略
 *   }
 * }
 *
 * ✅ 导入时：
 * - CJS 模块：`import _ from "lodash";`（esModuleInterop: true 时可用）
 * - CJS 模块：`import * as _ from "lodash";`（esModuleInterop: false 时也必须用这个）
 * - ESM 模块：`import { foo } from "./module.js";`（Node16 需要扩展名）
 */

export {};

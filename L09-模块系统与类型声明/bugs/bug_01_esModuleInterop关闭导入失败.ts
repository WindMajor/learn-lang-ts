/**
 * bug_01：esModuleInterop 关闭时 CJS 模块导入失败
 * 运行：npx tsc --noEmit --esModuleInterop false bugs/bug_01_esModuleInterop关闭导入失败.ts
 *
 * 预期错误：
 *   error TS1192: Module '"fs"' has no default export.
 */
// 如果 esModuleInterop: false:
// import fs from "fs";  // ❌ fs 是 CJS 模块，没有默认导出
// 修复：
// ✅ import * as fs from "fs";
// ✅ 或开启 esModuleInterop: true
export {};

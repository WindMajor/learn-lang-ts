/**
 * bug_02：类型导入变成运行时依赖
 * 运行：npx tsc --noEmit bugs/bug_02_类型导入变成运行时依赖.ts
 *
 * 如果你用普通 import 导入只用于类型的值，编译后会留下 require
 * import { Foo } from "./types";  // Foo 只是 interface 也会被导入!
 *
 * ✅ 修复：import type { Foo } from "./types";
 * ✅ TS 5.0+ 内联: import { type Foo, value } from "./types";
 */
export {};

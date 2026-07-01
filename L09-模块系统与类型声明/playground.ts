/** Level 09 沙盒 */
console.log("=== Level 09 沙盒 ===\n");

// 试试 declare module
declare module "my-lib" {
  export function doThing(x: string): number;
}

// import type 演示（编译后就没了）
import type { EventEmitter } from "node:events";
const emitterType: typeof EventEmitter | null = null;
console.log("import type 不产生运行时代码");
console.log(emitterType);

export {};

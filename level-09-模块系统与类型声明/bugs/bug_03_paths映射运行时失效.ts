/**
 * bug_03：tsconfig paths 在运行时失效
 *
 * tsconfig 中的 paths (@utils/* -> src/utils/*) 只影响 TS 编译器
 * Node.js 运行时不知道 @utils/ 是什么
 *
 * 需要：
 * 1. ts-node: 注册 tsconfig-paths/register
 * 2. tsc 编译后: 用 tsc-alias 替换路径
 * 3. Node.js 原生: package.json imports 字段（Node 12.19+）
 */
export {};

/**
 * Level 05 沙盒文件
 * 实验区：测试泛型、约束、条件类型。
 */

console.log("=== Level 05 沙盒 ===\n");

// 实验 1：试试分配性条件类型——写一个自己的 Exclude/Extract
// 实验 2：试试用 infer 提取 Promise 内部类型（包括多层嵌套）
// 实验 3：试试条件类型的"分配性"——为什么 X | Y 的结果不是整体判断
// 实验 4：试试用 [T] 包装来抑制分配性

// ---------- 实验区 ----------

// 泛型约束示例：只允许有 length 属性的类型
function getLength<T extends { length: number }>(value: T): number {
  return value.length;
}

console.log(`字符串 "hello" 长度: ${getLength("hello")}`);
console.log(`数组 [1,2,3] 长度: ${getLength([1, 2, 3])}`);
// getLength(42);  // ❌ number 没有 length

// infer 提取数组元素类型
type ElementOf<T> = T extends (infer E)[] ? E : never;
// 试试 ElementOf<string[]> 是什么类型？

export {};

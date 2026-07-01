/**
 * Level 06 沙盒文件
 */

console.log("=== Level 06 沙盒 ===\n");

// 实验 1：写一个自己的映射类型——将所有字段值变成 'string'
// 实验 2：用 key remapping（as）把所有键名加上前缀
// 实验 3：试试模板字面量类型的联合——构造 type ColorAndSize = `color-${"red"|"blue"}-size-${"sm"|"lg"}`;
// 实验 4：试试递归映射类型——DeepReadonly

// ---------- 实验区 ----------

// keyof 操作符
interface Vehicle {
  brand: string;
  model: string;
  year: number;
}

// 所有键变成大写——使用 key remapping
type UppercaseVehicle = {
  [K in keyof Vehicle as Uppercase<string & K>]: Vehicle[K];
};

// UppercaseVehicle = { BRAND: string; MODEL: string; YEAR: number }

// 模板字面量类型：生成事件名
type Action = "create" | "update" | "delete";
type Resource = "user" | "post" | "comment";
type EventName = `${Action}${Capitalize<Resource>}`;
// "createUser" | "createPost" | "createComment" | "updateUser" | ...

const event: EventName = "createUser";
console.log(`事件名: ${event}`);

export {};

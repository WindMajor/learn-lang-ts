/**
 * Level 02 沙盒文件
 *
 * 实验区：随意修改，测试结构类型的行为边界。
 * 运行：npx ts-node playground.ts
 */

console.log("=== Level 02 沙盒 ===\n");

// 实验 1：尝试创建两个结构相同但名称不同的类，看看能否互相赋值
// 实验 2：试试给对象添加额外属性，看看什么时候报错、什么时候不报错
// 实验 3：试试品牌类型——创建一个 UserId 品牌，阻止直接用 number 代替
// 实验 4：实验 private 字段的影响——有 private 和没有 private 的类能否互相赋值？

// ---------- 实验区 ----------

interface A { value: number; }
interface B { value: number; }

const a: A = { value: 1 };
const b: B = a; // 试试能不能编译？思考为什么能/不能
console.log(`b.value = ${b.value}`);

// 试试创建一个品牌类型，然后尝试让两个不同品牌的 number 互相赋值
type Brand<T, B extends string> = T & { __brand: B };

type Meters = Brand<number, "Meters">;
type Kilometers = Brand<number, "Kilometers">;

const distanceInMeters = 1000 as Meters;
// 试试：
// const distanceInKilometers: Kilometers = distanceInMeters; // 能编译吗？
console.log(`距离: ${distanceInMeters} 米`);

// 比较 Rust：在 Rust 中，`struct Meters(f64)` 和 `struct Kilometers(f64)` 是不同的类型
// 可以定义 `From<Meters> for Kilometers` 来实现类型转换
// TS 则用品牌类型在类型层面做类似的事情——运行时不区分

export {};

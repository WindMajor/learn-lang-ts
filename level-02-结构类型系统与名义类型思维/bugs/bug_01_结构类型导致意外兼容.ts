/**
 * bug_01：结构类型导致的"意外兼容"——语义不同的类型相互混淆
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_01_结构类型导致意外兼容.ts
 *
 * 本关 tsconfig 的 strict: true 不影响此 bug——这是结构性设计问题，不是开关问题
 *
 * 预期 tsc 输出：
 *   （本文件如果不加品牌类型，tsc 不会报错——这本身就是 bug 的症状！
 *    类型完全兼容，但运行时逻辑是错误的）
 *
 *   如果启用品牌类型修复后：
 *   error TS2345: Argument of type 'Meters' is not assignable to parameter of type 'Feet'.
 *     Type 'Meters' is not assignable to type '{ __brand: "Feet"; }'.
 *     Types of property '__brand' are incompatible.
 *       Type '"Meters"' is not assignable to type '"Feet"'.
 */

// ================================================================
// 错误代码：结构类型导致语义混淆
// ================================================================

// 1️⃣ 定义两个表示不同单位的类型
interface Meters {
  value: number;
}

interface Feet {
  value: number;
}

// 2️⃣ 定义两个接收不同单位的函数
function calculateAreaInSquareMeters(width: Meters, height: Meters): number {
  // 期望输入是米
  return width.value * height.value;
}

function calculateAreaInSquareFeet(width: Feet, height: Feet): number {
  // 期望输入是英尺
  return width.value * height.value;
}

// 3️⃣ BUG 触发区：用英尺的值去调用需要米的函数
// 编译器不会报错！因为 Meters 和 Feet 结构完全相同
const doorWidth: Feet = { value: 3 };   // 3 英尺（约 0.91 米）
const doorHeight: Feet = { value: 7 };  // 7 英尺（约 2.13 米）

// BUG: 把英尺值当米传入——编译通过，但结果差了约 10.76 倍！
const wrongArea = calculateAreaInSquareMeters(doorWidth, doorHeight);
//                  ^^^^^^^^^^^^^^^^^^^^^^^^
//                  参数类型是 Meters，但传入的是 Feet
//                  TS 不报错，因为结构相同！
//                  这在实际项目中可能是灾难性的（如航空航天、医疗）
console.log(`错误计算（英尺当米用）: ${wrongArea} m²`);
console.log(`正确值应该是: ${3 * 0.3048 * 7 * 0.3048} m²`);

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// 结构类型的核心问题：它只看"结构"不看"语义"。
// Meters { value: number } 和 Feet { value: number } 在 TS 眼中完全相同。
//
// 【对比 Rust】：
//   struct Meters(f64);
//   struct Feet(f64);
//   这是两个完全不同的类型！`calculateArea(Meters(3.0))` vs `calculateArea(Feet(3.0))`
//   编译器在语法层面阻止混淆。这是名义类型最核心的优势。
//
// 【对比 Kotlin】：
//   @JvmInline value class Meters(val value: Double)
//   @JvmInline value class Feet(val value: Double)
//   也是两个完全不同的类型！需要显式转换或定义转换函数。
//
// 【对比 Go】：
//   type Meters float64
//   type Feet float64
//   Go 的命名类型也是不兼容的！需要显式类型转换。
//   但 Go 的接口是结构类型的——实现了所有方法就满足接口。
//
// 【对比 C++】：
//   using Meters = double;  // 类型别名，不是新类型——与 TS 类似，没有保护
//   struct Meters { double value; };  // 强类型包装——有保护，但增加了间接访问开销

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：品牌类型（Branded Type）— 推荐
//         编译期保护，运行时零成本

type Brand<T, B extends string> = T & { __brand: B };

type BrandedMeters = Brand<{ value: number }, "Meters">;
type BrandedFeet = Brand<{ value: number }, "Feet">;

function createMeters(value: number): BrandedMeters {
  return { value } as BrandedMeters;
}

function createFeet(value: number): BrandedFeet {
  return { value } as BrandedFeet;
}

function calculateAreaInSquareMetersSafe(width: BrandedMeters, height: BrandedMeters): number {
  return width.value * height.value;
}

const w = createMeters(3);
const h = createMeters(7);
const safe = calculateAreaInSquareMetersSafe(w, h);  // ✅ 编译通过

const f = createFeet(3);
// calculateAreaInSquareMetersSafe(f, h);  // ❌ 编译错误！品牌不匹配

// ✅ 方案 2：使用 opaque type（需要工具库如 type-fest 或手动实现）
//   本质与品牌类型相同，只是通过 symbol 或唯一 key 实现

// ✅ 方案 3：在 Rust 风格的枚举/类包装
//   运行时也有成本，但保证类型安全
class MeterValue {
  constructor(public readonly value: number) {}
  static fromFeet(feet: number): MeterValue {
    return new MeterValue(feet * 0.3048);
  }
}

class FeetValue {
  constructor(public readonly value: number) {}
}

const meters = new MeterValue(3);
const feet = new FeetValue(3);
// calculateAreaInSquareMeters(meters, feet);  // ❌ 编译错误！
// 但这样运行时创建了真正的对象，有内存分配开销
*/

export {};

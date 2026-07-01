/**
 * bug_03：赋值后类型收窄消失 —— 重新赋值导致之前的收窄无效
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_03_赋值后类型收窄消失.ts
 *
 * 预期 tsc 错误输出：
 *   error TS18048: 'value' is possibly 'string'.
 *   或更具体的：
 *   error TS2365: Operator '+' cannot be applied to types 'string | number' and 'number'.
 */

// ================================================================
// 错误代码：赋值后类型收窄消失
// ================================================================

function calculate(value: string | number): number {
  if (typeof value === "number") {
    // value 收窄为 number——你确认了它是数字
    console.log(`value 是数字：${value}`);
    return value * 2; // ✅ 安全
  }

  // 这里 value 是 string（收窄后的另一个分支）
  const parsed = parseInt(value, 10); // ✅ 安全，这里 value 是 string
  console.log(`解析字符串 '${value}' → ${parsed}`);

  // BUG: 重新赋值后，之前的收窄失效
  // value = "another string";  // 赋值后类型回到 string | number
  // TS 不会记住"在哪个分支中 value 被收窄过"

  return parsed * 2;
}

console.log(`calculate(10) = ${calculate(10)}`);
console.log(`calculate("30") = ${calculate("30")}`);

// ================================================================
// 更复杂的赋值后收窄失效
// ================================================================

interface MutableData {
  data: string | null;
}

function processData(obj: MutableData): string {
  if (obj.data !== null) {
    // obj.data 收窄为 string
    const result = obj.data.toUpperCase(); // ✅ 安全

    // 在此块内修改 obj.data
    obj.data = null;  // ⚠️ 修改了字段

    // BUG: TS 仍然认为 obj.data 是 string（记住收窄，不跟踪赋值）
    // 这是 TS 控制流分析的限制
    // return obj.data.toUpperCase(); // 运行时可能 null.toUpperCase()
    return result;  // 用之前保存的值更安全
  }

  return "no data";
}

console.log(processData({ data: "hello" }));

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 的控制流分析是基于"代码位置的静态类型推断"。
// 如果变量被重新赋值，它假设新赋值的类型可能不满足之前的收窄条件。
//
// 但实际上，TS 对"赋值后的收窄"处理不同：
// - 对于 let 变量，赋值后类型回到声明类型
// - 对于 const 变量，不存在重新赋值问题
// - 对于对象属性，TS 的跟踪更加保守
//
// 【对比 Rust】：
//   变量默认不可变（`let`），需要 `let mut` 才能重新赋值。
//   即便可变，类型也不会改变——`let mut x: i32 = 1; x = 2;`，类型始终是 i32。
//   不存在"类型收窄后重新赋值导致类型变化"的问题。
//
// 【对比 Kotlin】：
//   `var` 可以重新赋值，但类型在声明时确定。
//   智能转换（smart cast）在 `var` 上有限制——
//   如果变量可能在检查后被修改，Kotlin 拒绝智能转换。
//   Kotlin 比 TS 更保守，但也更安全。
//
// 【对比 Go】：
//   `:=` 声明后类型固定，不受重新赋值影响。
//   不存在"类型收窄"的概念——interface{} 需要类型断言。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：在赋值之前提取值（保存到新变量）
function calculateFixed(value: string | number): number {
  if (typeof value === "number") {
    return value * 2;
  }

  // 提取到新变量——不受后续赋值影响
  const strValue: string = value;
  const numValue = parseInt(strValue, 10);

  // 后续即使 value 改变，strValue 不变
  // value = 42;  // 不影响 strValue

  return numValue * 2;
}

// ✅ 方案 2：不要重新赋值——使用 const 或新变量
function processDataFixed(obj: MutableData): string {
  if (obj.data !== null) {
    const safeData = obj.data;  // 保存引用
    obj.data = null;            // 修改原来的字段
    return safeData.toUpperCase(); // ✅ 使用保存的引用
  }
  return "no data";
}

// ✅ 方案 3：用 discriminanted union 代替 null 标记
//   这样通过 discriminant 字段收窄，不依赖 null 检查
type DataState =
  | { tag: "loaded"; data: string }
  | { tag: "empty" };

function processDataTagged(state: DataState): string {
  if (state.tag === "loaded") {
    return state.data.toUpperCase(); // ✅ 不受后续修改影响（tag 是 discriminant）
  }
  return "no data";
}
*/

export {};

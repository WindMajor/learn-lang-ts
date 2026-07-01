/**
 * Level 03 沙盒文件
 * 实验区：随意修改，测试类型层级和操作符。
 */

console.log("=== Level 03 沙盒 ===\n");

// 实验 1：试试 as const 对数组的影响
// 实验 2：用 satisfies 替代类型标注，看差别
// 实验 3：尝试交叉类型的冲突——两个相同属性名但类型不同的接口交叉
// 实验 4：Union 联合类型：定义一个同时包含字符串和数字的联合类型
// 实验 5：试试 never 的穷尽检查

// ---------- 实验区 ----------

// 试试 as const 对对象的影响
const frozenColorMap = {
  red: "#FF0000",
  green: "#00FF00",
  blue: "#0000FF",
} as const;

// 试试看 frozenColorMap.red 的类型是什么？
console.log(`red: ${frozenColorMap.red}`);

// 试试这个：联合类型 + 类型收窄
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius * shape.radius;
    case "rectangle":
      return shape.width * shape.height;
  }
}

console.log(`圆形面积: ${area({ kind: "circle", radius: 5 })}`);
console.log(`矩形面积: ${area({ kind: "rectangle", width: 4, height: 6 })}`);

// 试试交叉类型的冲突
interface X { value: string; }
interface Y { value: number; }
// type XY = X & Y;  // value: string & number → never —— 这会导致无法创建值

export {};

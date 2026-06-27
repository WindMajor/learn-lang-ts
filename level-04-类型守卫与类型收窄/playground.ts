/**
 * Level 04 沙盒文件
 * 实验区：测试各种类型守卫和收窄边界。
 */

console.log("=== Level 04 沙盒 ===\n");

// 实验 1：试试自定义 is 谓词——写一个检查"有效数字"的守卫
// 实验 2：试试 never 穷尽检查——添加一个新变体看 tsc 报什么错
// 实验 3：试试闭包中的收窄陷阱——在 setTimeout 中访问可能改变的变量

// ---------- 实验区 ----------

// 尝试闭包陷阱
function demonstrateClosureTrap(): void {
  let value: string | null = "initial";

  if (value !== null) {
    // 这里 TS 知道 value 是 string
    console.log(`初始检查通过：${value}`);

    // 在闭包中捕获 value
    setTimeout(() => {
      // value 在这里的类型是？TS 认为是 string（基于 if 的收窄）
      console.log(`闭包中的值：${value}`);
    }, 500);
  }

  // 在回调执行前修改 value
  value = null;
  console.log("值已设为 null");
}

demonstrateClosureTrap();

// 尝试穷尽检查
type TrafficLight = "red" | "green" | "yellow";

function describeLight(light: TrafficLight): string {
  switch (light) {
    case "red":
      return "停止";
    case "green":
      return "通行";
    case "yellow":
      return "注意";
    default: {
      const _exhaustive: never = light;  // 穷尽检查
      return _exhaustive;
    }
  }
}

console.log(`红灯：${describeLight("red")}`);
console.log(`绿灯：${describeLight("green")}`);
console.log(`黄灯：${describeLight("yellow")}`);

// 如果你添加了新的颜色，default 分支里的 never 检查会报错
// 这能帮你找到所有需要更新的 switch 语句

// 试试：在一个 discriminated union 中添加新变体
// 看看哪些 switch 语句会编译失败

export {};

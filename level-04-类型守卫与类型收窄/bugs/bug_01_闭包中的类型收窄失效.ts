/**
 * bug_01：闭包中的类型收窄失效
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_01_闭包中的类型收窄失效.ts
 *
 * 预期 tsc 输出：
 *   （本文件的类型问题不在编译期报错，而是在运行时触发）
 *   这是一个经典的"TS 控制流分析不追踪跨闭包的状态变化"的问题。
 *   编译通过，但运行时会报错：
 *     TypeError: Cannot read properties of null (reading 'toUpperCase')
 */

// ================================================================
// 错误代码：闭包中捕获的变量在回调执行前被修改
// ================================================================

function fetchUserData(id: number): { name: string } | null {
  if (id <= 0) return null;
  return { name: "Alice" };
}

function processUser(id: number): void {
  let user = fetchUserData(id);

  if (user !== null) {
    // user 被收窄为 { name: string }
    console.log(`用户姓名（收窄后）：${user.name}`);

    // BUG: 在异步回调中访问 user
    // TS 认为 user 仍然是 { name: string }（if 块中的收窄）
    // 但这个函数可能在我们回调执行前被调用
    process.nextTick(() => {
      // TS 类型：user: { name: string }（编译器认为安全）
      // 运行时：user 可能已经被设为 null！
      console.log(`异步回调中的用户：${user.name.toUpperCase()}`);
      //                                   ^^^^^^^^^^^^
      //                                   运行时可能：Cannot read properties of null
    });
  }

  // 模拟：在异步回调执行前，user 被修改了
  user = null;  // 💥 闭包中的 user 现在指向 null
}

// ================================================================
// 另一个变体：在 forEach/回调中访问外部已收窄的变量
// ================================================================

function forEachTrap(): void {
  let value: string | number = "hello";

  if (typeof value === "string") {
    // value 收窄为 string
    const items = [1, 2, 3];

    // BUG: forEach 的回调中引用 value
    items.forEach(() => {
      // TS 认为 value 是 string（但 forEach 回调可能在其被修改后执行）
      // 实际上 forEach 同步执行，所以这里理论上是安全的
      // 但 TS 的控制流分析不深入——它可能收窄也可能不收窄
      console.log(`forEach 中 value: ${value}`);
    });
  }

  value = 42; // 如果 forEach 是异步的，这里就是问题
}

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 的控制流分析（CFA）在函数内部是精确的，但跨闭包就变得保守/模糊。
// 核心原因：TS 不知道闭包什么时候执行。
//
// 【对比 Rust】：
//   闭包如果捕获了可变引用（`&mut`），Rust 编译器会在捕获期间阻止对该变量的其他访问。
//   所有权系统天然阻止了这类问题。
//   如果闭包需要拥有数据，用 `move` 关键字——数据被移动，不存在"外部修改"。
//
// 【对比 Kotlin】：
//   Kotlin 的 lambda 捕获的是"变量本身"（不是值拷贝），
//   但 Kotlin 的协程/回调有更明确的并发控制（结构化并发），
//   而且 Kotlin 的 var 在闭包中的智能转换也不会信任外部修改。
//
// 【对比 Java】：
//   匿名内部类只能捕获 effectively final 的变量——不能重新赋值！
//   这天然防止了"捕获后变量被修改"的问题。
//   但闭包的等效问题（可变对象的字段）仍存在。
//
// 【对比 Go】：
//   Go 的 goroutine 中捕获循环变量是著名的 bug（所有 goroutine 看到相同的循环变量的最终值）。
//   Go 1.22 修复了这个问题（每轮循环创建新变量）。
//   TS 没有自动修复——需要你手动注意。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：在闭包内部重新获取/检查
function processUserSafe(id: number): void {
  let user = fetchUserData(id);

  process.nextTick(() => {
    // 在闭包内部重新检查——不依赖外层的收窄
    if (user !== null) {
      console.log(`安全访问：${user.name.toUpperCase()}`);
    }
  });

  user = null; // 即使外部修改，内部检查了
}

// ✅ 方案 2：使用 const + 不可变引用
function processUserImmutable(id: number): void {
  const user = fetchUserData(id);  // 使用 const（但不能阻止对象内部修改）

  if (user !== null) {
    // 使用解构创建独立副本
    const capturedName = user.name;  // 捕获值，而不是引用

    process.nextTick(() => {
      console.log(`不可变捕获：${capturedName.toUpperCase()}`);  // ✅ 安全
    });
  }
}

// ✅ 方案 3：使用 structuredClone 或展开运算符创建副本
function processUserCopy(id: number): void {
  let user = fetchUserData(id);

  if (user !== null) {
    const userCopy = { ...user };  // 创建浅拷贝

    process.nextTick(() => {
      console.log(`副本访问：${userCopy.name.toUpperCase()}`);  // ✅ 安全
    });
  }

  user = null; // 外部修改不影响副本
}
*/

export {};

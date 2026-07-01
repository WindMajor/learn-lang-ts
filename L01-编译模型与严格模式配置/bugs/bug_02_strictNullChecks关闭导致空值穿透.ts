/**
 * bug_02：strictNullChecks 关闭导致空值穿透
 *
 * 编译方式：
 *   npx tsc --noEmit --strictNullChecks false bugs/bug_02_strictNullChecks关闭导致空值穿透.ts
 *   （注意：严格模式下会报错，所以需要显式关闭 strictNullChecks 来复现 bug）
 *
 * 预期 tsc 错误输出（strictNullChecks: true 时）：
 *   error TS18047: 'user' is possibly 'null'.
 *   error TS2533: Object is possibly 'null' or 'undefined'.
 *   error TS2322: Type 'null' is not assignable to type 'string'.
 */

// ================================================================
// 错误代码（strictNullChecks 关闭时编译通过，但运行时大概率崩溃）
// ================================================================

interface User {
  name: string;
  email: string;
}

// BUG: 函数返回 User | null，但调用者可能不检查 null
function findUser(id: number): User | null {
  if (id <= 0) {
    return null; // 没找到用户
  }
  return { name: "Alice", email: "alice@example.com" };
}

// BUG: 直接使用可能为 null 的值
// 如果 strictNullChecks 关闭，这里不会报错
// 运行时：如果 id = -1，user 是 null，user.name 抛出 TypeError
const user = findUser(-1);
const userName = user.name;  // 💥 运行时可能 TypeError: Cannot read properties of null

// BUG: 可选属性可能为 undefined
interface AppConfig {
  serverUrl: string;
  retryCount?: number;  // 可能为 undefined
}

const config: AppConfig = {
  serverUrl: "https://api.example.com",
  // retryCount 未设置 → undefined
};

// 如果 strictNullChecks 关闭，retryCount 的类型是 number（而不是 number | undefined）
// 这行不会报错，但做数学运算结果可能是 NaN
const retryDelay = config.retryCount * 1000;
//                    ^^^^^^^^^^^^^^^
//                    strictNullChecks 关闭时：number（不报错）
//                    strictNullChecks 打开时：number | undefined（报错！）

// BUG: null 赋值给非 null 类型
let name: string = "default";
name = null;  // strictNullChecks 关闭时合法，打开时报错

// ================================================================
// 为什么会有这个陷阱？
// ================================================================
//
// strictNullChecks 是 TS 2.0 引入的最重要开关。
// 默认之所以关闭（在 strict 整体被引入前），是为了向后兼容。
// 但关闭它意味着 TS 失去了"空安全"——这是现代语言的标配。
//
// 【对比 Kotlin】：Kotlin 的空安全是语言级别的，无法关闭。
//   `var name: String` → 不能为 null
//   `var name: String?` → 可以为 null
//   编译器强制你在使用前做空检查（或使用 `!!` 强行解包）
//
// 【对比 Rust】：Rust 根本没有 null 概念。
//   取而代之的是 `Option<T>` —— 一个值要么是 `Some(T)` 要么是 `None`。
//   你必须用 `match` 或 `?` 操作符处理 `Option`——编译器强制穷尽分支。
//
// 【对比 Swift】：与 Kotlin 类似，`String` 和 `String?` 是完全不同的类型。
//   必须使用可选绑定（`if let`）或可选链（`?.`）来安全访问。
//
// 【对比 Java】：没有原生的 null 安全。
//   `Optional<String>` 只是一个包装类，不强制使用。
//   任何 `String` 变量都可能为 null——这就是著名的"十亿美元错误"。
//
// 【对比 Go】：指针可以 nil，没有 `Option` 机制。
//   但 Go 的零值语义（zero value）减少了 null 的使用场景。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 修复后的代码（strictNullChecks: true 下编译通过）：

interface User {
  name: string;
  email: string;
}

function findUser(id: number): User | null {
  if (id <= 0) return null;
  return { name: "Alice", email: "alice@example.com" };
}

const user = findUser(-1);

// ✅ 方式1：null 检查 + 类型收窄
if (user !== null) {
  const userName: string = user.name;  // 安全
}

// ✅ 方式2：使用可选链 + 空值合并
const safeName = user?.name ?? "Unknown";

// ✅ 可选属性：使用空值合并
interface AppConfig {
  serverUrl: string;
  retryCount?: number;
}
const config: AppConfig = { serverUrl: "https://api.example.com" };
const retryDelay = (config.retryCount ?? 3) * 1000;  // 安全

// ✅ 不允许 null 赋值给非 null 类型
let name: string = "default";
// name = null;  // ❌ 编译错误：不能把 null 赋值给 string
let nullableName: string | null = null;  // ✅ 明确标注可为 null
*/

export {};

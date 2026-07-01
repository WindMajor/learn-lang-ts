/**
 * bug_02：模板字面量类型 + 递归导致类型计算爆炸
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_02_模板字面量类型联合组合爆炸.ts
 *
 * 预期 tsc 输出：
 *   （如果组合数不是太大，编译通过。
 *    如果组合数过大，TS 编译器可能报错或卡死——这就是"组合爆炸"）
 *   error TS2589: Type instantiation is excessively deep and possibly infinite.
 */

// ================================================================
// 错误代码：小型联合产生的中型组合
// ================================================================

// 场景：定义一个格式化函数，参数格式是 `method:path`
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type ApiPath = "/users" | "/posts" | "/comments" | "/auth" | "/health";

// 类型层：生成所有可能的 HTTP 请求签名
// = 5 × 5 = 25 种组合
type HttpRequest = `${HttpMethod} ${ApiPath}`;
// 25 种组合——编译器还能处理

// 但如果你有更多组合……
// type AllMethods = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "TRACE";
// type AllPaths = "/users" | "/users/:id" | "/users/:id/posts" | "/posts" | "/posts/:id" |
//                 "/comments" | "/auth/login" | "/auth/register" | "/health" | "/metrics";
// type AllRequests = `${AllMethods} ${AllPaths}`;
// = 8 × 10 = 80 种组合——还能处理，但开始慢了

// 当组合数达到数千甚至数万时：
// type HundredsOfPaths = ...; // 500 个路由
// type AllRequests = `${AllMethods} ${HundredsOfPaths}`;
// = 8 × 500 = 4000 种组合——编译器会显著变慢

// ================================================================
// 递归模板字面量类型也可能爆炸
// ================================================================

// 尝试构造所有可能的两部分路径组合
type Segment = "users" | "posts" | "admin";

// 递归构造路径
type BuildPath<T extends string> =
  T extends `${infer _}/${infer Rest}`
    ? BuildPath<Rest> | BuildPath<T>
    : T;

// 这种递归 + 联合的组合会产生指数级增长的类型实例

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// 模板字面量类型对联合类型做笛卡尔积。
// 每增加一个联合成员，组合数可能翻倍。
// 当你有 M 个方法的联合 × N 个路径的联合，结果就是 M × N 种字面量类型。
//
// TS 编译器对类型实例化有数量限制（约 500 个），超过会报错。
//
// 【对比 Rust】：
//   Rust 的宏展开也会增加编译时间（宏展开 → AST），
//   但宏生成的是代码而非类型——代码量可控。
//
// 【对比 C++】：
//   C++ 的模板元编程有同样问题——递归深度或实例化数量过大导致编译器崩溃或 OOM。
//   但 C++ 模板是必需的（没有其他方式泛化），TS 模板字面量是可选的。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：用小范围的联合——只定义实际需要的组合
// 不要用 `AllMethods × AllPaths`，用"白名单"
type ValidRequest =
  | "GET /users"
  | "GET /posts"
  | "POST /posts"
  | "DELETE /posts/:id";

// ✅ 方案 2：用更宽泛的类型代替精确组合
type HttpRequest = `${HttpMethod} /${string}`;
// 这样只有 method 做了精确检查，path 只是 string 模式——不再有组合爆炸

// ✅ 方案 3：如果确实需要类型安全，限制联合的大小
// 每个维度不超过 5-10 个成员的联合产生的组合是安全的
// 超过 50 个建议做编译期性能测试
*/

export {};

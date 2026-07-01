/**
 * bug_01：联合类型访问——直接访问非共有属性导致编译错误
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_01_联合类型非共有属性访问.ts
 *
 * 预期 tsc 错误输出：
 *   error TS2339: Property 'data' does not exist on type 'ApiResult'.
 *     Property 'data' does not exist on type '{ status: "error"; error: string; }'.
 *
 *   error TS2339: Property 'data' does not exist on type '{ status: "loading"; }'.
 */

// ================================================================
// 错误代码：在类型收窄前访问 union 的非共有属性
// ================================================================

type ApiResult =
  | { status: "success"; data: { id: number; name: string } }
  | { status: "error"; error: string }
  | { status: "loading" };

function displayResult(result: ApiResult): string {
  // BUG: 在类型收窄前访问 result.data
  // data 只在 "success" 分支存在，但 TS 不允许你直接访问它
  // return `Data: ${result.data.name}`;  // ❌ 编译错误！
  //   error TS2339: Property 'data' does not exist on type 'ApiResult'.
  //     Property 'data' does not exist on type '{ status: "error"; error: string; }'.
  //     Property 'data' does not exist on type '{ status: "loading" }'.

  // 错误信息解读：
  //   第一行：告诉你 data 在整个联合类型 `ApiResult` 上不存在
  //   第二行：具体指出在 `{ status: "error"; ... }` 分支中不存在
  //   第三行：在 `{ status: "loading" }` 分支中也不存在
  //   所以 TS 拒绝让你访问——它保守地假设你可能拿着 error 分支的值

  return "unreachable"; // 占位，实际会先报错
}

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 的联合类型设计哲学：你只能访问**所有分支都有**的成员。
// 这保证了类型安全——你不会在 error 状态时尝试读取 data。
//
// 【对比 Rust】：
//   enum ApiResult {
//       Success { data: Data },
//       Error { error: String },
//       Loading,
//   }
//   你必须在 match 中处理每个变体才能访问其内部字段——编译器强制
//   match result {
//       ApiResult::Success { data } => data.name,  // ✅
//       ApiResult::Error { error } => error,        // ✅
//       ApiResult::Loading => "loading",            // ✅
//   }
//
// 【对比 Kotlin】：
//   sealed class ApiResult {
//     data class Success(val data: Data) : ApiResult()
//     data class Error(val error: String) : ApiResult()
//     object Loading : ApiResult()
//   }
//   val result = when(apiResult) {
//     is ApiResult.Success -> apiResult.data.name  // ✅ 智能转换
//     is ApiResult.Error -> apiResult.error          // ✅
//     ApiResult.Loading -> "loading"                 // ✅
//   }
//
// 【对比 Swift】：
//   enum ApiResult {
//     case success(data: Data)
//     case error(message: String)
//     case loading
//   }
//   switch result {
//   case .success(let data): return data.name  // ✅
//   case .error(let message): return message   // ✅
//   case .loading: return "loading"            // ✅
//   }

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 用 discriminated union + switch 进行类型收窄
function displayResult(result: ApiResult): string {
  switch (result.status) {
    case "success":
      // TS 自动收窄 result 为 { status: "success"; data: ... }
      return `成功：${result.data.name} (ID: ${result.data.id})`;
    case "error":
      // TS 自动收窄 result 为 { status: "error"; error: string }
      return `错误：${result.error}`;
    case "loading":
      return "加载中...";
    default: {
      const _exhaustive: never = result;
      return _exhaustive;
    }
  }
}
*/

export {};

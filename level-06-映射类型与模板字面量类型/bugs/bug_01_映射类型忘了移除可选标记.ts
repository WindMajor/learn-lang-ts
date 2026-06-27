/**
 * bug_01：映射类型忘记 -? 导致 Required 变成 Partial
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_01_映射类型忘了移除可选标记.ts
 */

// 定义一个有可选属性的接口
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
  retries?: number;
}

// BUG: 忘了用 -? 移除可选标记——结果还是 Partial！
type MyRequired<T> = {
  [K in keyof T]: T[K];  // ⚠️ 应该是 [K in keyof T]-?: T[K]
};
// 这样写，如果 T 的属性本来就有 ?，映射后还是 ?
// 因为映射类型的 ? 修饰符会从源类型继承

type BadRequired = MyRequired<Config>;
// 期望：{ host: string; port: number; debug: boolean; retries: number }
// 实际：{ host?: string; port?: number; debug?: boolean; retries?: number }
//    ↑ 属性仍然可选！

// 验证：以下代码可以编译通过（全都不提供值）
const bad: BadRequired = {};  // ✅ 编译通过——但这不是你想要的！

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 正确：用 -? 显式移除可选标记
type MyRequiredFixed<T> = {
  [K in keyof T]-?: T[K];
};

// -? 告诉 TS："无论源属性是否可选，在新类型中都移除可选标记"
// +? 是显式添加可选（默认行为也是添加）
// -readonly 移除只读
// +readonly 添加只读（默认）

// ✅ 验证：以下应该报错
type FixedRequired = MyRequiredFixed<Config>;
const good: FixedRequired = {};  // ❌ 编译错误：缺少所有必填属性
//     error TS2741: Property 'host' is missing in type '{}' but required in type '...'.
*/

export {};

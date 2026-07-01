/**
 * bug_03：递归映射类型超过深度限制
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_03_递归映射类型超限.ts
 *
 * 预期 tsc 错误输出：
 *   error TS2589: Type instantiation is excessively deep and possibly infinite.
 */

// ================================================================
// 错误代码：深层递归映射触发编译器限制
// ================================================================

// 定义一个深度嵌套的配置类型
interface DeepConfig {
  level1: {
    level2: {
      level3: {
        level4: {
          level5: {
            level6: string;
          };
        };
      };
    };
  };
}

// 递归映射类型使所有嵌套属性可选
// TS 递归映射有 50 层深度限制（大多数场景够用）
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

// ✅ 6 层深度——远低于 50 层限制，OK
type PartialDeepConfig = DeepPartial<DeepConfig>;

// ❌ 但如果是自引用类型（循环引用），会无限递归
interface TreeNode {
  value: number;
  children: TreeNode[];  // 自引用！
}

// type PartialTree = DeepPartial<TreeNode>;
// 这会产生无限递归：
//   DeepPartial<TreeNode> → children?: DeepPartial<TreeNode[]> →
//     → DeepPartial<TreeNode> → ...
// TS 不一定检测到真正的无限递归，但可能触发 50 层限制

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 的递归映射类型在编译期展开，每次递归产生一"层"类型。
// 类似 C++ 模板递归——每层展开消耗编译器资源。
//
// 【对比 Rust】：
//   Rust 没有模板递归——proc macro 操作的是 TokenStream，不会有递归深度问题。
//
// 【对比 C++】：
//   C++ 模板递归也有深度限制（默认 ~1024），超过则编译错误。
//   `-ftemplate-depth=N` 可以调整。
//   TS 不能调整这个限制。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：在递归映射中检测循环引用，手动打断
//   使用条件类型检测 T 是否有自引用
type DeepPartialSafe<T, Depth extends number[] = []> =
  Depth["length"] extends 10  // 限制 10 层
    ? T  // 达到深度上限，停止递归
    : {
        [K in keyof T]?: T[K] extends object
          ? T[K] extends Function
            ? T[K]
            : DeepPartialSafe<T[K], [...Depth, 1]>
          : T[K];
      };

// ✅ 方案 2：对于自引用类型，只 Partial 第一层
type ShallowPartial<T> = {
  [K in keyof T]?: T[K];
};
// 不递归——安全但不够"深"

// ✅ 方案 3：按需要手动定义所需的深度
// 不需要把所有场景都设计为"任意深度递归"
*/

export {};

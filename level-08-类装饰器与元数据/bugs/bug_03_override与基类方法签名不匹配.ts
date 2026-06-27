/**
 * bug_03：override 标记了但基类方法签名不匹配
 * 编译：npx tsc --noEmit bugs/bug_03_override与基类方法签名不匹配.ts
 * 错误：error TS4116: This member must have an 'override' modifier because it overrides a member in the base class.
 */
class Base {
  greet(): string { return "Hello"; }
}

// ❌ 如果 noImplicitOverride 为 true，不加 override 会报错
class Good extends Base {
  override greet(): string { return `${super.greet()} from Good`; }
}

// ✅ 正确
const g = new Good();
console.log(g.greet());
export {};

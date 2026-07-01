/**
 * bug_01：子类构造函数忘记调用 super()
 * 编译：npx tsc --noEmit bugs/bug_01_忘记调用super导致undefined.ts
 * 错误：error TS2377: Constructors for derived classes must contain a 'super' call.
 */
class Base {
  constructor(public name: string) {
    console.log(`Base: ${name}`);
  }
}

class Bad extends Base {
  // BUG: 忘记 super()
  // error TS2377: Constructors for derived classes must contain a 'super' call.
}
// Cannot instantiate Bad without super()
export {};

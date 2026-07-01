/**
 * bug_02：状态机转换表不完整——遗漏了可能的转换
 * 编译：npx tsc --noEmit bugs/bug_02_状态机不完整导致非法状态.ts
 *
 * 预期：error TS2345 非法状态转换
 *
 * 状态转换表没有包含 "loading" → "error" 转换
 * 导致从 loading 转 error 时编译报错
 */

type BadTransitions = {
  idle: "loading";
  loading: "success";  // ⚠️ 缺少 "error" 转换！
  success: "idle";
  error: "idle";
};

class BadSM<S extends keyof BadTransitions> {
  constructor(private state: S) {}
  transition<T extends BadTransitions[S]>(newState: T): BadSM<T> {
    return new BadSM(newState);
  }
}

const sm = new BadSM("idle");
const loading = sm.transition("loading");
// loading.transition("error");  // ❌ 非法！badTransitions["loading"] = "success" 不包含 "error"
//   error TS2345: Argument of type '"error"' is not assignable to parameter of type 'BadTransitions["loading"]'

export {};

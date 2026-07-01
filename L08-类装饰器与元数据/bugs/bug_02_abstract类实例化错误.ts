/**
 * bug_02：尝试实例化抽象类
 * 编译：npx tsc --noEmit bugs/bug_02_abstract类实例化错误.ts
 * 错误：error TS2511: Cannot create an instance of an abstract class.
 */
abstract class Animal {
  abstract sound(): string;
}

// ❌ 不能实例化抽象类
// const a = new Animal();  // error TS2511
// ✅ 必须实例化具体子类
class Dog extends Animal {
  override sound(): string { return "Woof!"; }
}
const dog = new Dog();
console.log(dog.sound());
export {};

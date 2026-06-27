/**
 * bug_01：数组协变导致运行时类型错误
 * 编译：npx tsc --noEmit bugs/bug_01_数组协变导致运行时错误.ts
 */

class Animal { constructor(public name: string) {} }
class Dog extends Animal { bark() { return `${this.name}: Woof!`; } }
class Cat extends Animal { meow() { return `${this.name}: Meow!`; } }

const dogs: Dog[] = [new Dog("Rex"), new Dog("Fido")];
// ✅ 编译通过：Dog[] 赋值给 Animal[]（数组协变）
const animals: Animal[] = dogs;

// 💥 编译通过但运行时危险：往 Dog[] 数组 push Cat
animals.push(new Cat("Whiskers"));  // 不报错，但 dogs[2] 是 Cat！

// 后续使用 dogs[2] 当作 Dog……
// dogs[2].bark();  // 运行时 TypeError: dogs[2].bark is not a function

// 【对比 Rust】：Vec<Dog> 和 Vec<Animal> 完全不兼容，编译时阻止
// 【对比 Kotlin】：MutableList<Dog> 不变（不能赋值给 MutableList<Animal>）
// ✅ 修复：用只读数组 readonly Animal[]（但仍不能防止 push 的时机问题）
export {};

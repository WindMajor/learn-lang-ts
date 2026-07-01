/**
 * Level 07 沙盒
 */
console.log("=== Level 07 沙盒 ===\n");

// 试试数组协变
class Animal { constructor(public name: string) {} }
class Dog extends Animal { bark() { return `${this.name}: Woof!`; } }
class Cat extends Animal { meow() { return `${this.name}: Meow!`; } }

const dogs: Dog[] = [new Dog("Rex")];
const animals: Animal[] = dogs;
// animals.push(new Cat("Whiskers"));  // ⚠️ 运行时危险但编译通过

// 试试函数重载
function greet(name: string): string;
function greet(age: number): string;
function greet(value: string | number): string {
  if (typeof value === "string") return `Hello, ${value}`;
  return `You are ${value} years old`;
}

console.log(greet("Alice"));
console.log(greet(30));

export {};

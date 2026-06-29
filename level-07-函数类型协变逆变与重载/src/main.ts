/**
 * Level 07 主代码：函数类型、协变逆变与重载
 *
 * 演示：
 * 1. 协变（Covariance）——返回值方向
 * 2. 逆变（Contravariance）——参数方向 + strictFunctionTypes
 * 3. 数组协变陷阱
 * 4. 函数重载（Overloads）
 * 5. this 参数类型
 *
 * 运行：npx ts-node src/main.ts
 */

// ========== 第一部分：协变逆变基本概念 ==========

// 模块级类型定义（供 VarianceTests 和多个函数使用）
class Animal {
  constructor(public name: string) {}
}
class Dog extends Animal {
  bark(): string {
    return `${this.name}: Woof!`;
  }
}

function varianceBasics() {
  console.log("=== 协变逆变基本概念 ===");

  // WHAT: 协变——子类型可以赋值给父类型（返回值方向）
  // CONTRAST: Rust 中所有类型默认不变（invariant），没有协变/逆变
  // CONTRAST: Kotlin 中用 out（协变）和 in（逆变）在声明处标记

  const dog = new Dog("Rex");

  // ✅ 协变：Dog 可以赋值给 Animal（值的赋值，不是类型参数的赋值）
  const animal: Animal = dog;
  console.log(`协变：Dog 赋值给 Animal → ${animal.name}`);

  // ✅ 函数返回值协变：返回 Dog 的函数可以赋值给返回 Animal 的函数类型
  const getDog: () => Dog = () => new Dog("Fido");
  const getAnimal: () => Animal = getDog;  // ✅ Dog → Animal 协变
  console.log(`返回值协变：() => Dog 赋值给 () => Animal → ${getAnimal().name}`);

  // ===== 函数参数逆变（strictFunctionTypes: true） =====
  // WHAT: 参数方向是逆变的——父类型参数可以赋值给子类型参数的位置
  //       但 strictFunctionTypes 只在方法签名中检查，回调函数类型才检查
  type AnimalHandler = (a: Animal) => void;
  type DogHandler = (d: Dog) => void;

  const handleAnimal: AnimalHandler = (a: Animal) => {
    console.log(`处理动物: ${a.name}`);
  };

  // 逆变：DogHandler 可以赋值给 AnimalHandler — Dog 参数"更严格"
  // AnimalHandler 期望接受任意 Animal（包括 Cat），
  // DogHandler 只想接受 Dog——所以不能安全地替代
  // 严格模式下这行会报错：
  // const handleDogAsAnimal: AnimalHandler = handleAnimal; // ✅ 父参数替代子参数位置 OK!
  // const bad: DogHandler = handleAnimal;  // ❌ strictFunctionTypes 报错！
  //   error TS2322: Type 'AnimalHandler' is not assignable to type 'DogHandler'.
  //     Types of parameters 'a' and 'd' are incompatible.
  //       Property 'bark' is missing in type 'Animal' but required in type 'Dog'.

  handleAnimal(dog);

  // CONTRAST: Kotlin 逆变
  //   fun handleAnimal(handler: (Animal) -> Unit) {}
  //   如果你用 (Dog) -> Unit 替换 (Animal) -> Unit，Kotlin 也是逆变的
  //   但声明方式不同——Kotlin 在函数式接口中自动处理

  console.log("strictFunctionTypes 启用：函数参数逆变检查生效 ✅");
}

// ========== 第二部分：数组协变陷阱 ==========

function arrayCovarianceTrap() {
  console.log("\n=== 数组协变陷阱 ===");

  // WHAT: TS 数组是协变的——Dog[] extends Animal[]
  // WHY: 这是为了兼容 JS 的常见模式——但这是"不安全的协变"
  // WARNING: 数组的"协变"是 TS 类型系统的已知不安全设计
  //          这是被 Java 数组协变（同样不安全）影响的历史决定

  const dogs: Dog[] = [new Dog("Rex"), new Dog("Fido")];

  // ✅ 协变：Dog[] 可以赋值给 Animal[]
  const animals: Animal[] = dogs;

  // 💥 BUG 温床：通过 Animal[] 引用往 Dog[] 数组写入 Cat
  // animals.push(new Cat("Whiskers"));  // Animal[] 类型允许 push Animal
  //   但运行时 animals 实际是 Dog[]，
  //   push Cat 进去后，dogs[2].bark() 会导致 TypeError!
  //
  // TS 不阻止这个操作——因为数组是协变的
  // 这是 TS 类型系统最明显的不安全角落之一

  console.log(`数组协变：Dog[] 赋值给 Animal[] ✅（但不安全！）`);
  console.log(`警告：往 Animal[]（实际是 Dog[]）push Cat 不会编译报错`);

  // CONTRAST: Rust 中 vec! 不变——`Vec<Dog>` 和 `Vec<Animal>` 完全不兼容
  // CONTRAST: Kotlin 中 `MutableList<Dog>` 不变，`List<Dog>` 协变（只读）
  //           这是 Kotlin 比 TS/Java 更安全的设计
  // CONTRAST: Java 数组中 `Dog[]` 可以赋值给 `Animal[]`，
  //           但如果运行时存入 Cat 会抛 ArrayStoreException（运行时检查）
  //           TS 完全不做运行时检查！
}

// ========== 第三部分：函数重载 ==========

function overloadsDemo() {
  console.log("\n=== 函数重载 ===");

  // WHAT: TS 函数重载 = 多个重载签名 + 1 个实现签名
  //       实现签名不可见（外部调用者只能看到重载签名）
  // CONTRAST: C++ 的函数重载——编译期根据参数类型解析，
  //           每个重载有独立实现，不需要"合并到一个实现"
  // CONTRAST: Rust——不支持函数重载（使用 trait 或不同函数名）
  //           但可以通过 `impl` 块实现相同名字但不同 trait 的方法

  // 类型层：重载签名（外部可见）
  function format(value: string): string;
  function format(value: number): string;
  function format(value: Date): string;
  function format(value: string[]): string;
  // 值层：实现签名（外部不可见，参数类型是所有重载的联合）
  function format(value: string | number | Date | string[]): string {
    if (typeof value === "string") {
      return `字符串: ${value}`;
    }
    if (typeof value === "number") {
      return `数字: ${value.toFixed(2)}`;
    }
    if (value instanceof Date) {
      return `日期: ${value.toISOString()}`;
    }
    return `数组: [${value.join(", ")}]`;
  }

  console.log(format("hello"));
  console.log(format(3.14159));
  console.log(format(new Date()));
  console.log(format(["a", "b", "c"]));

  // ===== 重载签名用字面量类型做精确匹配 =====
  interface EventMap {
    click: { x: number; y: number };
    keydown: { key: string };
    scroll: { delta: number };
  }

  function on(event: "click", handler: (e: EventMap["click"]) => void): void;
  function on(event: "keydown", handler: (e: EventMap["keydown"]) => void): void;
  function on(event: "scroll", handler: (e: EventMap["scroll"]) => void): void;
  function on(
    event: string,
    handler: (e: any) => void,
  ): void {
    console.log(`注册事件: ${event}`);
  }

  // 每个调用有精确的事件类型推断
  on("click", (e) => {
    // e 的类型是 { x: number; y: number }
    console.log(`点击位置: (${e.x}, ${e.y})`);
  });

  on("keydown", (e) => {
    // e 的类型是 { key: string }
    console.log(`按键: ${e.key}`);
  });
}

// ========== 第四部分：this 参数类型 ==========

function thisParameterDemo() {
  console.log("\n=== this 参数类型 ===");

  // WHAT: TS 允许你在函数第一个参数位置声明 this 的类型
  // WHY: 约束函数调用时的 this 上下文——防止 this 指向错误
  // CONTRAST: Rust 的 `self` / `&self` / `&mut self`——方法调用者明确
  //           TS 的 this 是隐式的，容易丢失上下文

  interface Card {
    suit: string;
    rank: number;
  }

  interface Deck {
    cards: Card[];
    // this 参数：定义该方法只能在 Deck 实例上调用
    shuffle(this: Deck): void;
    draw(this: Deck): Card | undefined;
  }

  const deck: Deck = {
    cards: [
      { suit: "hearts", rank: 1 },
      { suit: "spades", rank: 13 },
    ],
    shuffle(this: Deck): void {
      // Fisher-Yates 洗牌
      for (let i = this.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
      }
      console.log(`牌组已洗牌，共 ${this.cards.length} 张`);
    },
    draw(this: Deck): Card | undefined {
      return this.cards.pop();
    },
  };

  deck.shuffle();
  const drawn = deck.draw();
  if (drawn) {
    console.log(`抽到: ${drawn.rank} of ${drawn.suit}`);
  }

  // 如果解构赋值会丢失 this 上下文：
  // const { shuffle } = deck;
  // shuffle();  // ❌ The 'this' context of type 'void' is not assignable ...
  //   error TS2684: The 'this' context of type 'void' is not assignable
  //                 to method's 'this' of type 'Deck'.

  console.log("this 参数类型阻止了方法被解构后错误调用 ✅");
}

// ========== 编译期验证 ==========

// 验证协变逆变关系（strictFunctionTypes: true）
export type VarianceTests = {
  // 返回值协变
  t01_return_covariant: (() => Dog) extends (() => Animal) ? true : false;
  // expected: true

  // 参数逆变（strictFunctionTypes）
  t02_param_contravariant: ((a: Animal) => void) extends ((d: Dog) => void) ? true : false;
  // strictFunctionTypes: true → false（Animal 参数可以接受 Dog 调用）
  //   但 (d: Dog) => void 期望 Dog，给的却是 Animal——不够精确

  // 数组协变
  t03_array_covariant: Dog[] extends Animal[] ? true : false;
  // expected: true（不安全的协变！）
};

// ========== 主入口 ==========

function main(): void {
  varianceBasics();
  arrayCovarianceTrap();
  overloadsDemo();
  thisParameterDemo();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：返回值协变（子→父 OK），参数逆变（strictFunctionTypes ON 时）。");
  console.log("TS 数组协变是不安全的历史遗留设计——Java 也有同样的坑。");
  console.log("函数重载通过多签名实现类型安全的参数组合。");
}

main();

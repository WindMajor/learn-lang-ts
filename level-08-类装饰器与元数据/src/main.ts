/**
 * Level 08 主代码：类、装饰器与元数据
 *
 * 演示：
 * 1. 参数属性（Parameter Properties）
 * 2. 访问修饰符 + readonly + override
 * 3. abstract 抽象类
 * 4. 类的类型层与值层双重身份
 * 5. 装饰器（TS 5.0+ 原生装饰器语法）
 * 6. 编译期类型验证
 *
 * 运行：npx ts-node src/main.ts
 */

// ========== 第一部分：参数属性与访问修饰符 ==========

function parameterProperties() {
  console.log("=== 参数属性与访问修饰符 ===");

  // WHAT: 参数属性让你在 constructor 参数中声明类字段
  // WHY: 减少样板代码——一个参数声明 = 属性声明 + 参数 + 赋值
  // CONTRAST: Kotlin 中 `class User(val name: String, private val password: String)`
  //           是几乎相同的语法——Kotlin 也是参数属性！
  // CONTRAST: Java 中你必须手动写字段声明 + 构造函数赋值
  //           `class User { private String name; User(String name) { this.name = name; } }`
  // CONTRAST: Rust 不需要构造函数——用 struct 字面量 `User { name, password }`

  class User {
    // 参数属性：在一行内声明了三个字段
    constructor(
      public readonly id: number,        // public + readonly
      public name: string,               // public（默认）
      private password: string,          // private
      protected role: "admin" | "user" = "user",  // protected + 默认值
    ) {
      // 不需要手动写 this.id = id; this.name = name; ...（TS 自动生成）
    }

    // 方法内部可以访问 password
    verifyPassword(input: string): boolean {
      return this.password === input;
    }
  }

  const user = new User(1, "Alice", "secret123");
  console.log(`User: ${user.name} (id: ${user.id})`);
  console.log(`密码验证: ${user.verifyPassword("secret123")}`);
  // user.password;  // ❌ private，外部不能访问
  // user.role;      // ❌ protected，外部不能访问
}

// ========== 第二部分：抽象类 ==========

abstract class Repository<T extends { id: number }> {
  // 抽象方法——子类必须实现
  abstract findById(id: number): T | undefined;
  abstract save(entity: T): void;

  // 具体方法——所有子类共享
  findAll(): T[] {
    console.log("[Repository] 获取所有记录");
    const stored = this._storage();
    return stored;
  }

  // protected 方法——子类可访问
  protected abstract _storage(): T[];

  // CONTRAST: Rust 没有抽象类。
  //   用 trait 定义接口，用 default impl 提供共享实现。
  //   trait Repository { fn find_by_id(&self, id: u32) -> Option<T>; }
  // CONTRAST: Kotlin 的 abstract class 语法与 TS 几乎完全一致
  //   但 Kotlin 有 sealed class（更严格的继承控制）
}

class UserRepository extends Repository<{ id: number; name: string }> {
  private users: { id: number; name: string }[] = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ];

  findById(id: number): { id: number; name: string } | undefined {
    return this.users.find((u) => u.id === id);
  }

  save(entity: { id: number; name: string }): void {
    this.users.push(entity);
    console.log(`[UserRepo] 保存: ${entity.name}`);
  }

  protected _storage(): { id: number; name: string }[] {
    return this.users;
  }
}

function abstractClassDemo() {
  console.log("\n=== 抽象类 ===");

  const repo = new UserRepository();
  const user = repo.findById(1);
  if (user) console.log(`找到用户: ${user.name}`);

  repo.save({ id: 3, name: "Charlie" });
  console.log(`所有用户: ${repo.findAll().map((u) => u.name).join(", ")}`);
}

// ========== 第三部分：类的双重身份（类型层 + 值层）==========

function classDualNature() {
  console.log("\n=== 类的双重身份 ===");

  // WHAT: class 定义同时存在于类型层和值层
  //   类型层：`Dog` 可以作为类型（实例类型）使用
  //   值层：`Dog` 是构造函数的引用

  class Dog {
    constructor(public name: string, public breed: string) {}
    bark(): string {
      return `${this.name}: Woof!`;
    }

    // 静态成员——在值层（构造函数上），不在实例类型层
    static species = "Canis familiaris";
    static create(name: string): Dog {
      return new Dog(name, "Mutt");
    }
  }

  // 类型层：Dog 作为实例类型
  const myDog: Dog = new Dog("Rex", "Golden Retriever");

  // 值层：Dog 作为构造函数引用
  const makeDog: new (name: string, breed: string) => Dog = Dog;
  const anotherDog = new makeDog("Fido", "Labrador");

  console.log(`${myDog.name} (${myDog.breed}): ${myDog.bark()}`);
  console.log(`${anotherDog.name} (${anotherDog.breed}): ${anotherDog.bark()}`);

  // typeof Dog —— 构造函数的类型（不是实例类型）
  type DogConstructor = typeof Dog;  // new (name: string, breed: string) => Dog
  void (null as unknown as DogConstructor);
  console.log(`species: ${Dog.species}`);

  // InstanceType<typeof Dog> —— 从构造函数类型提取实例类型 = Dog
  type DogInstance = InstanceType<typeof Dog>;
  void (null as unknown as DogInstance);

  // CONTRAST: 在 Rust 中，struct 只存在于类型层。
  //   你不能说 `let factory = User; factory("name")`
  //   因为 Rust 没有"构造函数作为一等值"的概念。
  // CONTRAST: 在 Kotlin/Java 中，可以通过反射创建实例：
  //   `val constructor = User::class.constructors.first()`
  //   但这不是一等值——需要反射 API。
  //   TS 的 class 在运行时就是构造函数——可以直接传递。
}

// ========== 第四部分：装饰器（TS 5.0+ Stage 3 Decorators）==========

// WHAT: 装饰器是一种声明式语法，用于修改类/方法/属性的行为
// WHY: 横切关注点（日志、缓存、权限、验证）不需要侵入业务逻辑
// CONTRAST: Python 的装饰器——语法和概念都很像 `@decorator`
//           `@logged` 在 Python 中是 `logged(target)` 的语法糖
// CONTRAST: Java 的注解（Annotation）——运行时通过反射读取，
//           本身不执行代码，需要框架（Spring）解释
// CONTRAST: Kotlin 的注解——同 Java，但可以加 `@Target` 等元注解
// CONTRAST: Rust 的 attribute macro（proc macro）——功能最强大，
//           可以在编译期生成/修改代码；TS 装饰器不能生成新类型

// 类型层：装饰器的类型签名
// 值层：一个普通函数，接收元数据并返回装饰后的方法
function logged(
  originalMethod: Function,
  context: ClassMethodDecoratorContext,
) {
  const methodName = String(context.name);

  function replacementMethod(this: unknown, ...args: unknown[]) {
    console.log(`[LOG] 进入方法: ${methodName}`);
    console.log(`[LOG] 参数: ${JSON.stringify(args)}`);

    const start = performance.now();
    const result = originalMethod.call(this, ...args);
    const duration = performance.now() - start;

    console.log(`[LOG] 退出方法: ${methodName} (耗时 ${duration.toFixed(2)}ms)`);
    return result;
  }

  return replacementMethod;
}

function measurePerformance() {
  console.log("\n=== 装饰器：性能测量 ===");

  class Calculator {
    @logged
    fibonacci(n: number): number {
      if (n <= 1) return n;
      return this.fibonacci(n - 1) + this.fibonacci(n - 2);
    }

    @logged
    factorial(n: number): number {
      if (n <= 1) return 1;
      return n * this.factorial(n - 1);
    }
  }

  const calc = new Calculator();
  console.log(`fibonacci(10) = ${calc.fibonacci(10)}`);
  console.log(`factorial(5) = ${calc.factorial(5)}`);
}

// ========== 第五部分：override 关键字 ==========

function overrideKeyword() {
  console.log("\n=== override 关键字 ===");

  class Base {
    greet(): string {
      return "Hello from Base";
    }

    calculate(x: number, y: number): number {
      return x + y;
    }
  }

  class Derived extends Base {
    // ✅ 显式 override —— 如果基类没有此方法，TS 会报错
    override greet(): string {
      return `${super.greet()} and Derived`;
    }

    override calculate(x: number, y: number): number {
      return x * y; // 故意改变行为：加法 → 乘法
    }

    // 如果基类没有此方法，没有 override 也会报错（noImplicitOverride: true）
    // badOverride(): void {}  // ❌ 没有 override 关键字
  }

  const derived = new Derived();
  console.log(derived.greet());
  console.log(`calculate(3, 4) = ${derived.calculate(3, 4)} — 乘法而非加法`);

  // override 与 noImplicitOverride 配合使用，
  // 防止重构时基类方法改名/删除导致子类无提示
}

// ========== 编译期验证 ==========

abstract class TestBase {
  abstract doSomething(): string;
}

class TestDerived extends TestBase {
  override doSomething(): string {
    return "done";
  }
}

export type ClassTypeTests = {
  // InstanceType 提取实例类型
  t01_instance_type: InstanceType<typeof TestDerived> extends TestDerived ? true : false;
  // expected: true

  // TestDerived 是 TestBase 的子类型
  t02_subclass: TestDerived extends TestBase ? true : false;
  // expected: true

  // abstract 类不能实例化（编译期检查）
  // t03: new TestBase();  // ❌ 编译错误（不能在 type 里写）
};

// ========== 主入口 ==========

function main(): void {
  parameterProperties();
  abstractClassDemo();
  classDualNature();
  measurePerformance();
  overrideKeyword();

  console.log("\n=== 关卡完成 ===");
  console.log("核心认知：参数属性减少样板代码。TS 的 class 有双重身份（类型层+值层）。");
  console.log("装饰器提供声明式的横切关注点分离——不侵入业务逻辑。");
  console.log("override 关键字防止重构时基类変更导致的子类静默错误。");
}

main();

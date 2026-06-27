/**
 * bug_03：private 字段的结构兼容性——名义类型思维与结构类型的冲突
 *
 * 编译方式：
 *   npx tsc --noEmit bugs/bug_03_private字段的结构类型行为.ts
 *
 * 预期 tsc 错误输出：
 *   error TS2345: Argument of type 'MySQLDatabase' is not assignable to parameter of type 'PostgresDatabase'.
 *     Types have separate declarations of a private property 'connection'.
 *
 *   error TS2345: Argument of type 'Dog' is not assignable to parameter of type 'Cat'.
 *     Types have separate declarations of a private property 'privateField'.
 */

// ================================================================
// 错误代码：私有字段阻止了看似合理的结构类型兼容
// ================================================================

// 场景：两个数据库驱动，结构相同但实现不同
class PostgresDatabase {
  constructor(
    public host: string,
    public port: number,
    private connection: unknown, // 连接实现——PostgreSQL 特定
  ) {}

  query(sql: string): string {
    return `[Postgres] ${sql}`;
  }
}

class MySQLDatabase {
  constructor(
    public host: string,
    public port: number,
    private connection: unknown, // 连接实现——MySQL 特定
  ) {}

  query(sql: string): string {
    return `[MySQL] ${sql}`;
  }
}

// 假设有一个函数需要 PostgresDatabase
function connectToPostgres(db: PostgresDatabase): string {
  return db.query("SELECT 1");
}

const mysqlDb = new MySQLDatabase("localhost", 3306, { pooled: true });

// BUG/陷阱：即使两个类的 public 接口完全相同，也不能互换
// connectToPostgres(mysqlDb);  // ❌ 编译错误！
//   error TS2345: Argument of type 'MySQLDatabase' is not assignable to parameter of type 'PostgresDatabase'.
//     Types have separate declarations of a private property 'connection'.

// WARNING: 这个行为让来自 Rust/Kotlin 的开发者困惑，
// 因为"名义类型语言"中，类型名不同本来就不兼容——private 无关
// 但"结构类型语言"TS 中，没有 private 的话这两个类反而是兼容的！
// private 引入了一种"准名义类型"行为

// ================================================================
// 另一个陷阱：private 阻止"鸭子类型"的合理使用
// ================================================================

class Cat {
  constructor(
    public name: string,
    private privateField: string, // 任何 private 字段都会阻止结构兼容
  ) {}
}

class Dog {
  constructor(
    public name: string,
    private privateField: string, // 即使字段名相同，来源不同类
  ) {}
}

function petCat(cat: Cat): string {
  return `Petting ${cat.name}`;
}

const dog = new Dog("Rex", "woof");
// petCat(dog);  // ❌ 编译错误！Cat 和 Dog 不兼容

// ================================================================
// 为什么会有这个陷阱？
// ================================================================

// TS 的 private 在编译后完全消失（类型擦除），但在编译期：
// 1. 阻止外部访问私有成员
// 2. 阻止两个有私有成员的不同类互相赋值
//
// 这是 TS 在结构类型框架内模拟"名义类型"的一种尝试。
//
// 【对比 Rust】：
//   struct PostgresDatabase {
//       host: String,
//       port: u16,
//       connection: Connection,  // 没有 private——Rust 默认私有
//   }
//   两个不同的 struct 天然不兼容，不需要 private 来辅助。
//   私有性只影响访问控制，不影响类型兼容性。
//
// 【对比 Kotlin】：
//   class PostgresDatabase(
//       val host: String,
//       val port: Int,
//       private val connection: Connection
//   )
//   类型名不同 = 不兼容，private 只影响访问控制。
//
// 【对比 Java】：
//   class PostgresDatabase {
//       public String host;
//       public int port;
//       private Connection connection;
//   }
//   同样，类型名不同就不兼容。
//
// 【对比 Go】：
//   type PostgresDatabase struct {
//       Host       string
//       Port       int
//       connection Connection
//   }
//   小写字段是包私有，但 struct 类型本身不可互换（需要类型名相同）。

// ================================================================
// 修复方案
// ================================================================

/**
// ✅ 方案 1：提取公共接口（TS 惯用做法）
interface Database {
  query(sql: string): string;
}

function connectToDatabase(db: Database): string {
  return db.query("SELECT 1");
}

// 现在 PostgresDatabase 和 MySQLDatabase 都满足 Database 接口
// 因为它们都有 query 方法——这是真正的"鸭子类型"！
const pg = new PostgresDatabase("localhost", 5432, { pooled: true });
const my = new MySQLDatabase("localhost", 3306, { pooled: true });
console.log(connectToDatabase(pg));  // ✅
console.log(connectToDatabase(my));  // ✅

// ✅ 方案 2：如果确实需要"类"（而不只是接口），去掉 private
//   但这样会失去封装——看你取舍
class SharedDatabase {
  constructor(
    public host: string,
    public port: number,
    public connection: unknown, // public：可用于结构兼容
  ) {}
  query(sql: string): string {
    return `[DB] ${sql}`;
  }
}
*/

export {};

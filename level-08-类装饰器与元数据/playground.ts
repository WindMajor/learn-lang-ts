/**
 * Level 08 沙盒
 */
console.log("=== Level 08 沙盒 ===\n");

// 试试参数属性
class Point {
  constructor(
    public x: number,
    public y: number,
    readonly label: string = "point",
  ) {}
}

const p = new Point(10, 20);
console.log(`Point(${p.x}, ${p.y}) — ${p.label}`);

// 试试抽象类
abstract class Shape {
  abstract area(): number;
  describe(): string { return `面积: ${this.area()}`; }
}

class Circle extends Shape {
  constructor(private radius: number) { super(); }
  override area(): number { return Math.PI * this.radius ** 2; }
}

console.log(new Circle(5).describe());

export {};

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/MotionWrapper.tsx"),
  "utf-8"
);

describe("MotionWrapper component", () => {
  it('has "use client" directive', () => {
    expect(source).toContain('"use client"');
  });

  it('imports motion from "motion/react"', () => {
    expect(source).toContain("motion/react");
  });

  it("exports MotionWrapper function", () => {
    expect(source).toContain("MotionWrapper");
  });

  it("contains HTMLMotionProps type reference", () => {
    expect(source).toContain("HTMLMotionProps");
  });

  it("spreads motionProps onto motion.div (rest/spread pattern)", () => {
    expect(source).toContain("...motionProps");
  });
});

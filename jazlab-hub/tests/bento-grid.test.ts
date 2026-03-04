import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/BentoGrid.tsx"),
  "utf-8"
);

describe("BentoGrid component", () => {
  it("includes grid-cols-1 for mobile single-column layout", () => {
    expect(source).toContain("grid-cols-1");
  });

  it("includes md:grid-cols-2 for tablet 2-column layout", () => {
    expect(source).toContain("md:grid-cols-2");
  });

  it("includes lg:grid-cols-3 for desktop 3-column layout", () => {
    expect(source).toContain("lg:grid-cols-3");
  });

  it("includes auto-rows- for uniform row height", () => {
    expect(source).toContain("auto-rows-");
  });

  it("uses featured prop for variable card sizing", () => {
    expect(source).toContain("featured");
  });

  it("imports experiments data from @/lib/experiments", () => {
    expect(source).toMatch(/import.*experiments.*from.*@\/lib\/experiments/);
  });

  it("imports ExperimentCard from @/components/ExperimentCard", () => {
    expect(source).toMatch(/import.*ExperimentCard.*from.*@\/components\/ExperimentCard/);
  });

  it("is a pure Server Component (no use client directive)", () => {
    expect(source).not.toContain('"use client"');
  });
});

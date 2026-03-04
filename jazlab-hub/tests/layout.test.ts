import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

let layoutTsx: string;

beforeAll(() => {
  const layoutPath = path.resolve(__dirname, "../src/app/layout.tsx");
  layoutTsx = fs.readFileSync(layoutPath, "utf-8");
});

describe("root layout typography and dark mode", () => {
  it("contains the font-inter CSS variable class name", () => {
    expect(layoutTsx).toContain("font-inter");
  });

  it("contains the font-space-grotesk CSS variable class name", () => {
    expect(layoutTsx).toContain("font-space-grotesk");
  });

  it("contains the font-jetbrains-mono CSS variable class name", () => {
    expect(layoutTsx).toContain("font-jetbrains-mono");
  });

  it("contains the 'dark' class on the html element", () => {
    expect(layoutTsx).toContain("dark");
  });

  it("imports from next/font/google", () => {
    expect(layoutTsx).toContain("next/font/google");
  });
});

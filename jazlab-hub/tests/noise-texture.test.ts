import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

let globalsCss: string;

beforeAll(() => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  globalsCss = fs.readFileSync(cssPath, "utf-8");
});

describe("noise texture CSS rules in globals.css", () => {
  it("contains body::before rule", () => {
    expect(globalsCss).toContain("body::before");
  });

  it("body::before contains feTurbulence", () => {
    expect(globalsCss).toContain("feTurbulence");
  });

  it("body::before opacity is in the 0.05-0.08 range", () => {
    // Match opacity: 0.05, 0.06, 0.07, or 0.08 (5-8% range)
    const opacityMatch = globalsCss.match(/opacity:\s*([\d.]+)/);
    expect(opacityMatch).not.toBeNull();
    const opacityValue = parseFloat(opacityMatch![1]);
    expect(opacityValue).toBeGreaterThanOrEqual(0.05);
    expect(opacityValue).toBeLessThanOrEqual(0.08);
  });

  it("body::before contains pointer-events: none", () => {
    expect(globalsCss).toContain("pointer-events: none");
  });
});

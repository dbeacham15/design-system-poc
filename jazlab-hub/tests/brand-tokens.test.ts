import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";

let globalsCss: string;

beforeAll(() => {
  const cssPath = path.resolve(__dirname, "../src/app/globals.css");
  globalsCss = fs.readFileSync(cssPath, "utf-8");
});

describe("brand tokens in globals.css", () => {
  it("contains --color-violet with value #5B3DF5", () => {
    expect(globalsCss).toContain("--color-violet");
    expect(globalsCss).toContain("#5B3DF5");
  });

  it("contains --color-teal with value #28C7B7", () => {
    expect(globalsCss).toContain("--color-teal");
    expect(globalsCss).toContain("#28C7B7");
  });

  it("contains --color-surface with value #0F1117", () => {
    expect(globalsCss).toContain("--color-surface");
    expect(globalsCss).toContain("#0F1117");
  });

  it("contains --font-display, --font-body, --font-mono", () => {
    expect(globalsCss).toContain("--font-display");
    expect(globalsCss).toContain("--font-body");
    expect(globalsCss).toContain("--font-mono");
  });

  it("contains @theme inline block", () => {
    expect(globalsCss).toContain("@theme inline");
  });

  it("contains --gradient-brand custom property", () => {
    expect(globalsCss).toContain("--gradient-brand");
  });
});

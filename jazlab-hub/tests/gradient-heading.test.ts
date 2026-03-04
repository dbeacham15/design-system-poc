import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/GradientHeading.tsx"),
  "utf-8"
);

describe("GradientHeading component", () => {
  it("uses Tailwind v4 gradient syntax (bg-linear-to-r, not bg-gradient-to-r)", () => {
    expect(source).toContain("bg-linear-to-r");
    expect(source).not.toContain("bg-gradient-to-r"); // v3 anti-pattern
  });

  it("uses JazLab brand tokens for gradient colors", () => {
    expect(source).toContain("from-violet");
    expect(source).toContain("to-teal");
  });

  it("includes bg-clip-text and text-transparent for gradient text effect", () => {
    expect(source).toContain("bg-clip-text");
    expect(source).toContain("text-transparent");
  });

  it("includes inline-block to size container to text width", () => {
    expect(source).toContain("inline-block");
  });

  it("uses font-display and font-extrabold for typography", () => {
    expect(source).toContain("font-display");
    expect(source).toContain("font-extrabold");
  });
});

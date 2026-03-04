import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/ExperimentBadge.tsx"),
  "utf-8"
);

describe("ExperimentBadge component", () => {
  it("contains all 3 status labels", () => {
    expect(source).toContain('"Active"');
    expect(source).toContain('"Beta"');
    expect(source).toContain('"Coming Soon"');
  });

  it("contains all 3 status keys", () => {
    expect(source).toContain("active");
    expect(source).toContain("beta");
    expect(source).toContain("coming-soon");
  });

  it("uses JazLab brand color classes for each status", () => {
    expect(source).toContain("text-teal");
    expect(source).toContain("text-violet");
    expect(source).toContain("text-text-muted");
  });

  it("imports Badge from shadcn ui", () => {
    expect(source).toContain('@/components/ui/badge');
  });

  it("imports ExperimentStatus from experiments types", () => {
    expect(source).toContain("ExperimentStatus");
    expect(source).toContain("@/types/experiments");
  });

  it("uses font-mono and uppercase for lab-styled badge text", () => {
    expect(source).toContain("font-mono");
    expect(source).toContain("uppercase");
  });
});

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/SiteFooter.tsx"),
  "utf-8"
);

describe("SiteFooter component", () => {
  it("has a top border separator", () => {
    expect(source).toContain("border-t");
  });

  it("imports experiments array for data-driven experiment links", () => {
    expect(source).toContain("@/lib/experiments");
  });

  it("includes GitHub social link", () => {
    expect(source).toContain("github.com/daniel-beacham");
  });

  it("includes contact email", () => {
    expect(source).toContain("hello@jazlab.llc");
  });

  it("uses lab terminology for experiments section header", () => {
    expect(source).toContain("Experiments");
  });

  it("uses dynamic copyright year", () => {
    expect(source).toContain("getFullYear");
  });

  it("imports Github icon from lucide-react", () => {
    expect(source).toContain("Github");
    expect(source).toContain("lucide-react");
  });

  it("is a pure Server Component (no use client directive)", () => {
    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("'use client'");
  });
});

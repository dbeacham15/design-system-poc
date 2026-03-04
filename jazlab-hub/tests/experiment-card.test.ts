import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/ExperimentCard.tsx"),
  "utf-8"
);

describe("ExperimentCard component", () => {
  it("displays experiment title via experiment.name", () => {
    expect(source).toContain("experiment.name");
  });

  it("displays experiment description via experiment.description", () => {
    expect(source).toContain("experiment.description");
  });

  it("passes experiment status to ExperimentBadge", () => {
    expect(source).toContain("experiment.status");
  });

  it("links to experiment subdomain via experiment.subdomainUrl", () => {
    expect(source).toContain("experiment.subdomainUrl");
  });

  it("imports ExperimentBadge from @/components/ExperimentBadge", () => {
    expect(source).toMatch(/import.*ExperimentBadge.*from.*@\/components\/ExperimentBadge/);
  });

  it("imports Card primitives from @/components/ui/card", () => {
    // Multi-line destructured import: check both the named export and the module path
    expect(source).toContain("Card");
    expect(source).toContain("@/components/ui/card");
  });

  it("includes ArrowUpRight icon for external link", () => {
    expect(source).toContain("ArrowUpRight");
  });

  it("includes hover:border-violet/40 accent on card hover", () => {
    expect(source).toContain("hover:border-violet/40");
  });

  it("includes a preview area with accent color gradient", () => {
    expect(source).toContain("experiment.accentColor");
  });

  it("is a pure Server Component (no use client directive)", () => {
    expect(source).not.toContain('"use client"');
  });
});

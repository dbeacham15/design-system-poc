import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/SiteHeader.tsx"),
  "utf-8"
);

describe("SiteHeader component", () => {
  it("uses sticky positioning at the top of the viewport", () => {
    expect(source).toContain("sticky");
    expect(source).toContain("top-0");
  });

  it("uses z-50 to layer above page content", () => {
    expect(source).toContain("z-50");
  });

  it("uses backdrop-blur for glass effect", () => {
    expect(source).toContain("backdrop-blur");
  });

  it("includes a home link at /", () => {
    expect(source).toContain('href="/"');
  });

  it("includes link to experiments section using lab terminology", () => {
    expect(source).toContain('/#experiments');
  });

  it("imports experiments array for data-driven nav links", () => {
    expect(source).toContain("@/lib/experiments");
  });

  it("uses target=_blank for external experiment links", () => {
    expect(source).toContain('target="_blank"');
  });

  it("hides nav links on mobile (responsive)", () => {
    expect(source).toContain("hidden");
    expect(source).toContain("md:flex");
  });

  it("uses the SVG logo image instead of plain text", () => {
    expect(source).toContain("jazlab-logo.svg");
  });

  it("is a pure Server Component (no use client directive)", () => {
    expect(source).not.toContain('"use client"');
    expect(source).not.toContain("'use client'");
  });
});

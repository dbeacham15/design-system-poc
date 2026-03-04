import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/app/page.tsx"),
  "utf-8"
);

describe("Homepage (page.tsx)", () => {
  it("imports ParticleBackground from @/components/ParticleBackground", () => {
    expect(source).toContain("ParticleBackground");
    expect(source).toContain("@/components/ParticleBackground");
  });

  it("imports AnimatedBentoGrid from @/components/AnimatedBentoGrid", () => {
    expect(source).toContain("AnimatedBentoGrid");
    expect(source).toContain("@/components/AnimatedBentoGrid");
  });

  it("imports GradientHeading from @/components/GradientHeading", () => {
    expect(source).toContain("GradientHeading");
    expect(source).toContain("@/components/GradientHeading");
  });

  it("imports MotionWrapper from @/components/MotionWrapper", () => {
    expect(source).toContain("MotionWrapper");
    expect(source).toContain("@/components/MotionWrapper");
  });

  it('contains img element with src="/jazlab-logo.svg" for hero logo', () => {
    expect(source).toContain("/jazlab-logo.svg");
  });

  it("contains the homepage headline value proposition text", () => {
    expect(source).toContain("A laboratory for software experiments");
  });

  it('contains id="experiments" anchor for nav link from SiteHeader', () => {
    expect(source).toContain('id="experiments"');
  });

  it("contains experiments section identifier text", () => {
    expect(source).toContain("Experiments currently running");
  });

  it("uses responsive padding classes (px-4 or similar)", () => {
    expect(source).toContain("px-4");
  });

  it("uses max-w- container constraint for responsive layout", () => {
    expect(source).toMatch(/max-w-/);
  });

  it('does NOT contain "use client" directive (remains Server Component)', () => {
    expect(source).not.toContain('"use client"');
  });

  it("uses GradientHeading component with as prop", () => {
    expect(source).toContain("<GradientHeading");
  });
});

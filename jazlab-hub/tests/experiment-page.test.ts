import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const src = readFileSync(
  join(__dirname, "../src/app/experiments/[slug]/page.tsx"),
  "utf-8"
);

describe("experiments/[slug]/page.tsx - Experiment Marketing Page", () => {
  it("imports experiments from @/lib/experiments", () => {
    expect(src).toMatch(/import.*experiments.*from\s+['"]@\/lib\/experiments['"]/);
  });

  it("imports GradientHeading from @/components/GradientHeading", () => {
    expect(src).toMatch(/import.*GradientHeading.*from\s+['"]@\/components\/GradientHeading['"]/);
  });

  it("imports ExperimentBadge from @/components/ExperimentBadge", () => {
    expect(src).toMatch(/import.*ExperimentBadge.*from\s+['"]@\/components\/ExperimentBadge['"]/);
  });

  it("imports WaitlistForm from @/components/WaitlistForm", () => {
    expect(src).toMatch(/import.*WaitlistForm.*from\s+['"]@\/components\/WaitlistForm['"]/);
  });

  it("imports MotionWrapper from @/components/MotionWrapper", () => {
    expect(src).toMatch(/import.*MotionWrapper.*from\s+['"]@\/components\/MotionWrapper['"]/);
  });

  it("contains generateStaticParams function", () => {
    expect(src).toMatch(/export\s+function\s+generateStaticParams/);
  });

  it("references experiment.features (feature grid rendering)", () => {
    expect(src).toMatch(/experiment\.features/);
  });

  it("uses per-app Tailwind token classes for accent colors (ACCENT_CLASSES pattern)", () => {
    expect(src).toMatch(/border-blockabye|border-brickify|border-sournal|ACCENT_CLASSES/);
  });

  it("contains responsive Tailwind breakpoint classes", () => {
    expect(src).toMatch(/sm:|md:|lg:/);
  });

  it("contains lucide-react icon imports", () => {
    expect(src).toMatch(/from\s+['"]lucide-react['"]/);
  });

  it("does NOT contain 'use client' directive (stays Server Component)", () => {
    expect(src).not.toContain('"use client"');
  });

  it("contains WaitlistForm with appSlug or slug prop", () => {
    expect(src).toMatch(/WaitlistForm.*appSlug|appSlug.*WaitlistForm/);
  });

  it("contains a CTA link to experiment.subdomainUrl", () => {
    expect(src).toMatch(/experiment\.subdomainUrl/);
  });
});

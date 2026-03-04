import { describe, it, expect } from "vitest";
import { experiments } from "@/lib/experiments";
import type { Experiment } from "@/types/experiments";

describe("experiments data model", () => {
  it("exports exactly 3 experiments", () => {
    expect(experiments).toHaveLength(3);
  });

  it("each experiment has all required fields", () => {
    const requiredFields: (keyof Experiment)[] = [
      "slug",
      "name",
      "description",
      "status",
      "subdomainUrl",
      "accentColor",
      "features",
    ];

    experiments.forEach((exp) => {
      requiredFields.forEach((field) => {
        expect(exp).toHaveProperty(field);
        expect(exp[field]).toBeDefined();
      });
    });
  });

  it("has correct statuses for each experiment", () => {
    const blockabye = experiments.find((e) => e.slug === "blockabye");
    const brickify = experiments.find((e) => e.slug === "brickify");
    const sournal = experiments.find((e) => e.slug === "sournal");

    expect(blockabye?.status).toBe("beta");
    expect(brickify?.status).toBe("beta");
    expect(sournal?.status).toBe("coming-soon");
  });

  it("each experiment has at least 1 feature with title, description, and icon", () => {
    experiments.forEach((exp) => {
      expect(exp.features.length).toBeGreaterThanOrEqual(1);
      exp.features.forEach((feature) => {
        expect(feature.title).toBeDefined();
        expect(feature.title.length).toBeGreaterThan(0);
        expect(feature.description).toBeDefined();
        expect(feature.description.length).toBeGreaterThan(0);
        expect(feature.icon).toBeDefined();
        expect(feature.icon.length).toBeGreaterThan(0);
      });
    });
  });

  it("all slugs are unique", () => {
    const slugs = experiments.map((e) => e.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it("all accentColors are valid hex strings", () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    experiments.forEach((exp) => {
      expect(exp.accentColor).toMatch(hexPattern);
    });
  });
});

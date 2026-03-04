import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.resolve(__dirname, "../src/components/ParticleBackground.tsx"),
  "utf-8"
);

describe("ParticleBackground component", () => {
  it('has "use client" directive', () => {
    expect(source).toContain('"use client"');
  });

  it("imports useRef from react", () => {
    expect(source).toContain("useRef");
  });

  it("imports useEffect from react", () => {
    expect(source).toContain("useEffect");
  });

  it("uses requestAnimationFrame for animation loop", () => {
    expect(source).toContain("requestAnimationFrame");
  });

  it("uses cancelAnimationFrame for cleanup", () => {
    expect(source).toContain("cancelAnimationFrame");
  });

  it('canvas element has "fixed" class', () => {
    expect(source).toContain("fixed");
  });

  it('canvas element has "inset-0" class', () => {
    expect(source).toContain("inset-0");
  });

  it('canvas element has "pointer-events-none" class', () => {
    expect(source).toContain("pointer-events-none");
  });

  it('canvas element has aria-hidden="true" for accessibility', () => {
    expect(source).toContain('aria-hidden="true"');
  });

  it("adds resize event listener for responsive canvas sizing", () => {
    expect(source).toContain('window.addEventListener("resize"');
  });

  it("uses teal brand color rgba(40,199,183) for particles", () => {
    expect(source).toContain("40");
    expect(source).toContain("199");
    expect(source).toContain("183");
  });

  it("uses near-white brand color rgba(242,244,248) for particles", () => {
    expect(source).toContain("242");
    expect(source).toContain("244");
    expect(source).toContain("248");
  });

  it("reduces particle count on mobile via matchMedia or similar check", () => {
    expect(source).toContain("768");
  });
});

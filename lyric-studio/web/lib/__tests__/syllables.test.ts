import { describe, it, expect } from "vitest";
import { countSyllables } from "../syllables";

describe("countSyllables", () => {
  it("returns 0 for empty", () => expect(countSyllables("")).toBe(0));
  it("simple words", () => expect(countSyllables("walking down the street")).toBe(5));
  it("multi-syllable", () => expect(countSyllables("beautiful melodies")).toBeGreaterThan(5));
});

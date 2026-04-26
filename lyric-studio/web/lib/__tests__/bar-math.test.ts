import { describe, it, expect } from "vitest";
import { barToMs, msToBar, barLengthMs } from "../bar-math";

describe("bar math", () => {
  it("barLengthMs at 120 BPM 4/4 = 2000ms", () => {
    expect(barLengthMs(120, "4/4")).toBe(2000);
  });

  it("barToMs(1) at 120 BPM with 0 downbeat = 0", () => {
    expect(barToMs(1, 0, 120, "4/4")).toBe(0);
  });

  it("barToMs(2) at 120 BPM with 0 downbeat = 2000", () => {
    expect(barToMs(2, 0, 120, "4/4")).toBe(2000);
  });

  it("msToBar(2000) at 120 BPM = 2", () => {
    expect(msToBar(2000, 0, 120, "4/4")).toBe(2);
  });

  it("msToBar applies downbeat offset", () => {
    expect(msToBar(2500, 500, 120, "4/4")).toBe(2);
  });
});

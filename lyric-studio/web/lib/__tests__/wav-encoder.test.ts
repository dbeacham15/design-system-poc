import { describe, it, expect } from "vitest";
import { encodeWav, WAV_HEADER_SIZE } from "../wav-encoder";

describe("encodeWav", () => {
  it("produces a blob with RIFF header", () => {
    const chunk = new Float32Array([0.1, -0.1, 0.5]);
    const blob = encodeWav([chunk], 48000);
    expect(blob.type).toBe("audio/wav");
    expect(blob.size).toBe(WAV_HEADER_SIZE + chunk.length * 4);
  });

  it("handles empty chunks gracefully", () => {
    const blob = encodeWav([], 48000);
    expect(blob.size).toBe(WAV_HEADER_SIZE);
  });

  it("total sample count matches sum of chunks", () => {
    const a = new Float32Array(1000);
    const b = new Float32Array(500);
    const blob = encodeWav([a, b], 48000);
    expect(blob.size).toBe(WAV_HEADER_SIZE + 1500 * 4);
  });
});

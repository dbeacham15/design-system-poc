import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { analyzeAudio } from "../audio-service";

describe("analyzeAudio", () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  beforeEach(() => fetchSpy.mockReset());
  afterEach(() => fetchSpy.mockClear());

  it("posts to /analyze with wav_path and returns parsed body", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ bpm: 120, key: "C", time_sig: "4/4", duration_ms: 8000, downbeat_offset_ms: 0, rms_envelope: [], energy_regions: [] }), { status: 200 })
    );
    const result = await analyzeAudio("/tmp/test.wav");
    expect(result.bpm).toBe(120);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/analyze$/),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws on non-200", async () => {
    fetchSpy.mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(analyzeAudio("/tmp/test.wav")).rejects.toThrow();
  });
});

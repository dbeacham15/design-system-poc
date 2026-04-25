const AUDIO_SERVICE_URL =
  process.env.AUDIO_SERVICE_URL || "http://127.0.0.1:8000";

export interface AnalysisResult {
  bpm: number;
  key: string;
  time_sig: string;
  duration_ms: number;
  downbeat_offset_ms: number;
  rms_envelope: number[];
  energy_regions: { start_ms: number; end_ms: number; level: string }[];
}

export async function analyzeAudio(wav_path: string): Promise<AnalysisResult> {
  const r = await fetch(`${AUDIO_SERVICE_URL}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ wav_path }),
  });
  if (!r.ok) throw new Error(`audio service /analyze failed: ${r.status}`);
  return r.json();
}

export interface SectionFeatures {
  rms_mean: number;
  rms_max: number;
  spectral_centroid_hz: number;
  spectral_rolloff_hz: number;
  zero_crossing_rate: number;
  harmonic_percussive_ratio: number;
  duration_ms: number;
}

export async function extractSectionFeatures(
  wav_path: string,
  start_ms: number,
  end_ms: number
): Promise<SectionFeatures> {
  const r = await fetch(`${AUDIO_SERVICE_URL}/features`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ wav_path, start_ms, end_ms }),
  });
  if (!r.ok) throw new Error(`audio service /features failed: ${r.status}`);
  return r.json();
}

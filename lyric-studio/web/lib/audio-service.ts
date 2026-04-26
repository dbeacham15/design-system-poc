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

export interface ProcessRequest {
  project_id: string;
  take_id: string;
  take_path: string;
  instrumental_path: string;
  key: string;
  genre: string;
  output_dir: string;
  trim_start_ms?: number;
  trim_end_ms?: number;
  latency_ms?: number;
  pitch_correction?: boolean;
  harmony?: boolean;
}

export async function startProcessing(req: ProcessRequest): Promise<{ job_id: string }> {
  const r = await fetch(`${AUDIO_SERVICE_URL}/process`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(`audio service /process failed: ${r.status} ${body.detail ?? ""}`);
  }
  return r.json();
}

export async function pollJob(jobId: string): Promise<{
  job_id: string;
  status: "pending" | "running" | "done" | "error";
  progress: number;
  error: string | null;
}> {
  const r = await fetch(`${AUDIO_SERVICE_URL}/jobs/${jobId}`);
  if (!r.ok) throw new Error(`audio service /jobs/${jobId} failed: ${r.status}`);
  return r.json();
}

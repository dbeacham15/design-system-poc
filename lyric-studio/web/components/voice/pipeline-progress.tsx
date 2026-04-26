"use client";
import { useEffect, useState, useCallback } from "react";

const STAGE_LABELS: Record<number, string> = {
  0: "Starting…",
  5: "Loading take",
  15: "Trimming & aligning",
  35: "Pitch correction",
  60: "DSP chain",
  75: "Doubling",
  85: "Harmony",
  100: "Done",
};

function stageLabel(progress: number): string {
  const keys = Object.keys(STAGE_LABELS)
    .map(Number)
    .sort((a, b) => b - a);
  for (const k of keys) {
    if (progress >= k) return STAGE_LABELS[k];
  }
  return "Processing…";
}

interface PipelineProgressProps {
  jobId: string;
  onDone: () => void;
  onError: (msg: string) => void;
}

export function PipelineProgress({ jobId, onDone, onError }: PipelineProgressProps) {
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("Starting…");

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/voice/jobs/${jobId}`);
      if (!r.ok) return;
      const data = await r.json();
      setProgress(data.progress ?? 0);
      setLabel(stageLabel(data.progress ?? 0));
      if (data.status === "done") {
        onDone();
        return;
      }
      if (data.status === "error") {
        onError(data.error ?? "Processing failed");
        return;
      }
      setTimeout(poll, 1000);
    } catch {
      setTimeout(poll, 2000);
    }
  }, [jobId, onDone, onError]);

  useEffect(() => {
    poll();
  }, [poll]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

"use client";
import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Stem {
  id: string;
  label: string;
  url: string;
}

interface StemMixerProps {
  projectId: string;
  takeId: string;
  hasHarmony: boolean;
}

export function StemMixer({ projectId, takeId, hasHarmony }: StemMixerProps) {
  const base = `/api/projects/${projectId}/takes/${takeId}/stems`;
  const stems: Stem[] = [
    { id: "raw", label: "Lead (raw)", url: `${base}/lead-raw.wav` },
    { id: "tuned", label: "Lead (tuned)", url: `${base}/lead-tuned.wav` },
    { id: "dL", label: "Double L", url: `${base}/lead-double-L.wav` },
    { id: "dR", label: "Double R", url: `${base}/lead-double-R.wav` },
    ...(hasHarmony ? [{ id: "harmony", label: "Harmony", url: `${base}/lead-harmony.wav` }] : []),
    { id: "bounce", label: "Bounce (full)", url: `${base}/bounce.wav` },
  ];

  const [muted, setMuted] = useState<Record<string, boolean>>({});
  const [solo, setSolo] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLAudioElement | null>>({});

  const playAll = useCallback(() => {
    Object.values(refs.current).forEach((el) => { if (el) { el.currentTime = 0; el.play(); } });
  }, []);

  const stopAll = useCallback(() => {
    Object.values(refs.current).forEach((el) => { if (el) el.pause(); });
  }, []);

  function isMuted(id: string) {
    if (solo) return solo !== id;
    return muted[id] ?? false;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" onClick={playAll}>▶ Play all</Button>
        <Button size="sm" variant="outline" onClick={stopAll}>■ Stop</Button>
      </div>
      <div className="space-y-1">
        {stems.map((stem) => (
          <div key={stem.id} className="flex items-center gap-2">
            <span className="text-xs w-32 truncate">{stem.label}</span>
            <button
              className={`text-xs px-1 py-0.5 rounded border ${
                solo === stem.id ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
              onClick={() => setSolo((s) => (s === stem.id ? null : stem.id))}
            >
              S
            </button>
            <button
              className={`text-xs px-1 py-0.5 rounded border ${
                isMuted(stem.id) ? "bg-destructive/20 text-destructive" : "bg-muted"
              }`}
              onClick={() => setMuted((m) => ({ ...m, [stem.id]: !m[stem.id] }))}
            >
              M
            </button>
            <audio
              ref={(el) => { refs.current[stem.id] = el; }}
              src={stem.url}
              muted={isMuted(stem.id)}
              className="h-6 flex-1"
              controls
            />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Take } from "@/lib/takes";

interface TakeItemProps {
  take: Take;
  projectId: string;
  onProcess: (takeId: string) => void;
  onDelete: (takeId: string) => void;
  onUpdate: (takeId: string, patch: Partial<Take>) => void;
}

function TakeItem({ take, projectId, onProcess, onDelete, onUpdate }: TakeItemProps) {
  const waveRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const [trimStart, setTrimStart] = useState(String(take.trim_start_ms));
  const [trimEnd, setTrimEnd] = useState(String(take.trim_end_ms));

  useEffect(() => {
    if (!waveRef.current) return;
    const ws = WaveSurfer.create({
      container: waveRef.current,
      height: 40,
      waveColor: "var(--muted-foreground)",
      progressColor: "var(--primary)",
      url: `/api/projects/${projectId}/takes/${take.id}/stems/raw.wav`,
    });
    wsRef.current = ws;
    return () => ws.destroy();
  }, [take.id, projectId]);

  const saveTrim = useCallback(() => {
    onUpdate(take.id, {
      trim_start_ms: Number(trimStart) || 0,
      trim_end_ms: Number(trimEnd) || 0,
    });
  }, [take.id, trimStart, trimEnd, onUpdate]);

  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Take — {new Date(take.created_at).toLocaleTimeString()}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={() => onProcess(take.id)}
            disabled={take.is_processed === 1}
          >
            {take.is_processed === 1 ? "Processed" : "Process"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => wsRef.current?.playPause()}>
            ▶
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(take.id)}>
            ✕
          </Button>
        </div>
      </div>

      <div ref={waveRef} className="w-full" />

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Trim in (ms)</Label>
          <input
            type="number"
            className="w-full text-xs border rounded px-2 py-1 bg-background"
            value={trimStart}
            onChange={(e) => setTrimStart(e.target.value)}
            onBlur={saveTrim}
            min={0}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Trim out (ms, 0=end)</Label>
          <input
            type="number"
            className="w-full text-xs border rounded px-2 py-1 bg-background"
            value={trimEnd}
            onChange={(e) => setTrimEnd(e.target.value)}
            onBlur={saveTrim}
            min={0}
          />
        </div>
      </div>

      <div className="flex gap-4 text-xs">
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={take.pitch_correction === 1}
            onChange={(e) => onUpdate(take.id, { pitch_correction: e.target.checked ? 1 : 0 })}
          />
          Pitch correction
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={take.harmony_enabled === 1}
            onChange={(e) => onUpdate(take.id, { harmony_enabled: e.target.checked ? 1 : 0 })}
          />
          Harmony
        </label>
      </div>
    </div>
  );
}


interface TakeListProps {
  takes: Take[];
  projectId: string;
  onProcess: (takeId: string) => void;
  onDelete: (takeId: string) => void;
  onUpdate: (takeId: string, patch: Partial<Take>) => void;
}

export function TakeList({ takes, projectId, onProcess, onDelete, onUpdate }: TakeListProps) {
  if (takes.length === 0) {
    return <p className="text-sm text-muted-foreground">No takes yet — record one above.</p>;
  }
  return (
    <div className="space-y-3">
      {takes.map((t) => (
        <TakeItem
          key={t.id}
          take={t}
          projectId={projectId}
          onProcess={onProcess}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      ))}
    </div>
  );
}

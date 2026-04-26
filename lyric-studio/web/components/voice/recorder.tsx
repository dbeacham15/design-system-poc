"use client";
import { useCallback, useRef, useState } from "react";
import { encodeWav } from "@/lib/wav-encoder";
import { Button } from "@/components/ui/button";

const MAX_DURATION_MS = 15 * 60 * 1000;  // 15 min hard cap
const WARN_DURATION_MS = 10 * 60 * 1000; // 10 min warning

interface RecorderProps {
  deviceId: string;
  projectId: string;
  onTakeUploaded: (takeId: string) => void;
  onStreamAcquired?: (stream: MediaStream | null) => void;
}

export function Recorder({ deviceId, projectId, onTakeUploaded, onStreamAcquired }: RecorderProps) {
  const [state, setState] = useState<"idle" | "recording" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const startTimeRef = useRef<number>(0);
  const warnedRef = useRef(false);
  const hardCapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    chunksRef.current = [];
    warnedRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId }, sampleRate: 48000, channelCount: 1 },
      });
    } catch (e) {
      setError(`Microphone access denied. ${e instanceof Error ? e.message : ""}`);
      setState("error");
      return;
    }

    onStreamAcquired?.(stream);

    const ctx = new AudioContext({ sampleRate: 48000 });
    contextRef.current = ctx;

    await ctx.audioWorklet.addModule("/audio-worklet-processor.js");
    const node = new AudioWorkletNode(ctx, "recorder-processor");
    workletNodeRef.current = node;

    node.port.onmessage = (e: MessageEvent<Float32Array>) => {
      chunksRef.current.push(e.data);
      const elapsed = Date.now() - startTimeRef.current;
      if (!warnedRef.current && elapsed >= WARN_DURATION_MS) {
        warnedRef.current = true;
        // Non-blocking console warning (UI banner in Task 13/14)
        console.warn("Recording approaching 10 min limit.");
      }
    };

    const source = ctx.createMediaStreamSource(stream);
    source.connect(node);
    node.connect(ctx.destination); // required to keep worklet alive in some browsers

    startTimeRef.current = Date.now();
    setState("recording");

    hardCapTimerRef.current = setTimeout(() => stopRecording(), MAX_DURATION_MS);
  }, [deviceId]);

  const stopRecording = useCallback(async () => {
    if (hardCapTimerRef.current) clearTimeout(hardCapTimerRef.current);
    workletNodeRef.current?.port.postMessage("stop");
    await contextRef.current?.close();
    onStreamAcquired?.(null);

    setState("uploading");

    const wav = encodeWav(chunksRef.current, 48000);
    const form = new FormData();
    form.append("file", wav, "take.wav");

    try {
      const r = await fetch(`/api/projects/${projectId}/takes`, {
        method: "POST",
        body: form,
      });
      if (!r.ok) throw new Error(`upload failed: ${r.status}`);
      const { take } = await r.json();
      onTakeUploaded(take.id);
      setState("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setState("error");
    }
  }, [projectId, onTakeUploaded]);

  if (state === "error") {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={() => setState("idle")}>Retry</Button>
      </div>
    );
  }

  if (state === "uploading") {
    return <p className="text-sm text-muted-foreground">Uploading take…</p>;
  }

  if (state === "recording") {
    return (
      <Button variant="destructive" onClick={stopRecording}>
        Stop Recording
      </Button>
    );
  }

  return (
    <Button onClick={startRecording} disabled={!deviceId}>
      Record Take
    </Button>
  );
}

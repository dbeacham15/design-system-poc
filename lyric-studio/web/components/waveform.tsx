"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.js";

interface Region {
  id: string;
  start: number;  // seconds
  end: number;    // seconds
  color: string;
  drag?: boolean;
  resize?: boolean;
}

export interface EnergyRegion {
  start: number; // seconds
  end: number;   // seconds
  level: string; // "low" | "medium" | "high"
}

export interface WaveformRef {
  play(): void;
  pause(): void;
  seekToSec(s: number): void;
  getCurrentSec(): number;
}

interface Props {
  audioUrl: string;
  regions: Region[];
  barGridLines?: number[];           // bar boundary times in seconds
  energyRegions?: EnergyRegion[];
  onRegionCreated?: (start: number, end: number) => void;
  onRegionUpdated?: (id: string, start: number, end: number) => void;
  onTimeUpdate?: (seconds: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onFinish?: () => void;
}

const ENERGY_COLORS: Record<string, string> = {
  low: "rgba(80, 160, 255, 0.10)",
  medium: "rgba(255, 200, 60, 0.12)",
  high: "rgba(255, 90, 90, 0.14)",
};

export const Waveform = forwardRef<WaveformRef, Props>(function Waveform(
  {
    audioUrl,
    regions,
    barGridLines = [],
    energyRegions = [],
    onRegionCreated,
    onRegionUpdated,
    onTimeUpdate,
    onPlay,
    onPause,
    onFinish,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(0);

  // Keep callbacks fresh inside the wavesurfer effect without re-instantiating it.
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onFinishRef = useRef(onFinish);
  const onRegionCreatedRef = useRef(onRegionCreated);
  const onRegionUpdatedRef = useRef(onRegionUpdated);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { onFinishRef.current = onFinish; }, [onFinish]);
  useEffect(() => { onRegionCreatedRef.current = onRegionCreated; }, [onRegionCreated]);
  useEffect(() => { onRegionUpdatedRef.current = onRegionUpdated; }, [onRegionUpdated]);

  useImperativeHandle(
    ref,
    () => ({
      play() {
        wsRef.current?.play();
      },
      pause() {
        wsRef.current?.pause();
      },
      seekToSec(s: number) {
        const ws = wsRef.current;
        if (!ws) return;
        const dur = ws.getDuration();
        if (!dur || dur <= 0) return;
        const clamped = Math.max(0, Math.min(s, dur));
        ws.setTime(clamped);
      },
      getCurrentSec() {
        return wsRef.current?.getCurrentTime() ?? 0;
      },
    }),
    []
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const regionsPlugin = RegionsPlugin.create();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      url: audioUrl,
      waveColor: "#999",
      progressColor: "#444",
      height: 96,
      plugins: [regionsPlugin],
    });
    wsRef.current = ws;
    regionsPluginRef.current = regionsPlugin;

    regionsPlugin.enableDragSelection({ color: "rgba(0, 100, 255, 0.2)" });

    regionsPlugin.on("region-created", (r) => {
      onRegionCreatedRef.current?.(r.start, r.end);
    });

    regionsPlugin.on("region-updated", (r) => {
      onRegionUpdatedRef.current?.(r.id, r.start, r.end);
    });

    function updatePps() {
      const dur = ws.getDuration();
      const w = containerRef.current?.clientWidth ?? 0;
      if (dur > 0 && w > 0) setPixelsPerSecond(w / dur);
    }

    ws.on("ready", updatePps);

    ws.on("audioprocess", (currentTime) => {
      onTimeUpdateRef.current?.(currentTime);
    });

    ws.on("seeking", (currentTime) => {
      onTimeUpdateRef.current?.(currentTime);
    });

    ws.on("interaction", (newTime) => {
      // Fired when the user clicks on the waveform.
      onTimeUpdateRef.current?.(newTime);
    });

    ws.on("play", () => {
      onPlayRef.current?.();
    });

    ws.on("pause", () => {
      onPauseRef.current?.();
    });

    ws.on("finish", () => {
      onFinishRef.current?.();
    });

    const ro = new ResizeObserver(updatePps);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      ws.destroy();
      wsRef.current = null;
    };
  }, [audioUrl]);

  // sync regions in
  useEffect(() => {
    const rp = regionsPluginRef.current;
    if (!rp) return;
    rp.clearRegions();
    for (const r of regions) {
      rp.addRegion({ id: r.id, start: r.start, end: r.end, color: r.color, drag: r.drag, resize: r.resize });
    }
  }, [regions]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div ref={containerRef} className="w-full" />
      {pixelsPerSecond > 0 && (
        <div className="pointer-events-none absolute inset-0">
          {energyRegions.map((er, i) => {
            const left = er.start * pixelsPerSecond;
            const width = Math.max(0, (er.end - er.start) * pixelsPerSecond);
            const bg = ENERGY_COLORS[er.level] ?? "rgba(128,128,128,0.08)";
            return (
              <div
                key={`energy-${i}`}
                className="absolute top-0 bottom-0"
                style={{ left, width, background: bg }}
              />
            );
          })}
          {barGridLines.map((t, i) => {
            // every 8 bars: darkest, every 4: medium, otherwise light
            const tier = i % 8 === 0 ? "rgba(0,0,0,0.55)" : i % 4 === 0 ? "rgba(0,0,0,0.30)" : "rgba(0,0,0,0.12)";
            const left = t * pixelsPerSecond;
            return (
              <div
                key={`bar-${i}`}
                className="absolute top-0 bottom-0"
                style={{ left, width: 1, background: tier }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});

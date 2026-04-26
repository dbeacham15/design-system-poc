"use client";
import { useEffect, useRef } from "react";
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

interface Props {
  audioUrl: string;
  regions: Region[];
  onRegionCreated?: (start: number, end: number) => void;
  onRegionUpdated?: (id: string, start: number, end: number) => void;
}

export function Waveform({ audioUrl, regions, onRegionCreated, onRegionUpdated }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);

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
      onRegionCreated?.(r.start, r.end);
    });

    regionsPlugin.on("region-updated", (r) => {
      onRegionUpdated?.(r.id, r.start, r.end);
    });

    return () => {
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

  return <div ref={containerRef} className="w-full" />;
}

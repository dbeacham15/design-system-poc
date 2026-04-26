"use client";
import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/projects";
import type { Section } from "@/lib/sections";
import { Waveform, type EnergyRegion } from "@/components/waveform";
import { TimeSigBanner } from "@/components/time-sig-banner";
import { SectionCard } from "@/components/section-card";
import { barLengthMs, barToMs, msToBar, snapMsToBar } from "@/lib/bar-math";

export function ProjectEditor({
  project, initialSections,
}: { project: Project; initialSections: Section[] }) {
  const [sections, setSections] = useState(initialSections);

  const audioUrl = `/api/projects/${project.id}/instrumental`;

  const regions = useMemo(() => {
    if (!project.bpm || !project.time_sig) return [];
    return sections.map((s) => ({
      id: s.id,
      start: barToMs(s.bar_start, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!) / 1000,
      end: barToMs(s.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!) / 1000,
      color: "rgba(120, 80, 200, 0.2)",
      drag: true, resize: true,
    }));
  }, [sections, project]);

  const barGridLines = useMemo<number[]>(() => {
    if (!project.bpm || !project.time_sig || !project.duration_ms) return [];
    if (project.time_sig !== "4/4") return [];
    const offsetMs = project.downbeat_offset_ms ?? 0;
    const barMs = barLengthMs(project.bpm, project.time_sig);
    if (barMs <= 0) return [];
    const lines: number[] = [];
    for (let t = offsetMs; t <= project.duration_ms; t += barMs) {
      if (t < 0) continue;
      lines.push(t / 1000);
    }
    return lines;
  }, [project]);

  const energyRegions = useMemo<EnergyRegion[]>(() => {
    if (!project.energy_regions_json) return [];
    try {
      const parsed = JSON.parse(project.energy_regions_json) as Array<{
        start_ms?: number; end_ms?: number; start?: number; end?: number; level: string;
      }>;
      return parsed
        .map((r) => {
          const startMs = r.start_ms ?? r.start ?? 0;
          const endMs = r.end_ms ?? r.end ?? 0;
          return { start: startMs / 1000, end: endMs / 1000, level: r.level };
        })
        .filter((r) => r.end > r.start);
    } catch {
      return [];
    }
  }, [project]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!project.bpm || !project.time_sig) return;
      const beatMs = 60000 / project.bpm;
      let delta = 0;
      if (e.key === "ArrowLeft") delta = -beatMs;
      if (e.key === "ArrowRight") delta = beatMs;
      if (delta === 0) return;
      e.preventDefault();
      const newOffset = (project.downbeat_offset_ms ?? 0) + delta;
      fetch(`/api/projects/${project.id}/update`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ downbeat_offset_ms: Math.round(newOffset) }),
      }).then(() => location.reload());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project]);

  async function handleRegionCreated(startSec: number, endSec: number) {
    if (!project.bpm || !project.time_sig) return;
    const startMs = snapMsToBar(startSec * 1000, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
    const endMs = snapMsToBar(endSec * 1000, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
    const bar_start = msToBar(startMs, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
    const bar_end = msToBar(endMs, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig) - 1;
    const r = await fetch(`/api/projects/${project.id}/sections`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: `Section ${sections.length + 1}`, bar_start, bar_end }),
    });
    if (r.ok) {
      const { section } = await r.json();
      setSections((s) => [...s, section]);
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
      <p className="text-sm text-muted-foreground mb-4">
        {project.bpm ? `${Math.round(project.bpm)} BPM` : "..."} · {project.key} · {project.time_sig} · {project.genre}
      </p>
      {project.time_sig && <TimeSigBanner timeSig={project.time_sig} />}
      {project.instrumental_path && (
        <Waveform
          audioUrl={audioUrl}
          regions={regions}
          barGridLines={barGridLines}
          energyRegions={energyRegions}
          onRegionCreated={handleRegionCreated}
        />
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Drag on the waveform to create a section. Use ←/→ to nudge the downbeat by one beat.
      </p>
      <div className="mt-6 space-y-4">
        {sections.map((s) => (
          <SectionCard
            key={s.id}
            projectId={project.id}
            section={s}
            genre={project.genre}
          />
        ))}
      </div>
    </main>
  );
}

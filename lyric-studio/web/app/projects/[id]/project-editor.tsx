"use client";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/projects";
import type { Section } from "@/lib/sections";
import { Waveform } from "@/components/waveform";
import { barToMs, msToBar, snapMsToBar } from "@/lib/bar-math";

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
      {project.instrumental_path && <Waveform audioUrl={audioUrl} regions={regions} onRegionCreated={handleRegionCreated} />}
      <p className="text-xs text-muted-foreground mt-2">Drag on the waveform to create a section.</p>
    </main>
  );
}

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Project } from "@/lib/projects";
import type { Section } from "@/lib/sections";
import type { Take } from "@/lib/takes";
import { VoiceStudio } from "@/components/voice/voice-studio";
import { Waveform, type EnergyRegion, type WaveformRef } from "@/components/waveform";
import { TimeSigBanner } from "@/components/time-sig-banner";
import { SectionCard } from "@/components/section-card";
import { PlaybackControls } from "@/components/playback-controls";
import type { Line } from "@/components/line-card";
import { Button } from "@/components/ui/button";
import { barLengthMs, barToMs, msToBar, snapMsToBar } from "@/lib/bar-math";

function parseLines(json: string | null | undefined): Line[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && typeof l === "object")
      .map((l) => ({
        text: typeof l.text === "string" ? l.text : "",
        bar_start: typeof l.bar_start === "number" ? l.bar_start : 0,
        bar_end: typeof l.bar_end === "number" ? l.bar_end : 0,
      }));
  } catch {
    return [];
  }
}

export function ProjectEditor({
  project, initialSections, initialTakes,
}: { project: Project; initialSections: Section[]; initialTakes: Take[] }) {
  const [sections, setSections] = useState(initialSections);
  const [currentMs, setCurrentMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState(project.status);
  const waveformRef = useRef<WaveformRef>(null);
  const playBarsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [tab, setTab] = useState<"lyrics" | "voice">("lyrics");

  const lyricsDone = status === "lyrics_done";

  const toggleLyricsDone = useCallback(async () => {
    const next = lyricsDone ? "drafting" : "lyrics_done";
    const r = await fetch(`/api/projects/${project.id}/update`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (r.ok) setStatus(next);
  }, [lyricsDone, project.id]);

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

  const activeLineKey = useMemo<string | null>(() => {
    if (!project.bpm || !project.time_sig) return null;
    for (const s of sections) {
      const lines = parseLines(s.lines_json);
      for (let i = 0; i < lines.length; i++) {
        const start = barToMs(lines[i].bar_start, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!);
        const end = barToMs(lines[i].bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm!, project.time_sig!);
        if (currentMs >= start && currentMs < end) return `${s.id}:${i}`;
      }
    }
    return null;
  }, [currentMs, sections, project]);

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

  useEffect(() => {
    return () => {
      if (playBarsTimerRef.current) {
        clearTimeout(playBarsTimerRef.current);
        playBarsTimerRef.current = null;
      }
    };
  }, []);

  async function handleSectionDelete(sectionId: string) {
    const r = await fetch(`/api/projects/${project.id}/sections/${sectionId}`, { method: "DELETE" });
    if (r.ok) setSections((prev) => prev.filter((s) => s.id !== sectionId));
  }

  async function handleSectionRename(sectionId: string, name: string) {
    await fetch(`/api/projects/${project.id}/sections/${sectionId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSections((prev) => prev.map((s) => s.id === sectionId ? { ...s, name } : s));
  }

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

  const handlePlay = useCallback(() => {
    if (playBarsTimerRef.current) {
      clearTimeout(playBarsTimerRef.current);
      playBarsTimerRef.current = null;
    }
    waveformRef.current?.play();
  }, []);

  const handlePause = useCallback(() => {
    if (playBarsTimerRef.current) {
      clearTimeout(playBarsTimerRef.current);
      playBarsTimerRef.current = null;
    }
    waveformRef.current?.pause();
  }, []);

  const handleStop = useCallback(() => {
    if (playBarsTimerRef.current) {
      clearTimeout(playBarsTimerRef.current);
      playBarsTimerRef.current = null;
    }
    waveformRef.current?.pause();
    waveformRef.current?.seekToSec(0);
    setCurrentMs(0);
  }, []);

  const handlePlayLineBars = useCallback(
    (line: Line) => {
      if (!project.bpm || !project.time_sig) return;
      const ws = waveformRef.current;
      if (!ws) return;
      const startMs = barToMs(line.bar_start, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
      const endMs = barToMs(line.bar_end + 1, project.downbeat_offset_ms ?? 0, project.bpm, project.time_sig);
      const durationMs = Math.max(0, endMs - startMs);
      if (playBarsTimerRef.current) clearTimeout(playBarsTimerRef.current);
      ws.seekToSec(startMs / 1000);
      ws.play();
      playBarsTimerRef.current = setTimeout(() => {
        waveformRef.current?.pause();
        playBarsTimerRef.current = null;
      }, durationMs);
    },
    [project]
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Tab bar */}
      <div className="flex border-b shrink-0">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "lyrics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("lyrics")}
        >
          Lyrics
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "voice" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("voice")}
        >
          Voice Studio
        </button>
      </div>

      {tab === "voice" ? (
        <div className="flex-1 overflow-y-auto">
          <VoiceStudio project={project} />
        </div>
      ) : (
        <main className="p-8">
          <div className="flex items-start justify-between mb-2 gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{project.title}</h1>
              <p className="text-sm text-muted-foreground">
                {project.bpm ? `${Math.round(project.bpm)} BPM` : "..."} · {project.key} · {project.time_sig} · {project.genre}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant={lyricsDone ? "default" : "outline"} onClick={toggleLyricsDone}>
                {lyricsDone ? "Lyrics done ✓" : "Mark lyrics done"}
              </Button>
              <a href={`/api/projects/${project.id}/export`} download>
                <Button variant="outline">Download zip</Button>
              </a>
            </div>
          </div>
          {project.time_sig && <TimeSigBanner timeSig={project.time_sig} />}
          {project.instrumental_path && (
            <Waveform
              ref={waveformRef}
              audioUrl={audioUrl}
              regions={regions}
              barGridLines={barGridLines}
              energyRegions={energyRegions}
              onRegionCreated={handleRegionCreated}
              onTimeUpdate={(sec) => setCurrentMs(sec * 1000)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onFinish={() => setIsPlaying(false)}
            />
          )}
          {project.instrumental_path && (
            <PlaybackControls
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
            />
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Drag on the waveform to create a section. Use ←/→ to nudge the downbeat by one beat.
          </p>
          <div className="mt-6 space-y-4">
            {sections.map((s) => {
              const activeIdx =
                activeLineKey && activeLineKey.startsWith(`${s.id}:`)
                  ? Number(activeLineKey.split(":")[1])
                  : null;
              return (
                <SectionCard
                  key={s.id}
                  projectId={project.id}
                  section={s}
                  genre={project.genre}
                  activeLineIdx={activeIdx}
                  onPlayLineBars={handlePlayLineBars}
                  onRename={(name) => handleSectionRename(s.id, name)}
                  onDelete={() => handleSectionDelete(s.id)}
                />
              );
            })}
          </div>
        </main>
      )}
    </div>
  );
}

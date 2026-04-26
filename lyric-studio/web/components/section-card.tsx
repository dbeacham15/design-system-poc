"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Section } from "@/lib/sections";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LineCard, type Line } from "@/components/line-card";
import { syllableBudget } from "@/lib/syllable-budget";

interface Props {
  projectId: string;
  section: Section;
  genre: string;
  activeLineIdx?: number | null;
  onPlayLineBars?: (line: Line) => void;
}

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

export function SectionCard({ projectId, section, genre, activeLineIdx = null, onPlayLineBars }: Props) {
  const [lines, setLines] = useState<Line[]>(() => parseLines(section.lines_json));
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<string>(section.notes ?? "");
  const [generating, setGenerating] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const linesPerPhrase = section.lines_per_phrase || 2;
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedJsonRef = useRef<string>(section.lines_json ?? "[]");

  // Debounced autosave of lines_json
  useEffect(() => {
    const json = JSON.stringify(lines);
    if (json === lastSavedJsonRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastSavedJsonRef.current = json;
      fetch(`/api/projects/${projectId}/sections/${section.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines_json: json }),
      }).catch(() => {});
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [lines, projectId, section.id]);

  const budgets = useMemo(
    () =>
      lines.map((l) =>
        syllableBudget({
          bars: Math.max(1, l.bar_end - l.bar_start + 1),
          beats_per_bar: 4,
          genre,
        })
      ),
    [lines, genre]
  );

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }

  function deleteLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveLine(idx: number, direction: -1 | 1) {
    setLines((prev) => {
      const target = idx + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function addLine() {
    setLines((prev) => {
      const prevEnd = prev.length > 0 ? prev[prev.length - 1].bar_end : section.bar_start - 1;
      const bar_start = prevEnd + 1;
      const rawEnd = bar_start + linesPerPhrase - 1;
      const bar_end = Math.min(rawEnd, section.bar_end);
      if (bar_start > section.bar_end) return prev;
      return [...prev, { text: "", bar_start, bar_end }];
    });
  }

  function applyPasteLyrics() {
    const raw = pasteText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (raw.length === 0) {
      setPasteOpen(false);
      setPasteText("");
      return;
    }
    const next: Line[] = [];
    let cursor = section.bar_start;
    for (const text of raw) {
      if (cursor > section.bar_end) break;
      const rawEnd = cursor + linesPerPhrase - 1;
      const bar_end = Math.min(rawEnd, section.bar_end);
      next.push({ text, bar_start: cursor, bar_end });
      cursor = bar_end + 1;
    }
    setLines(next);
    setPasteOpen(false);
    setPasteText("");
  }

  async function generateNotes() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/section-notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ section_id: section.id }),
      });
      const data = await res.json();
      if (res.ok && data.notes) {
        setNotes(data.notes);
        setNotesOpen(true);
      }
    } catch {
      // silently ignore — user can retry
    } finally {
      setGenerating(false);
    }
  }

  function saveNotes() {
    if ((section.notes ?? "") === notes) return;
    fetch(`/api/projects/${projectId}/sections/${section.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => {});
  }

  return (
    <section className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{section.name}</h2>
          <p className="text-xs text-muted-foreground">
            bars {section.bar_start}–{section.bar_end} · {linesPerPhrase} bars/line
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setNotesOpen((v) => !v)}
            aria-expanded={notesOpen}
          >
            {notesOpen ? "Hide notes" : "Notes"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generateNotes}
            disabled={generating}
          >
            {generating ? "Generating…" : notes ? "Regenerate notes" : "Generate notes"}
          </Button>
        </div>
      </div>

      {notesOpen && (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Section notes (mood, theme, imagery)..."
          className="min-h-24"
        />
      )}

      <div className="space-y-2">
        {lines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No lines yet. Add one or paste lyrics to get started.
          </p>
        )}
        {lines.map((line, idx) => (
          <LineCard
            key={idx}
            line={line}
            budget={budgets[idx] ?? 0}
            lineIndex={idx}
            sectionId={section.id}
            isActive={activeLineIdx === idx}
            onChange={(patch) => updateLine(idx, patch)}
            onDelete={() => deleteLine(idx)}
            onMoveUp={() => moveLine(idx, -1)}
            onMoveDown={() => moveLine(idx, 1)}
            onRhyme={async ({ end_word, syllable_budget, line_index }) => {
              const res = await fetch("/api/ai/rhyme", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ section_id: section.id, end_word, syllable_budget, line_index }),
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "rhyme request failed");
              }
              const data = await res.json();
              return data.rhymes;
            }}
            onPolish={async ({ section_id, line_index, line }) => {
              const res = await fetch("/api/ai/polish", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ section_id, line_index, line }),
              });
              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? "polish request failed");
              }
              const data = await res.json();
              return data.polished;
            }}
            onPlayBars={() => onPlayLineBars?.(line)}
          />
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={addLine}>
          + Add line
        </Button>
        <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
          <DialogTrigger
            render={
              <Button size="sm" variant="outline">
                + Paste lyrics
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Paste lyrics</DialogTitle>
            </DialogHeader>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Walking down the boulevard\nLights are flickering on..."}
              className="min-h-40"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPasteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={applyPasteLyrics}>Replace</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

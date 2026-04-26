"use client";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { countSyllables } from "@/lib/syllables";
import { RhymePopover } from "@/components/rhyme-popover";

export interface Line {
  text: string;
  bar_start: number;
  bar_end: number;
}

interface Props {
  line: Line;
  budget: number;
  lineIndex: number;
  sectionId: string;
  isActive?: boolean;
  onChange: (patch: Partial<Line>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRhyme: (args: { end_word: string; syllable_budget: number; line_index: number }) => Promise<{ word: string; type: "perfect" | "slant" }[]>;
  onPolish: () => void;
  onPlayBars: () => void;
}

export function LineCard({
  line, budget, lineIndex, sectionId, isActive = false, onChange, onDelete, onMoveUp, onMoveDown, onRhyme, onPolish, onPlayBars,
}: Props) {
  const [text, setText] = useState(line.text);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const syllableCount = countSyllables(text);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text !== line.text) onChange({ text });
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text]);

  const overBudget = syllableCount - budget;
  const color =
    overBudget <= 0 ? "text-green-600" :
    overBudget <= 2 ? "text-yellow-600" : "text-red-600";

  function getEndWord(): string {
    const words = text.trim().split(/\s+/);
    return words[words.length - 1] || "";
  }

  function handlePick(word: string) {
    const words = text.trim().split(/\s+/);
    const endWord = words[words.length - 1] ?? "";
    let newText: string;
    if (endWord.toLowerCase() === word.toLowerCase()) {
      newText = text; // same word, no change
    } else if (text.trim() === "") {
      newText = word;
    } else {
      newText = text.trimEnd() + " " + word;
    }
    setText(newText);
    onChange({ text: newText });
  }

  return (
    <div
      className={`flex items-center gap-2 group rounded-md p-1 transition-shadow ${
        isActive ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
    >
      <Badge variant="outline">bars {line.bar_start}-{line.bar_end}</Badge>
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a line..." />
      <span className={`text-xs ${color} w-20 text-right`}>{syllableCount} / {budget}</span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        <Button size="sm" variant="ghost" onClick={onPlayBars} aria-label="Play bars">♪</Button>
        <RhymePopover
          trigger={<Button size="sm" variant="ghost">Rhyme</Button>}
          onFetch={() => onRhyme({ end_word: getEndWord(), syllable_budget: budget, line_index: lineIndex })}
          onPick={handlePick}
        />
        {/* TODO: wire Polish button — Task 19 */}
        <Button size="sm" variant="ghost" onClick={onPolish} disabled>Polish</Button>
        <Button size="sm" variant="ghost" onClick={onMoveUp} aria-label="Up">↑</Button>
        <Button size="sm" variant="ghost" onClick={onMoveDown} aria-label="Down">↓</Button>
        <Button size="sm" variant="ghost" onClick={onDelete}>×</Button>
      </div>
    </div>
  );
}

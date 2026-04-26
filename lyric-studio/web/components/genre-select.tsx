"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const GENRES = [
  "pop", "indie", "lofi", "rap/hip-hop", "rnb",
  "electronic", "rock", "ballad", "folk", "other",
] as const;

export function GenreSelect({
  value, onChange,
}: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger><SelectValue placeholder="Select a genre" /></SelectTrigger>
      <SelectContent>
        {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

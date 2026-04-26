"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  trigger: React.ReactNode;
  onFetch: () => Promise<{ word: string; type: "perfect" | "slant" }[]>;
  onPick: (word: string) => void;
}

export function RhymePopover({ trigger, onFetch, onPick }: Props) {
  const [rhymes, setRhymes] = useState<{ word: string; type: string }[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRhymes(await onFetch());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  return (
    <Popover onOpenChange={(open) => { if (open && !rhymes) load(); }}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent>
        {loading && <p className="text-sm">Loading...</p>}
        {error && (
          <div>
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={load}>Retry</Button>
          </div>
        )}
        {rhymes && (
          <div className="grid grid-cols-2 gap-1">
            {rhymes.map((r) => (
              <button
                key={r.word}
                onClick={() => onPick(r.word)}
                className="text-left text-sm hover:bg-accent rounded px-2 py-1"
              >
                {r.word} <span className="text-xs text-muted-foreground">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

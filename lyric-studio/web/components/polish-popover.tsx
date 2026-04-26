"use client";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Props {
  trigger: React.ReactNode;
  original: string;
  onFetch: () => Promise<string>;
  onAccept: (polished: string) => void;
}

export function PolishPopover({ trigger, original, onFetch, onAccept }: Props) {
  const [polished, setPolished] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPolished(await onFetch());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  }

  return (
    <Popover onOpenChange={(open) => { if (open && polished === null) load(); }}>
      <PopoverTrigger render={trigger as React.ReactElement} />
      <PopoverContent className="w-80">
        {loading && <p className="text-sm">Polishing...</p>}
        {error && (
          <div>
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" onClick={load}>Retry</Button>
          </div>
        )}
        {polished && (
          <div className="space-y-2">
            <p className="text-sm line-through text-muted-foreground">{original}</p>
            <p className="text-sm font-medium">{polished}</p>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setPolished(null)}>Dismiss</Button>
              <Button size="sm" onClick={() => onAccept(polished)}>Accept</Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

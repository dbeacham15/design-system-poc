"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ABListenProps {
  projectId: string;
  takeId: string;
}

export function ABListen({ projectId, takeId }: ABListenProps) {
  const [mode, setMode] = useState<"raw" | "bounce">("raw");

  const rawUrl = `/api/projects/${projectId}/takes/${takeId}/stems/lead-raw.wav`;
  const bounceUrl = `/api/projects/${projectId}/takes/${takeId}/stems/bounce.wav`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={mode === "raw" ? "default" : "outline"}
          onClick={() => setMode("raw")}
        >
          A — Raw + Inst
        </Button>
        <Button
          size="sm"
          variant={mode === "bounce" ? "default" : "outline"}
          onClick={() => setMode("bounce")}
        >
          B — Bounce
        </Button>
      </div>
      <audio
        key={mode}
        controls
        className="w-full"
        src={mode === "raw" ? rawUrl : bounceUrl}
      />
    </div>
  );
}

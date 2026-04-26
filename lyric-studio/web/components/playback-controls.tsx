"use client";
import { Button } from "@/components/ui/button";

export function PlaybackControls({
  isPlaying, onPlay, onPause, onStop,
}: { isPlaying: boolean; onPlay: () => void; onPause: () => void; onStop: () => void }) {
  return (
    <div className="flex gap-2 my-3">
      {!isPlaying ? <Button onClick={onPlay}>▶ Play</Button> : <Button onClick={onPause}>⏸ Pause</Button>}
      <Button variant="ghost" onClick={onStop}>⏹ Stop</Button>
    </div>
  );
}

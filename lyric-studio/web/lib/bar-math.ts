export function beatsPerBar(timeSig: string): number {
  const [num] = timeSig.split("/").map(Number);
  return num || 4;
}

export function barLengthMs(bpm: number, timeSig: string): number {
  const beatMs = 60000 / bpm;
  return Math.round(beatMs * beatsPerBar(timeSig));
}

export function barToMs(bar: number, downbeatOffsetMs: number, bpm: number, timeSig: string): number {
  return downbeatOffsetMs + (bar - 1) * barLengthMs(bpm, timeSig);
}

export function msToBar(ms: number, downbeatOffsetMs: number, bpm: number, timeSig: string): number {
  const offset = ms - downbeatOffsetMs;
  return Math.floor(offset / barLengthMs(bpm, timeSig)) + 1;
}

export function snapMsToBar(ms: number, downbeatOffsetMs: number, bpm: number, timeSig: string): number {
  const bar = Math.max(1, Math.round((ms - downbeatOffsetMs) / barLengthMs(bpm, timeSig)) + 1);
  return barToMs(bar, downbeatOffsetMs, bpm, timeSig);
}

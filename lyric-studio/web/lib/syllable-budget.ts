const SYLLABLES_PER_BEAT_BY_GENRE: Record<string, number> = {
  "pop": 1.5,
  "indie": 1.4,
  "lofi": 1.2,
  "rap/hip-hop": 3.5,
  "rnb": 1.6,
  "electronic": 1.4,
  "rock": 1.5,
  "ballad": 1.0,
  "folk": 1.3,
  "other": 1.5,
};

export function syllableBudget(args: {
  bars: number;
  beats_per_bar: number;
  genre: string;
}): number {
  const sb = SYLLABLES_PER_BEAT_BY_GENRE[args.genre] ?? 1.5;
  return Math.round(args.bars * args.beats_per_bar * sb);
}

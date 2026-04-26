import { syllable } from "syllable";

export function countSyllables(text: string): number {
  if (!text.trim()) return 0;
  return syllable(text);
}

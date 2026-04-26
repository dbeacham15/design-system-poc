import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const SONNET = "claude-sonnet-4-6";
export const HAIKU = "claude-haiku-4-5-20251001";

export interface TrackContext {
  title: string;
  bpm: number;
  key: string;
  time_sig: string;
  genre: string;
}

export async function generateSectionNotes(args: {
  track: TrackContext;
  section: { name: string; bar_start: number; bar_end: number };
  features: {
    rms_mean: number; rms_max: number;
    spectral_centroid_hz: number; spectral_rolloff_hz: number;
    zero_crossing_rate: number; harmonic_percussive_ratio: number;
    duration_ms: number;
  };
}): Promise<string> {
  const trackBlock = `
Track: "${args.track.title}"
Genre: ${args.track.genre}
BPM: ${args.track.bpm}
Key: ${args.track.key}
Time signature: ${args.track.time_sig}
`.trim();

  const sectionBlock = `
Section: ${args.section.name} (bars ${args.section.bar_start}-${args.section.bar_end})
Duration: ${(args.features.duration_ms / 1000).toFixed(1)}s
RMS mean: ${args.features.rms_mean.toFixed(3)}, max: ${args.features.rms_max.toFixed(3)}
Spectral centroid: ${args.features.spectral_centroid_hz.toFixed(0)} Hz
Spectral rolloff: ${args.features.spectral_rolloff_hz.toFixed(0)} Hz
Harmonic/percussive ratio: ${args.features.harmonic_percussive_ratio.toFixed(2)}
Zero-crossing rate: ${args.features.zero_crossing_rate.toFixed(3)}
`.trim();

  const message = await client.messages.create({
    model: SONNET,
    max_tokens: 300,
    system: [
      {
        type: "text",
        text: "You are a producer giving creative-brief notes to a lyric writer. Be concise (2-3 sentences). Describe energy, feel, what kinds of lyrics work here, and any pacing guidance. Do NOT write lyrics. Do NOT use vague terms like 'beautiful'; be specific about what the writer should aim for.",
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: trackBlock,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: sectionBlock }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("unexpected response type");
  return block.text;
}

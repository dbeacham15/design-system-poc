import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";

export const DATA_ROOT = path.resolve(process.cwd(), "..", "data");

export function projectDir(id: string): string {
  return path.join(DATA_ROOT, "projects", id);
}

export function ensureProjectDir(id: string): string {
  const dir = projectDir(id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function transcodeTo48kWav(
  inputPath: string,
  outputPath: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-y", "-i", inputPath,
      "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le",
      outputPath,
    ]);
    let stderr = "";
    ff.stderr.on("data", (b) => (stderr += b.toString()));
    ff.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (${code}): ${stderr}`));
    });
  });
}

import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import archiver from "archiver";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { buildLyricsJson, buildLyricsMd } from "@/lib/exports";

function slug(s: string) {
  const out = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return out || "untitled";
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const project = getProject(getDb(), id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const exportRoot = path.join(os.homedir(), "Music", "lyric-studio", slug(project.title));
  fs.mkdirSync(exportRoot, { recursive: true });

  const lyricsJson = buildLyricsJson(getDb(), id);
  const lyricsMd = buildLyricsMd(getDb(), id);
  fs.writeFileSync(path.join(exportRoot, "lyrics.json"), JSON.stringify(lyricsJson, null, 2));
  fs.writeFileSync(path.join(exportRoot, "lyrics.md"), lyricsMd);
  fs.writeFileSync(path.join(exportRoot, "project.json"), JSON.stringify({ project, lyrics: lyricsJson }, null, 2));
  if (project.instrumental_path && fs.existsSync(project.instrumental_path)) {
    fs.copyFileSync(project.instrumental_path, path.join(exportRoot, "instrumental.wav"));
  }

  // Build zip
  const zipPath = path.join(exportRoot, `${slug(project.title)}.zip`);
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    out.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(out);
    for (const f of ["lyrics.json", "lyrics.md", "project.json", "instrumental.wav"]) {
      const p = path.join(exportRoot, f);
      if (fs.existsSync(p)) archive.file(p, { name: f });
    }
    archive.finalize();
  });

  const buf = fs.readFileSync(zipPath);
  return new NextResponse(buf, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${slug(project.title)}.zip"`,
    },
  });
}

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getTake } from "@/lib/takes";
import { DATA_ROOT } from "@/lib/storage";
import fs from "node:fs";
import path from "node:path";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string; takeId: string; filename: string }> }
) {
  const { id, takeId, filename } = await ctx.params;

  if (!getTake(getDb(), takeId)) {
    return NextResponse.json({ error: "take not found" }, { status: 404 });
  }

  // Guard against path traversal — only allow the bare filename, no directory components
  const safe = path.basename(filename);
  if (safe !== filename) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }

  const stemPath = path.join(DATA_ROOT, "projects", id, "takes", takeId, safe);
  if (!fs.existsSync(stemPath)) {
    return NextResponse.json({ error: "stem not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(stemPath);
  return new Response(buffer, {
    headers: {
      "content-type": "audio/wav",
      "content-length": String(buffer.byteLength),
    },
  });
}

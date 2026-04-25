import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listTrash } from "@/lib/projects";

export async function GET() {
  return NextResponse.json({ projects: listTrash(getDb()) });
}

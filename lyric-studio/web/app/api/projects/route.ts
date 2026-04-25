import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { listProjects, createProject } from "@/lib/projects";

export async function GET() {
  const projects = listProjects(getDb());
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.title || !body.genre) {
    return NextResponse.json({ error: "title and genre required" }, { status: 400 });
  }
  const project = createProject(getDb(), body);
  return NextResponse.json({ project }, { status: 201 });
}

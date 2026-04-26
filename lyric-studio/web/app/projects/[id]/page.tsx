import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getProject } from "@/lib/projects";
import { listSections } from "@/lib/sections";
import { ProjectEditor } from "./project-editor";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProject(getDb(), id);
  if (!project) notFound();
  const sections = listSections(getDb(), id);
  return <ProjectEditor project={project} initialSections={sections} />;
}

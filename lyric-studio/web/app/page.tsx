import Link from "next/link";
import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/projects";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const projects = listProjects(getDb());

  return (
    <main className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Lyric Studio</h1>
          <p className="text-muted-foreground">Your songs in progress</p>
        </div>
        <div className="flex gap-2">
          <Link href="/trash"><Button variant="ghost">Trash</Button></Link>
          <Link href="/projects/new"><Button>New project</Button></Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </main>
  );
}

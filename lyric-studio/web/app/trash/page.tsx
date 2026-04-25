"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/projects";

export default function TrashPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  async function load() {
    const r = await fetch("/api/projects/trash");
    setProjects((await r.json()).projects);
  }

  useEffect(() => { load(); }, []);

  async function restore(id: string) {
    await fetch(`/api/projects/${id}/restore`, { method: "POST" });
    load();
  }

  async function purge(id: string) {
    if (!confirm("Permanently delete? This cannot be undone.")) return;
    await fetch(`/api/projects/${id}?permanent=true`, { method: "DELETE" });
    load();
  }

  return (
    <main className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Trash</h1>
        <Link href="/"><Button variant="ghost">← Back</Button></Link>
      </div>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">Trash is empty.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader><CardTitle>{p.title}</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm" onClick={() => restore(p.id)}>Restore</Button>
                <Button size="sm" variant="destructive" onClick={() => purge(p.id)}>Delete forever</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}

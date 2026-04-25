"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GenreSelect } from "@/components/genre-select";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("pop");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !genre || !file) {
      setError("Title, genre, and file are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r1 = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, genre }),
      });
      if (!r1.ok) throw new Error("Failed to create project");
      const { project } = await r1.json();

      const fd = new FormData();
      fd.append("file", file);
      const r2 = await fetch(`/api/projects/${project.id}/upload`, {
        method: "POST", body: fd,
      });
      if (!r2.ok) {
        const body = await r2.json().catch(() => ({}));
        throw new Error(body.error || "Upload/analysis failed");
      }
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container mx-auto p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">New project</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="title">Song title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label>Genre</Label>
          <GenreSelect value={genre} onChange={setGenre} />
        </div>
        <div>
          <Label htmlFor="file">Instrumental (WAV / MP3)</Label>
          <Input id="file" type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Analyzing..." : "Create"}
        </Button>
      </form>
    </main>
  );
}

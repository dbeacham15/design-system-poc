import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:bg-accent transition-colors">
        <CardHeader>
          <CardTitle className="truncate">{project.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1">
          <Badge variant={project.instrumental_path ? "default" : "outline"}>
            instrumental {project.instrumental_path ? "✓" : "·"}
          </Badge>
          <Badge variant="outline">
            sections {/* will be wired after sections list exists */}·
          </Badge>
          <Badge variant={project.status === "lyrics_done" ? "default" : "outline"}>
            lyrics {project.status === "lyrics_done" ? "✓" : "·"}
          </Badge>
          {project.bpm && (
            <span className="text-xs text-muted-foreground ml-auto">
              {Math.round(project.bpm)} BPM · {project.key}
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

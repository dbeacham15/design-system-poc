import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center">
      <h2 className="text-xl font-semibold mb-2">No projects yet</h2>
      <p className="text-muted-foreground mb-4">
        Upload an instrumental to get started.
      </p>
      <Link href="/projects/new"><Button>Create your first project</Button></Link>
    </div>
  );
}

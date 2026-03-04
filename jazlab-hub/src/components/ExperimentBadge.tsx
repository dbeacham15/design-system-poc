// src/components/ExperimentBadge.tsx
// Source: shadcn Badge docs + CVA pattern
// Pure Server Component — status-to-label mapping, no interactivity
import { Badge } from "@/components/ui/badge";
import type { ExperimentStatus } from "@/types/experiments";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  ExperimentStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-teal/10 text-teal border-teal/20",
  },
  beta: {
    label: "Beta",
    className: "bg-violet/10 text-violet border-violet/20",
  },
  "coming-soon": {
    label: "Coming Soon",
    className: "bg-surface-overlay text-text-muted border-border",
  },
};

interface ExperimentBadgeProps {
  status: ExperimentStatus;
  className?: string;
}

export function ExperimentBadge({ status, className }: ExperimentBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-mono text-xs uppercase tracking-wider",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}

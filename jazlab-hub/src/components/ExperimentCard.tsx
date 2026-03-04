// src/components/ExperimentCard.tsx
// Pure Server Component — data is static, no interactivity required
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { ExperimentBadge } from "@/components/ExperimentBadge";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Experiment } from "@/types/experiments";
import { cn } from "@/lib/utils";

interface ExperimentCardProps {
  experiment: Experiment;
  featured?: boolean; // spans 2 columns in bento grid (lg breakpoint only)
  className?: string;
}

export function ExperimentCard({
  experiment,
  featured = false,
  className,
}: ExperimentCardProps) {
  return (
    <Card
      className={cn(
        "bg-surface-raised border-border hover:border-violet/40 transition-colors",
        // md:col-span-1 lg:col-span-2 prevents overflow on tablet 2-column grid (Pitfall 3)
        featured && "md:col-span-1 lg:col-span-2",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-text-primary">
            {experiment.name}
          </CardTitle>
          <ExperimentBadge status={experiment.status} />
        </div>
        <CardDescription className="text-text-secondary">
          {experiment.description}
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Link
          href={experiment.subdomainUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-teal hover:text-cyan transition-colors"
        >
          Open experiment
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

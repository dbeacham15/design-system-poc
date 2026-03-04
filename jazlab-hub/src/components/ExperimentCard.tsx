import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { ExperimentBadge } from "@/components/ExperimentBadge";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Blocks, PenLine } from "lucide-react";
import type { Experiment } from "@/types/experiments";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  blockabye: BookOpen,
  brickify: Blocks,
  sournal: PenLine,
};

interface ExperimentCardProps {
  experiment: Experiment;
  className?: string;
}

export function ExperimentCard({ experiment, className }: ExperimentCardProps) {
  const Icon = ICON_MAP[experiment.slug] ?? BookOpen;

  return (
    <Card
      className={cn(
        "bg-surface-raised border-border hover:border-violet/40 transition-all duration-300 h-full flex flex-col overflow-hidden group",
        className
      )}
    >
      {/* Preview image area */}
      <div
        className="h-44 flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${experiment.accentColor}22, ${experiment.accentColor}08)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 70% 30%, ${experiment.accentColor}40, transparent 60%)`,
          }}
        />
        <Icon
          className="h-16 w-16 transition-transform duration-300 group-hover:scale-110"
          style={{ color: experiment.accentColor }}
          strokeWidth={1.5}
        />
      </div>

      <CardHeader className="flex-none">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-display text-text-primary text-lg">
            {experiment.name}
          </CardTitle>
          <ExperimentBadge status={experiment.status} />
        </div>
        <CardDescription className="text-text-secondary text-sm leading-relaxed">
          {experiment.description}
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto pt-0">
        <Link
          href={experiment.subdomainUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-teal hover:text-cyan transition-colors font-medium"
        >
          Open experiment
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}

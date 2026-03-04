// src/components/BentoGrid.tsx
// Pure Server Component — layout only, no JS interactivity
import { experiments } from "@/lib/experiments";
import { ExperimentCard } from "@/components/ExperimentCard";

export function BentoGrid() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[280px] gap-4"
    >
      {experiments.map((experiment, index) => (
        <ExperimentCard
          key={experiment.slug}
          experiment={experiment}
          featured={index === 0}
        />
      ))}
    </div>
  );
}

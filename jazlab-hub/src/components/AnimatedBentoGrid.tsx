"use client";

import { motion } from "motion/react";
import { ExperimentCard } from "@/components/ExperimentCard";
import { experiments } from "@/lib/experiments";

export function AnimatedBentoGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {experiments.map((experiment, index) => (
        <motion.div
          key={experiment.slug}
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.5, delay: index * 0.12 }}
        >
          <ExperimentCard experiment={experiment} />
        </motion.div>
      ))}
    </div>
  );
}

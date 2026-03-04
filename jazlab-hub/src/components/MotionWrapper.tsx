"use client";

import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface MotionWrapperProps extends HTMLMotionProps<"div"> {
  className?: string;
}

export function MotionWrapper({
  children,
  className,
  ...motionProps
}: MotionWrapperProps) {
  return (
    <motion.div className={cn(className)} {...motionProps}>
      {children}
    </motion.div>
  );
}

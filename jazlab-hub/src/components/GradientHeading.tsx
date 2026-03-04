// src/components/GradientHeading.tsx
// Pure Server Component — no interactivity, CSS only
import { cn } from "@/lib/utils";

interface GradientHeadingProps {
  as?: "h1" | "h2" | "h3" | "h4";
  children: React.ReactNode;
  className?: string;
}

export function GradientHeading({
  as: Tag = "h2",
  children,
  className,
}: GradientHeadingProps) {
  return (
    <Tag
      className={cn(
        // Tailwind v4 syntax: use bg-linear-to-r (NOT the v3 name)
        // from-violet and to-teal use @theme tokens from globals.css
        "bg-linear-to-r from-violet to-teal bg-clip-text text-transparent inline-block",
        "font-display font-extrabold",
        className
      )}
    >
      {children}
    </Tag>
  );
}

// src/components/SiteHeader.tsx
// Server Component — static nav links, no interactivity
// Active link highlighting deferred to Phase 3 (avoids client boundary cost)
import Link from "next/link";
import { experiments } from "@/lib/experiments";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border"
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Lab identity */}
        <Link
          href="/"
          className="hover:opacity-80 transition-opacity"
        >
          <img
            src="/jazlab-logo.png"
            alt="JazLab"
            width={150}
            height={40}
            className="h-8 w-auto"
          />
        </Link>

        {/* Navigation links — lab terminology enforced (BRAND-05) */}
        <ul className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
          <li>
            <Link
              href="/#experiments"
              className="hover:text-text-primary transition-colors"
            >
              Experiments
            </Link>
          </li>
          {/* Per-experiment links */}
          {experiments.map((exp) => (
            <li key={exp.slug}>
              <Link
                href={exp.subdomainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                {exp.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile: hamburger menu deferred to Phase 3 */}
      </nav>
    </header>
  );
}

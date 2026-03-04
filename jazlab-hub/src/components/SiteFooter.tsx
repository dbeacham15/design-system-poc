// src/components/SiteFooter.tsx
// Pure Server Component — static links only
// new Date().getFullYear() runs at build time (static generation) — correct behavior
import Link from "next/link";
import { experiments } from "@/lib/experiments";
import { Github } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand column */}
          <div>
            <p className="font-display font-bold text-text-primary">JazLab</p>
            <p className="mt-2 text-sm text-text-muted">
              A laboratory for software experiments.
            </p>
          </div>

          {/* Experiments column — lab terminology (BRAND-05) */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
              Experiments
            </p>
            <ul className="space-y-2">
              {experiments.map((exp) => (
                <li key={exp.slug}>
                  <Link
                    href={exp.subdomainUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {exp.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-3">
              Contact
            </p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/daniel-beacham"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@jazlab.llc"
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  hello@jazlab.llc
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-border text-xs text-text-muted">
          &copy; {new Date().getFullYear()} JazLab. All experiments reserved.
        </div>
      </div>
    </footer>
  );
}

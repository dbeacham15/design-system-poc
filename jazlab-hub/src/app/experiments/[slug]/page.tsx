import { experiments } from "@/lib/experiments";
import { notFound } from "next/navigation";
import { GradientHeading } from "@/components/GradientHeading";
import { ExperimentBadge } from "@/components/ExperimentBadge";
import { WaitlistForm } from "@/components/WaitlistForm";
import { MotionWrapper } from "@/components/MotionWrapper";
import {
  Book,
  Palette,
  Clock,
  Image,
  CheckCircle,
  List,
  Edit,
  Lock,
  Network,
} from "lucide-react";
import React from "react";
import Link from "next/link";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  book: Book,
  palette: Palette,
  clock: Clock,
  image: Image,
  check: CheckCircle,
  list: List,
  edit: Edit,
  lock: Lock,
  network: Network,
};

const ACCENT_CLASSES: Record<string, { border: string; text: string; bg: string }> = {
  blockabye: { border: "border-blockabye", text: "text-blockabye", bg: "bg-blockabye/10" },
  brickify: { border: "border-brickify", text: "text-brickify", bg: "bg-brickify/10" },
  sournal: { border: "border-sournal", text: "text-sournal", bg: "bg-sournal/10" },
};

export function generateStaticParams() {
  return experiments.map((exp) => ({ slug: exp.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const experiment = experiments.find((e) => e.slug === slug);
  if (!experiment) return {};
  return {
    title: `${experiment.name} — JazLab Experiment`,
    description: experiment.description,
  };
}

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Next.js 16: params is a Promise
}) {
  const { slug } = await params;
  const experiment = experiments.find((e) => e.slug === slug);

  if (!experiment) notFound();

  const accent = ACCENT_CLASSES[slug] ?? ACCENT_CLASSES["blockabye"];

  return (
    <main>
      {/* Hero section */}
      <section className={`border-t-4 ${accent.border}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <MotionWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ExperimentBadge status={experiment.status} className="mb-4" />
            <GradientHeading as="h1" className="text-4xl sm:text-5xl mt-4">
              {experiment.name}
            </GradientHeading>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              {experiment.description}
            </p>
            <div className="mt-8">
              <a
                href={experiment.subdomainUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-block rounded-lg px-6 py-3 font-display font-semibold text-white transition-opacity hover:opacity-80 ${accent.bg} ${accent.text} border ${accent.border}`}
              >
                Try {experiment.name}
              </a>
            </div>
          </MotionWrapper>
        </div>
      </section>

      {/* Features section */}
      <section>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <GradientHeading as="h2" className="text-3xl text-center mb-12">
            What makes it special
          </GradientHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {experiment.features.map((feature, index) => {
              const IconComponent = ICON_MAP[feature.icon];
              return (
                <MotionWrapper
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="bg-surface-raised border border-border rounded-lg p-6 h-full">
                    {IconComponent && (
                      <div
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${accent.bg} mb-4`}
                      >
                        <IconComponent className={`h-8 w-8 ${accent.text}`} />
                      </div>
                    )}
                    <h3 className="font-display font-semibold text-text-primary mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-text-secondary">
                      {feature.description}
                    </p>
                  </div>
                </MotionWrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* Waitlist section */}
      <section>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <GradientHeading as="h2" className="text-3xl mb-4">
            Get early access
          </GradientHeading>
          <p className="text-text-secondary">
            Be the first to know when {experiment.name} launches new features.
          </p>
          <WaitlistForm appSlug={experiment.slug} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-8 text-center">
        <Link
          href="/#experiments"
          className="text-text-muted hover:text-text-secondary transition-colors text-sm"
        >
          &larr; Back to all experiments
        </Link>
      </section>
    </main>
  );
}

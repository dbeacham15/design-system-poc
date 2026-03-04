import { experiments } from "@/lib/experiments";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return experiments.map((exp) => ({ slug: exp.slug }));
}

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Next.js 16: params is a Promise
}) {
  const { slug } = await params;
  const experiment = experiments.find((e) => e.slug === slug);

  if (!experiment) notFound();

  return (
    <main className="min-h-screen p-8">
      <h1 className="font-display text-4xl font-extrabold text-text-primary">
        {experiment.name}
      </h1>
      <p className="mt-4 text-text-secondary">{experiment.description}</p>
      <span className="mt-4 inline-block font-mono text-sm uppercase tracking-wider text-text-muted">
        {experiment.status}
      </span>
    </main>
  );
}

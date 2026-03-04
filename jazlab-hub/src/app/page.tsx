import { ParticleBackground } from "@/components/ParticleBackground";
import { AnimatedBentoGrid } from "@/components/AnimatedBentoGrid";
import { GradientHeading } from "@/components/GradientHeading";
import { MotionWrapper } from "@/components/MotionWrapper";

export default function Home() {
  return (
    <>
      {/* Cosmic particle background — fixed canvas behind all content */}
      <ParticleBackground />

      {/* Hero section */}
      <section className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center w-full">
          <MotionWrapper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* JazLab logo */}
            <img
              src="/jazlab-logo.png"
              alt="JazLab"
              width={300}
              height={80}
              className="mx-auto h-16 sm:h-20 w-auto mb-8"
            />

            {/* Gradient headline */}
            <GradientHeading
              as="h1"
              className="text-4xl sm:text-5xl lg:text-6xl mb-4"
            >
              A laboratory for software experiments
            </GradientHeading>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
              Where ideas become experiments and experiments become products.
            </p>
          </MotionWrapper>
        </div>
      </section>

      {/* Experiments section */}
      <section
        id="experiments"
        className="pb-16"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <GradientHeading
            as="h2"
            className="text-2xl sm:text-3xl mb-8 text-center"
          >
            Experiments currently running
          </GradientHeading>

          <AnimatedBentoGrid />
        </div>
      </section>
    </>
  );
}

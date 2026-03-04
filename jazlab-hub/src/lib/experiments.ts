import type { Experiment } from "@/types/experiments";

export const experiments: Experiment[] = [
  {
    slug: "blockabye",
    name: "BlockAbye",
    description:
      "Create personalized bedtime storybooks starring your child. A new illustrated adventure every night, in 6 unique art styles. Fresh stories in minutes — no more re-reading the same books.",
    status: "beta",
    subdomainUrl: `${process.env.NEXT_PUBLIC_BLOCKABYE_URL ?? "https://blockabye.jazlab.llc"}`,
    accentColor: "#FF7B9C",
    features: [
      {
        title: "AI-generated storybooks",
        description: "Custom illustrated books from your family photos and prompts",
        icon: "book",
      },
      {
        title: "6 art styles",
        description: "Watercolor, cartoon, storybook, and more",
        icon: "palette",
      },
      {
        title: "Ready in minutes",
        description: "Fresh story every night, no re-reading required",
        icon: "clock",
      },
    ],
  },
  {
    slug: "brickify",
    name: "Brickify",
    description:
      "AI tool that converts images or concepts into structurally valid LEGO-style builds and step-by-step instructions.",
    status: "beta",
    subdomainUrl: `${process.env.NEXT_PUBLIC_BRICKIFY_URL ?? "https://brickify.jazlab.llc"}`,
    accentColor: "#FF9843",
    features: [
      {
        title: "Image to LEGO",
        description: "Convert any photo into a brick-buildable design",
        icon: "image",
      },
      {
        title: "Structural validation",
        description: "Builds that actually hold together",
        icon: "check",
      },
      {
        title: "Step-by-step instructions",
        description: "Build guides anyone can follow",
        icon: "list",
      },
    ],
  },
  {
    slug: "sournal",
    name: "Sournal",
    description:
      "A private space to reflect, explore, and be heard. Structured journaling and thinking companion for capturing ideas and organizing thoughts.",
    status: "coming-soon",
    subdomainUrl: `${process.env.NEXT_PUBLIC_SOURNAL_URL ?? "https://sournal.jazlab.llc"}`,
    accentColor: "#9B8AFB",
    features: [
      {
        title: "Guided reflection",
        description: "Structured prompts for deeper thinking",
        icon: "edit",
      },
      {
        title: "Private by default",
        description: "Your thoughts stay yours",
        icon: "lock",
      },
      {
        title: "Idea organization",
        description: "Link and structure your thinking over time",
        icon: "network",
      },
    ],
  },
];

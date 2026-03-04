import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "JazLab — A laboratory for software experiments",
    template: "%s | JazLab",
  },
  description: "A laboratory for software experiments by Daniel Beacham.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://jazlab.llc"
  ),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-surface text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}

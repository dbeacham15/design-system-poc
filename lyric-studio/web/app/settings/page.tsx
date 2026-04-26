"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [status, setStatus] = useState<string | null>(null);

  async function verify() {
    setStatus("Checking...");
    const r = await fetch("/api/settings/verify-key", { method: "POST" });
    const body = await r.json();
    setStatus(body.ok ? "API key works" : `Failed: ${body.error}`);
  }

  return (
    <main className="container mx-auto p-8 max-w-xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Anthropic API key</h2>
        <p className="text-sm text-muted-foreground">
          Set <code>ANTHROPIC_API_KEY</code> in your <code>.env</code> and restart the app.
        </p>
        <Button onClick={verify}>Verify API key</Button>
        {status && <p className="text-sm">{status}</p>}
      </section>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [latency, setLatency] = useState<number>(25);
  const [latencyStatus, setLatencyStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/latency")
      .then((r) => r.json())
      .then((d) => setLatency(d.latency_ms ?? 25))
      .catch(() => {});
  }, []);

  async function verifyKey() {
    setApiStatus("Checking...");
    const r = await fetch("/api/settings/verify-key", { method: "POST" });
    const body = await r.json();
    setApiStatus(body.ok ? "API key works" : `Failed: ${body.error}`);
  }

  async function saveLatency() {
    setLatencyStatus("Saving...");
    const r = await fetch("/api/settings/latency", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ latency_ms: latency }),
    });
    const body = await r.json();
    setLatencyStatus(r.ok ? `Saved (${body.latency_ms} ms)` : `Error: ${body.error}`);
  }

  return (
    <main className="container mx-auto p-8 max-w-xl space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Anthropic API key</h2>
        <p className="text-sm text-muted-foreground">
          Set <code>ANTHROPIC_API_KEY</code> in your <code>.env</code> and restart the app.
        </p>
        <Button onClick={verifyKey}>Verify API key</Button>
        {apiStatus && <p className="text-sm">{apiStatus}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Recording latency</h2>
        <p className="text-sm text-muted-foreground">
          Compensates for USB audio roundtrip. Default 25 ms works for MV7 + macOS USB Class.
          Adjust if vocals feel early or late in the bounce.
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="latency-input">Latency (ms)</Label>
          <input
            id="latency-input"
            type="number"
            min={0}
            max={500}
            step={5}
            value={latency}
            onChange={(e) => setLatency(Number(e.target.value))}
            className="w-24 border rounded px-2 py-1 text-sm bg-background"
          />
          <Button size="sm" onClick={saveLatency}>Save</Button>
        </div>
        {latencyStatus && <p className="text-sm">{latencyStatus}</p>}
      </section>
    </main>
  );
}

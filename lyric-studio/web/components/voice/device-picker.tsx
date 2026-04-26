"use client";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";

interface DevicePickerProps {
  value: string;
  onChange: (deviceId: string) => void;
}

export function DevicePicker({ value, onChange }: DevicePickerProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    async function load() {
      // Need permission first to get labels
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {}
      const all = await navigator.mediaDevices.enumerateDevices();
      const mics = all.filter((d) => d.kind === "audioinput");
      setDevices(mics);
      // Auto-select MV7 if present and nothing selected
      const mv7 = mics.find((d) => d.label.toLowerCase().includes("mv7"));
      if (mv7 && !value) onChange(mv7.deviceId);
      else if (mics.length > 0 && !value) onChange(mics[0].deviceId);
    }
    load();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-1">
      <Label htmlFor="mic-select">Microphone</Label>
      <select
        id="mic-select"
        className="w-full rounded border px-2 py-1 text-sm bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {devices.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
            {d.label.toLowerCase().includes("mv7") ? " ★ recommended" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PrerecordModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function PrerecordModal({ onConfirm, onCancel }: PrerecordModalProps) {
  const [checked, setChecked] = useState({ headphones: false, manual: false });
  const allChecked = checked.headphones && checked.manual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 space-y-4 max-w-sm w-full shadow-xl">
        <h2 className="text-lg font-semibold">Before you record</h2>
        <ul className="space-y-2">
          {([
            { key: "headphones" as const, label: "Headphones plugged into MV7's headphone jack" },
            { key: "manual" as const, label: "MV7 in Manual mode (not Auto)" },
          ] as const).map(({ key, label }) => (
            <li key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={key}
                checked={checked[key]}
                onChange={(e) => setChecked((p) => ({ ...p, [key]: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor={key} className="text-sm">{label}</label>
            </li>
          ))}
        </ul>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" disabled={!allChecked} onClick={onConfirm}>
            Start Recording
          </Button>
        </div>
      </div>
    </div>
  );
}

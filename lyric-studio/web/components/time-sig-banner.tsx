export function TimeSigBanner({ timeSig }: { timeSig: string }) {
  if (timeSig === "4/4") return null;
  return (
    <div className="rounded border bg-yellow-50 p-2 text-sm text-yellow-900 mb-3">
      Detected time signature: <strong>{timeSig}</strong>. Phase 1 supports 4/4 fully —
      bar grid + syllable budget guidance are disabled. Manual section labeling still works.
    </div>
  );
}

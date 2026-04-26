"use client";
import { useEffect, useRef } from "react";

interface LevelMeterProps {
  stream: MediaStream | null;
}

export function LevelMeter({ stream }: LevelMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) return;
    const audioCtx = new AudioContext();
    ctxRef.current = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getFloatTimeDomainData(buf);

      // RMS
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      const db = 20 * Math.log10(Math.max(rms, 1e-9));
      // db is negative; map [-60, 0] → [0, 1]
      const level = Math.max(0, Math.min(1, (db + 60) / 60));

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const h = canvas.height * level;
      ctx.fillStyle = db > -6 ? "#ef4444" : "#22c55e";
      ctx.fillRect(0, canvas.height - h, canvas.width, h);

      // -6 dBFS warning line
      const warnY = canvas.height * (1 - (54 / 60));
      ctx.strokeStyle = "#ef444488";
      ctx.beginPath();
      ctx.moveTo(0, warnY);
      ctx.lineTo(canvas.width, warnY);
      ctx.stroke();
    }

    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      audioCtx.close();
    };
  }, [stream]);

  return (
    <canvas
      ref={canvasRef}
      width={16}
      height={80}
      className="rounded border border-border bg-muted"
      aria-label="Level meter"
    />
  );
}

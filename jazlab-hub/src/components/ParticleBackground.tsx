"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  z: number; // depth 0-1: 0 = far (small/dim), 1 = near (larger/bright)
  vx: number;
  vy: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    // Reduce particle count on mobile for performance
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const PARTICLE_COUNT = isMobile ? 60 : 120;

    const particles: Particle[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles with random positions and gentle drift
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random(), // 0 = far, 1 = near
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const radius = 0.5 + p.z * 1.5; // 0.5px to 2px
        const opacity = 0.2 + p.z * 0.6; // 20% to 80%

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

        // Sparkle gold for ~5% of particles (z > 0.9)
        if (p.z > 0.9) {
          ctx.fillStyle = `rgba(255, 211, 107, ${opacity})`; // gold sparkle
        } else if (p.z > 0.7) {
          ctx.fillStyle = `rgba(40, 199, 183, ${opacity})`; // teal for bright particles
        } else {
          ctx.fillStyle = `rgba(242, 244, 248, ${opacity})`; // near-white for dim particles
        }

        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

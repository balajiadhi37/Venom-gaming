"use client";

import { useEffect } from "react";

const DROPS = 9;
const LIFETIME = 900; // ms, must outlast the longest CSS animation below

// Global click feedback: an energy ring plus a burst of sparks at
// the pointer, and a spotlight that follows the pointer across cards.
export default function ClickFX() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return undefined;

    const layer = document.createElement("div");
    layer.className = "fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    function splat(x, y) {
      const burst = document.createElement("div");
      burst.className = "fx-burst";
      burst.style.left = `${x}px`;
      burst.style.top = `${y}px`;

      const ring = document.createElement("span");
      ring.className = "fx-ring";
      burst.appendChild(ring);

      for (let i = 0; i < DROPS; i += 1) {
        const drop = document.createElement("span");
        drop.className = "fx-drop";
        // Spread the droplets around the click with a bit of randomness so no
        // two clicks burst the same way.
        const angle = (360 / DROPS) * i + (Math.random() * 26 - 13);
        const distance = 34 + Math.random() * 56;
        const size = 5 + Math.random() * 9;
        drop.style.setProperty("--a", `${angle}deg`);
        drop.style.setProperty("--d", `${distance}px`);
        drop.style.setProperty("--s", `${size}px`);
        drop.style.animationDelay = `${Math.random() * 60}ms`;
        burst.appendChild(drop);
      }

      layer.appendChild(burst);
      window.setTimeout(() => burst.remove(), LIFETIME);
    }

    function onPointerDown(event) {
      if (event.button !== 0) return;
      splat(event.clientX, event.clientY);

      // Press-in feedback on whatever interactive surface was hit.
      const hit = event.target.closest(".card, .game-card, .stat, .btn, .filter-btn");
      if (!hit) return;
      hit.classList.remove("fx-pressed");
      // Force a reflow so a rapid second click restarts the animation.
      void hit.offsetWidth;
      hit.classList.add("fx-pressed");
      window.setTimeout(() => hit.classList.remove("fx-pressed"), 520);
    }

    function onPointerMove(event) {
      const card = event.target.closest(".card, .game-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointermove", onPointerMove);
      layer.remove();
    };
  }, []);

  return null;
}

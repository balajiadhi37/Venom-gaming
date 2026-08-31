"use client";

import { useEffect } from "react";

// Feeds --mx / --my to the card under the pointer, which is what positions the
// radial spotlight in .card::before / .game-card::before. Without this the
// spotlight falls back to the 50% 50% default and sits dead centre.
export default function PointerSpotlight() {
  useEffect(() => {
    function onPointerMove(event) {
      const card = event.target.closest(".card, .game-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }

    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => document.removeEventListener("pointermove", onPointerMove);
  }, []);

  return null;
}

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

// Travel at full pointer deflection. The figure is the near layer so it moves
// the most, the plate is far so it barely shifts — that ratio is the parallax.
const FIGURE = { x: 40, y: 14, ry: 9, rx: 5, z: 40 };
const BLOOM = { x: 22, y: 10 };
const PLATE = { x: 10, y: 5, ry: 1.5 };

// Underdamped and heavy: he should read as mass returning to rest, not as a UI
// card easing. The overshoot on release is the point.
const FIG_SPRING = { stiffness: 110, damping: 20, mass: 1.1, restDelta: 0.0005 };
const BLOOM_SPRING = { stiffness: 45, damping: 20, mass: 1.2, restDelta: 0.001 };
const PLATE_SPRING = { stiffness: 55, damping: 24, mass: 1.4, restDelta: 0.001 };

const clamp = (n) => (n < -1 ? -1 : n > 1 ? 1 : n);

export default function HeroScene({ plate, figure, layered }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [figureBroken, setFigureBroken] = useState(false);
  const showFigure = layered && figure && !figureBroken;

  // Pointer deflection across the hero box: -1 at the left/top edge, +1 at the
  // right/bottom. Everything below is a multiple of these two numbers.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Slow additive sway so he is never completely frozen when the pointer rests.
  const idle = useMotionValue(0);

  const fx = useSpring(px, FIG_SPRING);
  const fy = useSpring(py, FIG_SPRING);
  const gx = useSpring(px, BLOOM_SPRING);
  const gy = useSpring(py, BLOOM_SPRING);
  const bx = useSpring(px, PLATE_SPRING);
  const by = useSpring(py, PLATE_SPRING);

  // rotateY(+deg) pushes the right edge away from the viewer, which is what a
  // billboard does when it turns toward something on its right. rotateX is
  // negated so a low pointer tips his head forward rather than back.
  const figX = useTransform([fx, idle], ([p, i]) => p * FIGURE.x + i * 5);
  const figY = useTransform(fy, (p) => p * FIGURE.y);
  const figRY = useTransform([fx, idle], ([p, i]) => p * FIGURE.ry + i * 1.2);
  const figRX = useTransform(fy, (p) => -p * FIGURE.rx);

  const bloomX = useTransform(gx, (p) => p * BLOOM.x);
  const bloomY = useTransform(gy, (p) => p * BLOOM.y);

  const plateX = useTransform(bx, (p) => p * PLATE.x);
  const plateY = useTransform(by, (p) => p * PLATE.y);
  const plateRY = useTransform(bx, (p) => p * PLATE.ry);

  useEffect(() => {
    if (reduced) return undefined;
    // Touch, pen and TV remotes have no hover to track. Mirrors the coarse
    // pointer guard the cursor rules already use in globals.css.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return undefined;
    }
    // The scene is pointer-events:none, so listen on the section itself —
    // moves over the copy and buttons bubble up to it.
    const host = ref.current?.closest(".hero");
    if (!host) return undefined;

    // Measure once and reuse until something can actually invalidate it,
    // rather than reading layout on every single pointermove.
    let rect = null;
    const invalidate = () => {
      rect = null;
    };

    function onMove(event) {
      if (!rect) rect = host.getBoundingClientRect();
      px.set(clamp(((event.clientX - rect.left) / rect.width) * 2 - 1));
      py.set(clamp(((event.clientY - rect.top) / rect.height) * 2 - 1));
    }
    function onLeave() {
      px.set(0);
      py.set(0);
    }

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);

    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
    };
  }, [reduced, px, py]);

  useEffect(() => {
    if (reduced) return undefined;
    const controls = animate(idle, [0, 1, 0, -1, 0], {
      duration: 11,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [reduced, idle]);

  return (
    <div className="hero-scene" ref={ref} aria-hidden="true">
      <motion.div
        className="hero-plate"
        style={{ x: plateX, y: plateY, rotateY: plateRY }}
      >
        <Image
          className="hero-layer-img"
          src={plate}
          alt=""
          fill
          sizes="100vw"
          preload
        />
      </motion.div>

      <motion.div className="hero-bloom" style={{ x: bloomX, y: bloomY }} />

      {showFigure && (
        <motion.div
          className="hero-figure"
          style={{
            x: figX,
            y: figY,
            rotateY: figRY,
            rotateX: figRX,
            z: FIGURE.z,
          }}
        >
          <Image
            className="hero-layer-img"
            src={figure}
            alt=""
            fill
            sizes="100vw"
            quality={90}
            loading="eager"
            onError={() => setFigureBroken(true)}
          />
        </motion.div>
      )}
    </div>
  );
}

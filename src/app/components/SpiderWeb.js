// Draws a quarter spider web anchored at the top-left corner of its box.
// Flip it with CSS (transform: scaleX(-1)) to web the opposite corner.

const SIZE = 560;
const SPOKES = 8; // number of straight lines radiating from the corner
const RINGS = [0.16, 0.3, 0.45, 0.62, 0.8, 1]; // ring distance as a share of SIZE

function point(angleDeg, radius) {
  const a = (angleDeg * Math.PI) / 180;
  return [radius * Math.cos(a), radius * Math.sin(a)];
}

function ringPath(radius) {
  const step = 90 / SPOKES;
  let d = "";

  for (let i = 0; i < SPOKES; i += 1) {
    const from = point(i * step, radius);
    const to = point((i + 1) * step, radius);
    // Control point pulled inward so each strand sags like real silk.
    const [cx, cy] = point((i + 0.5) * step, radius * 0.82);

    if (i === 0) d += `M ${from[0].toFixed(1)} ${from[1].toFixed(1)} `;
    d += `Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to[0].toFixed(1)} ${to[1].toFixed(1)} `;
  }

  return d;
}

export default function SpiderWeb({ className = "" }) {
  const step = 90 / SPOKES;

  return (
    <svg
      className={`web ${className}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      fill="none"
      aria-hidden="true"
    >
      {/* spokes */}
      {Array.from({ length: SPOKES + 1 }, (_, i) => {
        const [x, y] = point(i * step, SIZE);
        return <line key={`spoke-${i}`} x1="0" y1="0" x2={x} y2={y} />;
      })}

      {/* rings */}
      {RINGS.map((r) => (
        <path key={`ring-${r}`} d={ringPath(r * SIZE)} />
      ))}
    </svg>
  );
}

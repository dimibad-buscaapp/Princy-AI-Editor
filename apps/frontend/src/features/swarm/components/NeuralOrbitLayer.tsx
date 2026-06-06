"use client";

const RINGS = [
  { r: 18, className: "neural-orbit-layer__ring--slow", stroke: "rgba(0,242,255,0.12)", dash: "3 4" },
  { r: 26, className: "neural-orbit-layer__ring--mid", stroke: "rgba(139,92,246,0.1)", dash: "2 5" },
  { r: 34, className: "neural-orbit-layer__ring--fast", stroke: "rgba(0,242,255,0.08)", dash: "4 3" },
  { r: 42, className: "neural-orbit-layer__ring--slow", stroke: "rgba(99,102,241,0.1)", dash: "1 6" }
];

export function NeuralOrbitLayer() {
  return (
    <svg className="neural-orbit-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <g transform="translate(50, 48)">
        {RINGS.map((ring) => (
          <circle
            key={ring.r}
            className={`neural-orbit-layer__ring ${ring.className}`}
            cx={0}
            cy={0}
            r={ring.r}
            fill="none"
            stroke={ring.stroke}
            strokeWidth="0.12"
            strokeDasharray={ring.dash}
          />
        ))}
      </g>
    </svg>
  );
}

"use client";

import { useEffect, useState } from "react";

type MetricCounterProps = {
  label: string;
  value: number;
  suffix?: string;
  format?: (n: number) => string;
};

export function MetricCounter({ label, value, suffix = "", format }: MetricCounterProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const start = display;
    const diff = value - start;
    const duration = 900;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      setDisplay(Math.round(start + diff * p));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const text = format ? format(display) : `${display}${suffix}`;

  return (
    <div className="metric-counter">
      <span className="metric-counter__label">{label}</span>
      <span className="metric-counter__value">{text}</span>
    </div>
  );
}

import type { ReactNode, CSSProperties } from "react";

type Props = { children: ReactNode; className?: string; style?: CSSProperties; title?: string };

export function HolographicCard({ children, className = "", style, title }: Props) {
  return (
    <div className={`holo-card glass-panel ${className}`} style={style}>
      {title ? <div className="holo-card-title">{title}</div> : null}
      {children}
    </div>
  );
}

export function GlowButton({
  children,
  onClick,
  disabled,
  variant = "primary"
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
}) {
  return (
    <button type="button" className={`glow-btn glow-btn-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function BetaBadge({ label = "BETA" }: { label?: string }) {
  return <span className="badge beta-badge">{label}</span>;
}

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="loading-skeleton">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton-line" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function MetricCounter({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="metric-counter">
      <div className="metric-value">
        {value}
        {unit ? <span className="metric-unit">{unit}</span> : null}
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

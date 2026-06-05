"use client";

type StatusBadgeProps = {
  label: string;
  online?: boolean;
};

export function StatusBadge({ label, online = true }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${online ? "status-badge--online" : ""}`}>
      <span className="status-badge__dot" aria-hidden />
      {label}
    </span>
  );
}

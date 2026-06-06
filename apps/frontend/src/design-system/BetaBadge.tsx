type BetaBadgeVariant = "fast" | "code" | "reasoning" | "success" | "danger" | "muted";

type BetaBadgeProps = {
  variant: BetaBadgeVariant;
  children: React.ReactNode;
  title?: string;
};

export function BetaBadge({ variant, children, title }: BetaBadgeProps) {
  return (
    <span className={`beta-badge beta-badge--${variant}`} title={title}>
      {children}
    </span>
  );
}

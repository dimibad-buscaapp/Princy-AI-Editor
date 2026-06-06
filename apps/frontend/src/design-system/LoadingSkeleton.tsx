type LoadingSkeletonProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
};

export function LoadingSkeleton({ width = "100%", height = 16, className = "" }: LoadingSkeletonProps) {
  return (
    <div
      className={`beta-skeleton ${className}`.trim()}
      style={{ width, height }}
      aria-hidden
    />
  );
}

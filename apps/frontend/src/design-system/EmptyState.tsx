type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="beta-empty">
      <h3 className="beta-empty__title">{title}</h3>
      {description ? <p className="beta-empty__desc">{description}</p> : null}
      {action}
    </div>
  );
}

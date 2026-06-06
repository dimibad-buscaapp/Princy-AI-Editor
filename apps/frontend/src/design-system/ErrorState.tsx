type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ title = "Algo deu errado", message, onRetry }: ErrorStateProps) {
  return (
    <div className="beta-error">
      <h3 className="beta-error__title">{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="glow-btn glow-btn--cyan" onClick={onRetry} style={{ marginTop: 12 }}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

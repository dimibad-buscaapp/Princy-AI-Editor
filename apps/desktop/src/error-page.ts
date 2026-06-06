export function buildErrorPageHtml(message?: string): string {
  const text =
    message ??
    "Não foi possível conectar aos serviços locais da Princy.";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Princy Code</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0518;
      color: #e8f4ff;
      font-family: "Segoe UI", system-ui, sans-serif;
    }
    .card {
      max-width: 480px;
      padding: 32px;
      border: 1px solid rgba(0, 242, 255, 0.25);
      border-radius: 12px;
      background: rgba(10, 5, 24, 0.9);
      text-align: center;
    }
    h1 { font-size: 22px; margin-bottom: 12px; color: #00f2ff; }
    p { opacity: 0.85; line-height: 1.5; margin-bottom: 20px; }
    .actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
    button {
      background: linear-gradient(90deg, #00f2ff, #a855f7);
      border: none;
      color: #0a0518;
      font-weight: 700;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
    }
    button.secondary {
      background: transparent;
      border: 1px solid rgba(0, 242, 255, 0.35);
      color: #e8f4ff;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Princy Code</h1>
    <p>${text}</p>
    <p>Verifique se os serviços estão rodando na porta 3400 ou aguarde alguns instantes.</p>
    <div class="actions">
      <button id="retry-btn">Tentar novamente</button>
      <button id="logs-btn" class="secondary">Abrir logs</button>
    </div>
  </div>
  <script>
    document.getElementById("retry-btn")?.addEventListener("click", function () {
      if (window.princyDesktop && window.princyDesktop.retry) {
        window.princyDesktop.retry();
      } else {
        location.reload();
      }
    });
    document.getElementById("logs-btn")?.addEventListener("click", function () {
      if (window.princyDesktop && window.princyDesktop.openLogs) {
        window.princyDesktop.openLogs();
      }
    });
  </script>
</body>
</html>`;
}

export function errorPageDataUrl(message?: string): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(buildErrorPageHtml(message))}`;
}

import { createRoot } from "react-dom/client";
import type { ReactNode } from "react";

export function mountApp(App: () => ReactNode): void {
  const root = document.getElementById("root");
  if (!root) throw new Error("Missing #root");
  createRoot(root).render(<App />);
}

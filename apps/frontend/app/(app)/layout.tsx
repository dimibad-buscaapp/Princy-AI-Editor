import type { ReactNode } from "react";
import { ProtectedRoute } from "../../src/components/auth/protected-route";
import { PrincyShell } from "../../src/design-system/layout/PrincyShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <PrincyShell>{children}</PrincyShell>
    </ProtectedRoute>
  );
}

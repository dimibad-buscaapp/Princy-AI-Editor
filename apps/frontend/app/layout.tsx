import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "../src/context/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Princy AI Editor",
  description: "AI editor workspace for agents, context, memory, and automation."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

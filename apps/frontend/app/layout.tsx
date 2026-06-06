import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "../src/context/auth-context";
import { ToastProvider } from "../src/design-system/Toast";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  preload: false
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true
});

export const metadata: Metadata = {
  title: "Princy AI Editor",
  description: "Interface neural para agentes, contexto, memória e automação.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: "/apple-icon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${orbitron.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

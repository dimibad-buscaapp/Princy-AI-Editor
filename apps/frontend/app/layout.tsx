import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "../src/context/auth-context";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Princy AI Editor",
  description: "Interface neural para agentes, contexto, memória e automação."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${orbitron.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ParticleField } from "../../../src/design-system/ParticleField";
import { NeuralGlow } from "../../../src/design-system/NeuralGlow";
import { GlowButton } from "../../../src/design-system/GlowButton";
import { useAuth } from "../../../src/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading, sessionMessage } = useAuth();
  const [email, setEmail] = useState("admin@princy.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Preencha email e senha para continuar.");
      return;
    }
    try {
      setSubmitting(true);
      await login(email.trim(), password);
      router.replace("/");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Erro ao autenticar.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell neural-bg">
      <ParticleField />
      <section className="login-card glass-panel glow-border">
        <div className="login-card__visual">
          <NeuralGlow size={160} />
          <Image src="/princy/avatar-alien.png" alt="Princy" width={120} height={120} style={{ objectFit: "cover", objectPosition: "8% 12%" }} />
        </div>
        <div className="login-header">
          <p className="eyebrow">Princy AI Editor</p>
          <h1 className="text-gradient-princy">Entrar na rede neural</h1>
        </div>
        {sessionMessage ? <div className="auth-info">{sessionMessage}</div> : null}
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="auth-field">
            <span>Senha</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error ? <div className="auth-error">{error}</div> : null}
          <GlowButton type="submit" variant="violet" disabled={submitting} className="auth-submit">
            {submitting ? "Conectando..." : "Entrar"}
          </GlowButton>
        </form>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../src/context/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
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
      const message = unknownError instanceof Error ? unknownError.message : "Erro desconhecido ao autenticar.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="authShell">
      <section className="loginCard">
        <div className="loginHeader">
          <p className="eyebrow">Princy AI Editor</p>
          <h1>Entrar no painel</h1>
          <p className="intro">Use as credenciais de desenvolvimento para acessar o dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="authForm">
          <label className="authField">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@princy.local"
              autoComplete="email"
            />
          </label>

          <label className="authField">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          {error ? <div className="authError">{error}</div> : null}

          <button className="authButton" type="submit" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <div className="loginNote">
          <p>
            Credencial de desenvolvimento: <strong>admin@princy.local</strong>
          </p>
          <p>Não exiba a senha padrão em ambientes públicos.</p>
        </div>
      </section>
    </main>
  );
}

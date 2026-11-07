"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { signIn, signUp } from "@/lib/auth-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "login" | "signup";
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Por favor, informe seu nome.");
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError("A senha precisa ter no mínimo 8 caracteres.");
          setLoading(false);
          return;
        }

        const res = await signUp.email({
          email: email.trim(),
          password,
          name: name.trim(),
        });

        if (res.error) {
          setError(res.error.message || "Erro ao criar conta. Verifique os dados.");
          setLoading(false);
          return;
        }
      } else {
        const res = await signIn.email({
          email: email.trim(),
          password,
        });

        if (res.error) {
          setError("E-mail ou senha incorretos.");
          setLoading(false);
          return;
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("[AuthModal] Erro de autenticação:", err);
      setError("Ocorreu um erro inesperado ao conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSocial(provider: "google" | "github") {
    setError(null);
    setLoading(true);
    try {
      await signIn.social({
        provider,
        callbackURL: window.location.origin,
      });
    } catch {
      setError(`Não foi possível iniciar sessão com ${provider}. Configure as credenciais no .env.local.`);
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden p-6 sm:p-7 relative">
        {/* Top bar & Close */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow text-[var(--color-accent)] mb-1">
              LABORATÓRIO / ACESSO
            </div>
            <h2
              id="auth-modal-title"
              className="text-xl sm:text-2xl font-serif text-[var(--color-text-primary)]"
            >
              {mode === "login" ? "Seu espaço de investigação." : "Crie seu laboratório."}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            title="Fechar (Esc)"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-[var(--color-bg-subtle)] p-1 border border-[var(--color-border-subtle)] mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "login"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Entrar na conta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === "signup"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm font-semibold"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Criar nova conta
          </button>
        </div>

        {/* Social logins */}
        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => handleSocial("google")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] text-xs font-medium text-[var(--color-text-primary)] transition-all active:scale-[0.98]"
          >
            <Icon name="google" size={16} />
            Continuar com Google
          </button>
          <button
            type="button"
            onClick={() => handleSocial("github")}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] text-xs font-medium text-[var(--color-text-primary)] transition-all active:scale-[0.98]"
          >
            <Icon name="github" size={16} />
            Continuar com GitHub
          </button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)]"></div>
          </div>
          <span className="relative px-2.5 bg-[var(--color-surface)] text-[10px] uppercase font-mono text-[var(--color-text-tertiary)] tracking-wider">
            ou com e-mail
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs flex items-center gap-2">
            <Icon name="alert" size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                Seu nome
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Carolina Mendes"
                disabled={loading}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              E-mail profissional
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              disabled={loading}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                Senha de acesso
              </label>
              {mode === "signup" && (
                <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                  mín. 8 caracteres
                </span>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              disabled={loading}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 mt-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold text-xs tracking-wide hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Icon name="refresh" size={14} className="animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>{mode === "login" ? "Entrar no workspace" : "Criar laboratório gratuito"}</span>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[10px] text-[var(--color-text-tertiary)]">
          Seus dados e relatórios ficam armazenados de forma criptografada e isolada.
        </p>
      </div>
    </div>
  );
}

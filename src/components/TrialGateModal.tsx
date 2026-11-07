"use client";

import { Icon } from "./Icon";

interface TrialGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
}

export function TrialGateModal({
  isOpen,
  onClose,
  onOpenAuth,
}: TrialGateModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden p-6 sm:p-8 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center">
            <Icon name="lock" size={20} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
            title="Fechar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="eyebrow text-[var(--color-accent)] mb-1.5">
          LIMITE DE DEGUSTAÇÃO ATINGIDO · 3/3
        </div>

        <h2
          id="trial-gate-title"
          className="text-xl sm:text-2xl font-serif text-[var(--color-text-primary)] mb-3 leading-snug"
        >
          Você concluiu suas 3 análises de teste gratuitas.
        </h2>

        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6">
          Para continuar investigando ofertas, desbloquear análises ilimitadas e sincronizar
          todo o seu histórico de relatórios e personas na nuvem, acesse ou crie sua conta gratuita.
        </p>

        {/* Benefits bullets */}
        <div className="p-3.5 rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border-subtle)] space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
            <Icon name="check" size={14} className="text-[var(--color-accent)] shrink-0" />
            <span>Análises e relatórios ilimitados</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
            <Icon name="check" size={14} className="text-[var(--color-accent)] shrink-0" />
            <span>Histórico persistente sincronizado em qualquer dispositivo</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
            <Icon name="check" size={14} className="text-[var(--color-accent)] shrink-0" />
            <span>Seus 3 relatórios de teste atuais serão migrados automaticamente</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuth("signup");
            }}
            className="w-full py-2.5 px-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold text-xs tracking-wide hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Icon name="sparkle" size={15} />
            <span>Criar conta gratuita e continuar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuth("login");
            }}
            className="w-full py-2 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
          >
            Já tem uma conta? Fazer login
          </button>
        </div>
      </div>
    </div>
  );
}


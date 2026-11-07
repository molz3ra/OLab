"use client";

import { Icon } from "./Icon";
import { signOut } from "@/lib/auth-client";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    createdAt?: Date | string;
  };
  reportsCount: number;
  personasCount: number;
  onExportBackup: () => void;
}

export function AccountModal({
  isOpen,
  onClose,
  user,
  reportsCount,
  personasCount,
  onExportBackup,
}: AccountModalProps) {
  if (!isOpen) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden p-6 sm:p-7 relative">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="eyebrow text-[var(--color-accent)] mb-1">
              LABORATÓRIO / CONTA
            </div>
            <h2
              id="account-modal-title"
              className="text-xl sm:text-2xl font-serif text-[var(--color-text-primary)]"
            >
              Seu perfil de pesquisa.
            </h2>
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

        {/* User Card */}
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono text-base font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {user.name}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] font-mono truncate">
              {user.email}
            </div>
            <div className="text-[10px] text-[var(--color-accent)] font-mono mt-0.5 flex items-center gap-1">
              <Icon name="shieldCheck" size={11} />
              <span>Workspace em Nuvem Ativo</span>
            </div>
          </div>
        </div>

        {/* Workspace Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
            <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono uppercase tracking-wider mb-1">
              Relatórios Salvos
            </div>
            <div className="text-lg font-serif text-[var(--color-text-primary)]">
              {reportsCount}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
            <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono uppercase tracking-wider mb-1">
              Personas na Banca
            </div>
            <div className="text-lg font-serif text-[var(--color-text-primary)]">
              {personasCount}
            </div>
          </div>
        </div>

        {/* Actions list */}
        <div className="space-y-2 mb-6">
          <button
            type="button"
            onClick={() => {
              onExportBackup();
              onClose();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] text-xs text-[var(--color-text-primary)] transition-all"
          >
            <div className="flex items-center gap-2">
              <Icon name="download" size={15} className="text-[var(--color-text-secondary)]" />
              <span>Exportar backup da conta (.json)</span>
            </div>
            <Icon name="chevron" size={14} className="text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        {/* Sign Out Button */}
        <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
            Sessão segura
          </span>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              onClose();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <Icon name="logout" size={14} />
            <span>Encerrar sessão</span>
          </button>
        </div>
      </div>
    </div>
  );
}

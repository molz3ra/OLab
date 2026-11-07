"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import type { GuestQuota } from "@/lib/trial";
import { signOut } from "@/lib/auth-client";

interface UserMenuProps {
  session: {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
  } | null;
  quota: GuestQuota;
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenAccount: () => void;
}

export function UserMenu({
  session,
  quota,
  onOpenAuth,
  onOpenAccount,
}: UserMenuProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!session) {
    // Modo Convidado / Degustação
    return (
      <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-mono text-xs font-bold flex items-center justify-center shrink-0">
            W
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
              Meu workspace
            </div>
            <div className="text-[10px] text-[var(--color-text-tertiary)] truncate flex items-center gap-1.5">
              <span>Degustação: {quota.used}/3</span>
              {quota.isLocked && (
                <span className="text-red-400 font-medium">· Bloqueado</span>
              )}
            </div>
          </div>
        </div>

        {/* 3-segment progress indicator */}
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3].map((step) => {
            const isFilled = quota.used >= step;
            return (
              <div
                key={step}
                className={`h-1 rounded-full transition-all ${
                  isFilled
                    ? quota.isLocked
                      ? "bg-red-400"
                      : "bg-[var(--color-accent)]"
                    : "bg-[var(--color-border)]"
                }`}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onOpenAuth("login")}
          className="w-full py-1.5 px-2.5 rounded-md bg-[var(--color-surface-hover)] hover:bg-[var(--color-surface-active)] border border-[var(--color-border-subtle)] text-[11px] font-medium text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <Icon name="user" size={13} className="text-[var(--color-accent)]" />
          <span>Entrar ou criar conta</span>
        </button>
      </div>
    );
  }

  // Modo Autenticado
  const user = session.user;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="relative">
      <div
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] cursor-pointer transition-all flex items-center gap-2.5 select-none"
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)] font-mono text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
            {user.name}
          </div>
          <div className="text-[10px] text-[var(--color-accent)] font-mono truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse"></span>
            <span>Workspace Nuvem</span>
          </div>
        </div>
        <Icon
          name="down"
          size={14}
          className={`text-[var(--color-text-tertiary)] transition-transform ${
            dropdownOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute left-0 right-0 bottom-full mb-1.5 z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl p-1 animate-fade-in text-xs">
            <div className="px-2.5 py-1.5 border-b border-[var(--color-border-subtle)] mb-1">
              <div className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                Conectado como
              </div>
              <div className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                {user.email}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onOpenAccount();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors text-left"
            >
              <Icon name="userCheck" size={14} className="text-[var(--color-text-secondary)]" />
              <span>Minha Conta</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                setDropdownOpen(false);
                await signOut();
                window.location.reload();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <Icon name="logout" size={14} />
              <span>Sair da conta</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}


'use client';

import React from 'react';
import { Terminal, Shield, Key } from 'lucide-react';

interface HeaderProps {
  onOpenTelemetry: () => void;
  hasTelemetryData: boolean;
  onOpenApiKey: () => void;
  hasApiKey: boolean;
}

export function Header({
  onOpenTelemetry,
  hasTelemetryData,
  onOpenApiKey,
  hasApiKey,
}: HeaderProps) {
  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto rounded-full bg-[#0a0c10]/85 backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand Unit */}
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.1] flex items-center justify-center shadow-inner">
            <span className="w-2 h-2 rounded-sm bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-sm tracking-tight text-white">
              Objection<span className="font-mono text-emerald-400 font-light">Lab</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono font-medium tracking-[0.08em] px-2 py-0.5 rounded-full bg-white/[0.03] text-zinc-400 border border-white/[0.05]">
              Synthetic Focus Group
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Gemini API Key Button */}
          <button
            onClick={onOpenApiKey}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border tactile-btn ${
              hasApiKey
                ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/[0.15]'
                : 'bg-amber-500/[0.08] border-amber-500/25 text-amber-300 hover:bg-amber-500/[0.14]'
            }`}
          >
            <Key className="w-3 h-3" />
            <span className="hidden sm:inline">{hasApiKey ? 'Gemini IA Ativo' : 'Configurar Chave'}</span>
            <span className="sm:hidden">{hasApiKey ? 'IA Ativa' : 'Chave'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasApiKey ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-amber-400 animate-pulse'
              }`}
            />
          </button>

          {/* Status Pod / Telemetry Trigger */}
          <button
            onClick={onOpenTelemetry}
            className={`group relative flex items-center space-x-2 px-3 py-1.5 rounded-full text-[11px] font-mono border tactile-btn ${
              hasTelemetryData
                ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/[0.14] hover:border-emerald-500/50'
                : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] hover:border-white/[0.12]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasTelemetryData
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <span className="tracking-tight">&lt;/&gt; Telemetria</span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/molz3ra/OLab"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-white transition-all tactile-btn"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

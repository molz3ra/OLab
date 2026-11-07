'use client';

import React from 'react';
import { Key, Code2 } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full border-b border-[#222838] bg-[#090b10]/90 backdrop-blur-md px-4 sm:px-8 py-3.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Unit */}
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-md bg-[#181c28] border border-[#2b3246] flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-base tracking-tight text-[#f3f4f8]">
              OLAB
            </span>
            <span className="hidden sm:inline-block text-[11px] text-[#8c93a8] font-mono border-l border-[#222838] pl-2">
              Laboratório de Objeções
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Bring Your Own Key (BYOK) Status Button */}
          <button
            onClick={onOpenApiKey}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-mono border tactile-btn ${
              hasApiKey
                ? 'bg-[#181c28] border-[#222838] text-[#10b981] hover:border-[#3b435c]'
                : 'bg-[#181c28] border-[#222838] text-[#8c93a8] hover:text-[#f3f4f8] hover:border-[#3b435c]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasApiKey ? 'Chave Própria Ativa' : 'Configurar API Key'}
            </span>
            <span className="sm:hidden">{hasApiKey ? 'Chave Ativa' : 'Chave'}</span>
          </button>

          {/* Telemetry Trigger */}
          <button
            onClick={onOpenTelemetry}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-mono border tactile-btn ${
              hasTelemetryData
                ? 'bg-[#181c28] border-[#222838] text-[#10b981] hover:border-[#3b435c]'
                : 'bg-[#11141d] border-[#222838] text-[#8c93a8] hover:text-[#f3f4f8] hover:border-[#3b435c]'
            }`}
            title="Abrir Inspetor de Telemetria (Atalho: T)"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inspetor</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#090b10] border border-[#222838] rounded text-[#8c93a8]">
              T
            </kbd>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/molz3ra/OLab"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="w-8 h-8 rounded-md bg-[#11141d] border border-[#222838] hover:border-[#3b435c] flex items-center justify-center text-[#8c93a8] hover:text-[#f3f4f8] transition-colors tactile-btn"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

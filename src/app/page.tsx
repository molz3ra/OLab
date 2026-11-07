'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroInput } from '@/components/HeroInput';
import { ExecutionProgress } from '@/components/ExecutionProgress';
import { ReportDashboard } from '@/components/ReportDashboard';
import { TelemetryDrawer } from '@/components/TelemetryDrawer';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { AnalysisResponse, FinalReport, Telemetry } from '@/types/analysis';
import { PRESET_ANALYSES, PresetItem } from '@/lib/presets';

const STORAGE_KEY = 'olab_gemini_api_key';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<FinalReport | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<Telemetry | null>(null);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [activePersonasCount, setActivePersonasCount] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega chave salva do usuário do localStorage
  useEffect(() => {
    try {
      const savedKey =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem('gemini_api_key') || '';
      if (savedKey) {
        setApiKey(savedKey);
      }
    } catch (e) {
      console.warn('Não foi possível ler o localStorage:', e);
    }
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      if (newKey) {
        localStorage.setItem(STORAGE_KEY, newKey);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Não foi possível salvar no localStorage:', e);
    }
  };

  // Execução via API (/api/analyze)
  const handleAnalyze = async (params: {
    input: string;
    niche: string;
    personaIds: string[];
    customPersona?: {
      name: string;
      role: string;
      skepticismLevel: number;
      mainPain: string;
    };
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    setActivePersonasCount(
      params.personaIds.length + (params.customPersona ? 1 : 0)
    );

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          ...params,
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Falha ao processar a análise.');
      }

      const data: AnalysisResponse = await response.json();
      setActiveReport(data.report);
      setActiveTelemetry(data.telemetry);
    } catch (err) {
      console.error('[Home] Erro na análise:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Erro inesperado ao conectar com o servidor.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Carregamento instantâneo via Zero-Click Preset (0.15s)
  const handleSelectPreset = (preset: PresetItem) => {
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setActiveReport(preset.data.report);
      setActiveTelemetry(preset.data.telemetry);
      setIsLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-[#f3f4f8] flex flex-col font-sans selection:bg-[#10b981]/25 selection:text-white">
      {/* Navigation Header */}
      <Header
        onOpenTelemetry={() => setIsTelemetryOpen(true)}
        hasTelemetryData={Boolean(activeTelemetry)}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        hasApiKey={Boolean(apiKey)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Hero & Input Section */}
        <HeroInput
          onAnalyze={handleAnalyze}
          onSelectPreset={handleSelectPreset}
          isLoading={isLoading}
          hasApiKey={Boolean(apiKey)}
          onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        />

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="max-w-3xl mx-auto px-4 my-4">
            <div className="p-4 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/30 text-[#f43f5e] text-xs flex items-center justify-between font-mono">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Erro:</span>
                <span>{errorMessage}</span>
              </div>
              <div className="flex items-center gap-3">
                {!apiKey && (
                  <button
                    onClick={() => setIsApiKeyModalOpen(true)}
                    className="underline text-[#10b981] hover:text-[#10b981]/80 text-[11px]"
                  >
                    Inserir Chave Gemini
                  </button>
                )}
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-[#f43f5e] hover:text-[#f3f4f8] text-sm ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Execution Stepper */}
        {isLoading && (
          <ExecutionProgress personasCount={activePersonasCount} />
        )}

        {/* Results Dashboard */}
        {!isLoading && activeReport && (
          <ReportDashboard
            report={activeReport}
            onOpenTelemetry={() => setIsTelemetryOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#222838] py-6 text-center text-xs text-[#8c93a8] font-mono">
        <p>
          OLAB • Laboratório de Fricção &amp; Objeções de Conversão • Next.js &amp; Google Gemini AI
        </p>
      </footer>

      {/* Slide-over Developer Telemetry Drawer */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
        telemetry={activeTelemetry}
        report={activeReport}
      />

      {/* Bring Your Own Key (BYOK) Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}

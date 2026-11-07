'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Globe, AlignLeft, ArrowRight, Plus, Check, Trash2, Sparkles, Key } from 'lucide-react';
import { PRESET_PERSONAS, PersonaArchetype } from '@/lib/personas';
import { PRESET_ANALYSES, PresetItem } from '@/lib/presets';
import { CustomPersonaModal } from './CustomPersonaModal';

interface HeroInputProps {
  onAnalyze: (params: {
    input: string;
    niche: string;
    personaIds: string[];
    customPersona?: {
      name: string;
      role: string;
      skepticismLevel: number;
      mainPain: string;
    };
  }) => void;
  onSelectPreset: (preset: PresetItem) => void;
  isLoading: boolean;
  hasApiKey?: boolean;
  onOpenApiKey?: () => void;
}

const NICHES = [
  'SaaS B2B & Fintech',
  'DevTools & Infraestrutura',
  'E-commerce & Produtos Físicos',
  'Educação & Infoprodutos',
  'Serviços Profissionais & Consultoria',
  'Aplicativo Mobile & Assinaturas',
];

export function HeroInput({
  onAnalyze,
  onSelectPreset,
  isLoading,
  hasApiKey,
  onOpenApiKey,
}: HeroInputProps) {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [inputValue, setInputValue] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('SaaS B2B & Fintech');
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([
    'cfo-skeptic',
    'dev-senior',
    'busy-smb',
  ]);

  // Custom persona state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customPersona, setCustomPersona] = useState<{
    name: string;
    role: string;
    mainPain: string;
    convincer: string;
    skepticismLevel: number;
  } | null>(null);

  const togglePersona = (id: string) => {
    if (selectedPersonaIds.includes(id)) {
      if (selectedPersonaIds.length > 1) {
        setSelectedPersonaIds(selectedPersonaIds.filter((p) => p !== id));
      }
    } else {
      if (selectedPersonaIds.length < 5) {
        setSelectedPersonaIds([...selectedPersonaIds, id]);
      }
    }
  };

  const executeAnalysis = () => {
    if (!inputValue.trim()) return;

    onAnalyze({
      input: inputValue.trim(),
      niche: selectedNiche,
      personaIds: selectedPersonaIds,
      customPersona: customPersona
        ? {
            name: customPersona.name,
            role: customPersona.role,
            skepticismLevel: customPersona.skepticismLevel,
            mainPain: customPersona.mainPain,
          }
        : undefined,
    });
  };

  const executeAnalysisRef = useRef(executeAnalysis);
  executeAnalysisRef.current = executeAnalysis;

  // Regra 26: Event listener otimizado para não recriar a cada ciclo de render
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!isLoading && inputValue.trim()) {
          executeAnalysisRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, inputValue]);

  const wordCount = inputValue.trim() ? inputValue.trim().split(/\s+/).length : 0;
  const charCount = inputValue.length;

  return (
    <section className="relative pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="text-center space-y-3.5 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#11141d] border border-[#222838] text-[11px] font-mono text-[#8c93a8]">
          <span className="w-2 h-2 rounded-sm bg-[#10b981]" />
          <span>Auditoria Comportamental &amp; Simulação de Objeções</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold text-[#f3f4f8] tracking-tight leading-[1.12] max-w-3xl mx-auto">
          Descubra por que visitantes abandonam sua oferta antes de comprar.
        </h1>

        <p className="text-sm sm:text-base text-[#8c93a8] max-w-2xl mx-auto font-normal leading-relaxed">
          Submeta sua landing page ou texto de copy a uma banca cética com vieses contrastantes de decisão, finanças e tecnologia.
        </p>
      </div>

      {/* Main Studio Console */}
      <div className="studio-surface p-5 sm:p-7 space-y-6 shadow-xl">
        {/* Mode Switch & Niche Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222838] pb-4">
          <div className="flex items-center space-x-1 bg-[#090b10] p-1 rounded-lg border border-[#222838] text-xs font-mono">
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all tactile-btn ${
                mode === 'url'
                  ? 'bg-[#181c28] text-[#f3f4f8] shadow-sm'
                  : 'text-[#8c93a8] hover:text-[#f3f4f8]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Analisar URL</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all tactile-btn ${
                mode === 'text'
                  ? 'bg-[#181c28] text-[#f3f4f8] shadow-sm'
                  : 'text-[#8c93a8] hover:text-[#f3f4f8]'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Colar Texto da Oferta</span>
            </button>
          </div>

          {/* Niche Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-[#8c93a8] hidden sm:inline">Contexto:</span>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="bg-[#090b10] border border-[#222838] text-xs font-mono text-[#f3f4f8] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3b435c] transition-colors cursor-pointer"
            >
              {NICHES.map((n) => (
                <option key={n} value={n} className="bg-[#11141d] text-[#f3f4f8]">
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Input Surface */}
        <div>
          {mode === 'url' ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#8c93a8]">
                Endereço da Landing Page ou Página de Vendas:
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="https://suaempresa.com.br/oferta"
                  className="w-full bg-[#090b10] border border-[#222838] focus:border-[#3b435c] rounded-lg px-4 py-3 text-sm font-mono text-[#f3f4f8] placeholder-[#5a6275] focus:outline-none transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono text-[#8c93a8]">
                  Texto ou Copywriting da Oferta:
                </label>
                <span className="text-[11px] font-mono text-[#8c93a8]">
                  {wordCount} palavras • {charCount} caracteres
                </span>
              </div>
              <textarea
                rows={5}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Cole aqui a headline, subheadline, descrição dos benefícios, plano de preços e chamada para ação..."
                className="w-full bg-[#090b10] border border-[#222838] focus:border-[#3b435c] rounded-lg p-3.5 text-xs text-[#f3f4f8] placeholder-[#5a6275] focus:outline-none transition-colors resize-y leading-relaxed font-sans"
              />
            </div>
          )}
        </div>

        {/* The Skeptical Focus Group Committee */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-medium text-[#f3f4f8] uppercase tracking-wider">
                Banca Cética (Focus Group)
              </span>
              <span className="text-[11px] font-mono text-[#8c93a8]">
                ({selectedPersonaIds.length + (customPersona ? 1 : 0)} selecionadas)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center gap-1 text-xs font-mono text-[#10b981] hover:text-[#10b981]/80 transition-colors tactile-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Persona</span>
            </button>
          </div>

          {/* Archetype Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PRESET_PERSONAS.map((persona) => {
              const isSelected = selectedPersonaIds.includes(persona.id);
              return (
                <div
                  key={persona.id}
                  onClick={() => togglePersona(persona.id)}
                  className={`p-3 rounded-lg border cursor-pointer select-none transition-all tactile-btn flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'bg-[#181c28] border-[#3b435c]'
                      : 'bg-[#0d0f15] border-[#222838] opacity-60 hover:opacity-100 hover:border-[#2b3246]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-[#f3f4f8]">{persona.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8c93a8] block">{persona.role}</span>
                    </div>

                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#10b981] border-[#10b981] text-[#090b10]'
                          : 'border-[#222838] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  <p className="text-[11px] text-[#8c93a8] line-clamp-2 leading-snug">
                    {persona.bias}
                  </p>
                </div>
              );
            })}

            {/* Custom persona card if active */}
            {customPersona && (
              <div className="p-3 rounded-lg border bg-[#181c28] border-[#10b981]/40 flex flex-col justify-between space-y-2 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-semibold text-[#f3f4f8]">{customPersona.name}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#10b981]/15 text-[#10b981]">
                        CUSTOM
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8c93a8] block">{customPersona.role}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCustomPersona(null);
                    }}
                    className="text-[#8c93a8] hover:text-[#f43f5e] transition-colors"
                    title="Remover Persona Customizada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-[#8c93a8] line-clamp-2 leading-snug">
                  {customPersona.mainPain}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-[#222838] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Subtle Demo Link */}
          <button
            type="button"
            onClick={() => onSelectPreset(PRESET_ANALYSES[0])}
            className="text-left text-xs text-[#8c93a8] hover:text-[#f3f4f8] transition-colors flex items-center gap-1.5 font-mono"
          >
            <span>Ver demonstração pronta:</span>
            <span className="underline decoration-[#3b435c] text-[#f3f4f8]">
              {PRESET_ANALYSES[0].title}
            </span>
          </button>

          {/* Submit Action */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={executeAnalysis}
              disabled={isLoading || !inputValue.trim()}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 rounded-lg bg-[#f3f4f8] text-[#090b10] font-semibold text-xs hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all tactile-btn shadow-md"
            >
              <span>{isLoading ? 'Simulando Deliberação...' : 'Simular Objeções da Banca'}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#090b10]/10 border border-[#090b10]/20 rounded font-mono">
                ⌘↵
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Persona Modal */}
      <CustomPersonaModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={(data) => setCustomPersona(data)}
      />
    </section>
  );
}

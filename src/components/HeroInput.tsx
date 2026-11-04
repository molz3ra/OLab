'use client';

import React, { useState } from 'react';
import { ArrowRight, SlidersHorizontal, Plus, Check, CornerDownRight, Globe, AlignLeft, Sparkles, Key } from 'lucide-react';
import { PRESET_PERSONAS, PersonaArchetype } from '@/lib/personas';
import { PRESET_ANALYSES, PresetItem } from '@/lib/presets';

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
  'Educação & Infoproduto',
  'E-commerce & D2C',
  'App Mobile & Consumo',
  'Serviços Corporativos',
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
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customSkepticism, setCustomSkepticism] = useState(8);
  const [customPain, setCustomPain] = useState('');
  const [hasCustomPersona, setHasCustomPersona] = useState(false);

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

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customName && customRole && customPain) {
      setHasCustomPersona(true);
      setShowCustomModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    onAnalyze({
      input: inputValue,
      niche: selectedNiche,
      personaIds: selectedPersonaIds,
      customPersona: hasCustomPersona
        ? {
            name: customName,
            role: customRole,
            skepticismLevel: customSkepticism,
            mainPain: customPain,
          }
        : undefined,
    });
  };

  return (
    <section className="relative pt-12 pb-6 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Editorial Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] text-[10px] font-mono uppercase tracking-[0.12em] text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Auditoria Comportamental Pré-Tráfego</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-[-0.035em] leading-[1.08] max-w-4xl mx-auto">
          Simulador de Fricção e Objeções para Landing Pages
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Submeta sua proposta de valor a um comitê sintético com vieses psicológicos contrastantes antes de alocar capital em mídia paga.
        </p>
      </div>

      {/* Hardware Console Double-Bezel Architecture */}
      <div className="double-bezel shadow-2xl">
        <div className="double-bezel-inner p-5 sm:p-7 space-y-6">
          {/* Mode Switch & Niche Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
            <div className="flex items-center space-x-1.5 bg-[#090b0e] p-1 rounded-lg border border-white/[0.06] text-xs font-mono">
              <button
                type="button"
                onClick={() => setMode('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all tactile-btn ${
                  mode === 'url'
                    ? 'bg-white/[0.08] text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>URL da Página</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all tactile-btn ${
                  mode === 'text'
                    ? 'bg-white/[0.08] text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copywriting Bruto</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Nicho:
              </span>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="bg-[#090b0e] border border-white/[0.07] rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white/[0.2] transition-colors"
              >
                {NICHES.map((n) => (
                  <option key={n} value={n} className="bg-[#0c0d12]">
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              {mode === 'url' ? (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-600 font-mono text-xs">
                    URL &gt;
                  </div>
                  <input
                    type="url"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="https://suaempresa.com.br/produto"
                    required
                    className="w-full bg-[#090a0f] border border-white/[0.07] rounded-xl pl-16 pr-4 py-3.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.25] focus:ring-1 focus:ring-white/[0.1] transition-all"
                  />
                </div>
              ) : (
                <textarea
                  rows={4}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Insira a headline, subtítulo, argumentos e chamada para ação da sua página ou anúncio..."
                  required
                  className="w-full bg-[#090a0f] border border-white/[0.07] rounded-xl p-4 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.25] focus:ring-1 focus:ring-white/[0.1] transition-all leading-relaxed"
                />
              )}
            </div>

            {/* Persona Archetypes Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  Comitê Sintético ({selectedPersonaIds.length} ativos):
                </span>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(true)}
                  className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  {hasCustomPersona ? 'Configurar Persona Custom' : 'Adicionar Perfil Custom'}
                </button>
              </div>

              {/* Persona Grid (Clean Vector Glyphs) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {PRESET_PERSONAS.map((p) => {
                  const isSelected = selectedPersonaIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePersona(p.id)}
                      className={`group relative text-left p-3 rounded-xl border transition-all tactile-btn ${
                        isSelected
                          ? 'bg-white/[0.04] border-white/[0.18] shadow-sm'
                          : 'bg-white/[0.01] border-white/[0.04] opacity-50 hover:opacity-90 hover:border-white/[0.09]'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-md bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono font-bold text-zinc-200 flex items-center justify-center">
                            {p.initials}
                          </span>
                          <span className="text-[10px] font-mono font-medium tracking-wider text-zinc-400">
                            {p.code}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-xs font-semibold text-white tracking-tight">
                          {p.name}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {p.role}
                        </p>
                      </div>

                      {/* Skepticism Meter */}
                      <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>Ceticismo:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-white/[0.06] h-1 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${p.skepticismLevel * 10}%` }}
                              className={`h-full ${
                                p.skepticismLevel >= 8
                                  ? 'bg-rose-400'
                                  : p.skepticismLevel >= 6
                                  ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                              }`}
                            />
                          </div>
                          <span className="text-zinc-300 font-semibold">{p.skepticismLevel}/10</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {hasCustomPersona && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 flex items-center justify-center">
                      CUS
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-white">
                        {customName} — {customRole}
                      </span>
                      <p className="text-[11px] text-zinc-400">Objeção: &quot;{customPain}&quot;</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Ativa
                  </span>
                </div>
              )}
            </div>

            {/* API Key Status Pod & Submit Button */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs px-1">
                {hasApiKey ? (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]" />
                    <span>Gemini 2.0 Flash ativado com sua API Key</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Modo Heurístico Sintético</span>
                    {onOpenApiKey && (
                      <button
                        type="button"
                        onClick={onOpenApiKey}
                        className="ml-2 text-emerald-400 hover:text-emerald-300 underline underline-offset-2 flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Key className="w-3 h-3" />
                        <span>Ativar IA Real com sua Chave Gratuita →</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group py-3.5 pl-6 pr-3.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 font-semibold text-xs tracking-tight shadow-xl shadow-black/40 transition-all flex items-center justify-between disabled:opacity-40 disabled:cursor-not-allowed tactile-btn cursor-pointer"
              >
                <span className="font-medium text-sm">
                  {isLoading
                    ? 'Orquestrando Focus Group Sintético em Paralelo...'
                    : hasApiKey
                    ? 'Executar Auditoria de Fricção com Gemini 2.0 Flash'
                    : 'Executar Auditoria de Fricção (Pipeline Paralelo)'}
                </span>
                <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-4 h-4 text-zinc-950" />
                </span>
              </button>
            </div>
          </form>

          {/* Minimalist Zero-Click Benchmarks Ribbon */}
          <div className="pt-4 border-t border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <CornerDownRight className="w-3.5 h-3.5 text-zinc-600" />
              Benchmarks Rápidos (0.2s):
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {PRESET_ANALYSES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className="px-2.5 py-1 rounded-md bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.18] hover:bg-white/[0.05] text-[11px] font-mono text-zinc-400 hover:text-white transition-all tactile-btn flex items-center gap-1.5"
                >
                  <span className="text-emerald-400 font-bold">{preset.badge}:</span>
                  <span className="text-zinc-300">{preset.title.split('—')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Persona Custom */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1015] border border-white/[0.1] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
                Definir Persona Sintética Personalizada
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-zinc-500 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCustom} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  Nome:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gabriela Duarte"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#08090d] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white/[0.2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  Cargo / Função:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: VP de Growth em Startup Série B"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full bg-[#08090d] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white/[0.2]"
                />
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  <span>Nível de Ceticismo:</span>
                  <span className="text-emerald-400 font-bold">{customSkepticism}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={customSkepticism}
                  onChange={(e) => setCustomSkepticism(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  Maior Objeção / Medo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Receio de bloqueio de conta ou perda de entregabilidade"
                  value={customPain}
                  onChange={(e) => setCustomPain(e.target.value)}
                  className="w-full bg-[#08090d] border border-white/[0.08] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-white/[0.2]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 tactile-btn cursor-pointer"
                >
                  Adicionar ao Comitê
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Code2,
  Columns,
  GitCompare,
  FileCheck2,
  Quote,
} from 'lucide-react';
import { FinalReport, CopyOptimization, PersonaEvaluation } from '@/types/analysis';

interface ReportDashboardProps {
  report: FinalReport;
  onOpenTelemetry: () => void;
}

export function ReportDashboard({ report, onOpenTelemetry }: ReportDashboardProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string>(
    report.personas[0]?.personaId || ''
  );
  const [copyViewMode, setCopyViewMode] = useState<'split' | 'diff'>('split');

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAllOptimizations = () => {
    const fullText = report.copyOptimizations
      .map((c) => `[${c.element}]\n${c.suggestedText}\n(Racional: ${c.rationale})\n`)
      .join('\n---\n\n');
    navigator.clipboard.writeText(fullText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const radarData = [
    { subject: 'Clareza', score: report.radarMetrics.clarityScore, fullMark: 100 },
    { subject: 'Urgência', score: report.radarMetrics.urgencyScore, fullMark: 100 },
    { subject: 'Prova Social', score: report.radarMetrics.socialProofScore, fullMark: 100 },
    { subject: 'Quebra Objeções', score: report.radarMetrics.objectionHandlingScore, fullMark: 100 },
    { subject: 'Simplicidade CTA', score: report.radarMetrics.ctaSimplicityScore, fullMark: 100 },
  ];

  const getScoreVerdict = (score: number) => {
    if (score >= 75) {
      return {
        label: 'Conversão Promissora',
        color: 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30',
      };
    }
    if (score >= 60) {
      return {
        label: 'Atrito Moderado (Risco de Evasão)',
        color: 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/30',
      };
    }
    return {
      label: 'Bloqueio Severo de Tráfego',
      color: 'text-[#f43f5e] bg-[#f43f5e]/10 border-[#f43f5e]/30',
    };
  };

  const verdict = getScoreVerdict(report.overallScore);
  const activePersona =
    report.personas.find((p) => p.personaId === activePersonaId) || report.personas[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Editorial Page Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#222838]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#181c28] text-[#8c93a8] border border-[#222838]">
              {report.niche || 'Auditoria Geral'}
            </span>
            <span className="text-[#8c93a8] font-mono text-xs">•</span>
            <span className="text-xs font-mono text-[#8c93a8]">
              {report.personas.length} Personas no Comitê
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-[#f3f4f8] tracking-tight mt-1.5">
            Diagnóstico de Fricção &amp; Objeções
          </h2>

          {report.url && (
            <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-[#8c93a8]">
              <ExternalLink className="w-3.5 h-3.5 text-[#5a6275]" />
              <span className="truncate max-w-lg">{report.url}</span>
            </div>
          )}
        </div>

        <button
          onClick={onOpenTelemetry}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#11141d] border border-[#222838] hover:border-[#3b435c] text-xs font-mono text-[#8c93a8] hover:text-[#f3f4f8] transition-all tactile-btn"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Telemetria do Pipeline</span>
        </button>
      </div>

      {/* 1. SEÇÃO EXECUTIVA & RADAR DE FRICÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Intelligence Block (7 cols) */}
        <div className="lg:col-span-7 studio-surface p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono text-[#8c93a8] uppercase tracking-wider">
                Score de Conversão Geral
              </span>
              <span
                className={`text-xs font-mono font-medium px-2.5 py-1 rounded-md border ${verdict.color}`}
              >
                {verdict.label}
              </span>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="text-5xl sm:text-6xl font-semibold font-mono text-[#f3f4f8] tracking-tight">
                {report.overallScore}
              </span>
              <span className="text-sm font-mono text-[#8c93a8]">/ 100</span>
            </div>
          </div>

          {/* Critical Bottleneck Alert */}
          <div className="p-4 rounded-lg bg-[#181c28] border border-[#222838] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-mono text-[#f59e0b]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-semibold uppercase tracking-wider">
                Gargalo Crítico de Conversão
              </span>
            </div>
            <p className="text-xs text-[#f3f4f8] leading-relaxed">
              {report.criticalBottleneck}
            </p>
          </div>

          {/* Executive Summary */}
          <div className="space-y-1.5 pt-2 border-t border-[#222838]">
            <span className="text-xs font-mono text-[#8c93a8] uppercase tracking-wider">
              Síntese Comportamental
            </span>
            <p className="text-xs text-[#8c93a8] leading-relaxed">
              {report.executiveSummary}
            </p>
          </div>
        </div>

        {/* Radar Pentagonal (5 cols) */}
        <div className="lg:col-span-5 studio-surface p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8c93a8] uppercase tracking-wider">
              Radar de Fricção (5 Eixos)
            </span>
            <span className="text-[11px] font-mono text-[#8c93a8]">Escala 0-100</span>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-lg bg-[#090b10] border border-[#222838] text-xs font-mono shadow-xl">
                          <span className="text-[#8c93a8] block">{data.subject}</span>
                          <span className="text-sm font-semibold text-[#10b981]">
                            {data.score} / 100
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.18}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-[#8c93a8] text-center font-mono">
            Quanto mais amplo o polígono verde, menor a hesitação psicológica no momento da compra.
          </p>
        </div>
      </div>

      {/* 2. A GALERIA DE VOZES (DELIBERAÇÃO DA BANCA) */}
      <div className="studio-surface p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222838] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#f3f4f8] tracking-tight">
              A Deliberação da Banca Cética
            </h3>
            <p className="text-xs text-[#8c93a8]">
              Selecione uma persona para inspecionar seus pensamentos sem filtro e dúvidas não sanadas
            </p>
          </div>
          <span className="text-xs font-mono text-[#8c93a8]">
            {report.personas.length} avaliações individuais
          </span>
        </div>

        {/* Persona Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {report.personas.map((persona) => {
            const isActive = persona.personaId === activePersona?.personaId;
            return (
              <button
                key={persona.personaId}
                onClick={() => setActivePersonaId(persona.personaId)}
                className={`px-3.5 py-2 rounded-lg border text-xs font-mono flex items-center space-x-2 transition-all tactile-btn whitespace-nowrap ${
                  isActive
                    ? 'bg-[#181c28] border-[#3b435c] text-[#f3f4f8]'
                    : 'bg-[#090b10] border-[#222838] text-[#8c93a8] hover:text-[#f3f4f8] hover:border-[#2b3246]'
                }`}
              >
                <span>{persona.personaName}</span>
                <span className="text-[10px] text-[#5a6275]">({persona.role})</span>
              </button>
            );
          })}
        </div>

        {/* Active Persona Inspection Card */}
        {activePersona && (
          <div className="p-5 rounded-xl bg-[#181c28] border border-[#222838] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222838] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold text-[#f3f4f8]">
                    {activePersona.personaName}
                  </h4>
                  <span className="text-xs font-mono text-[#8c93a8]">• {activePersona.role}</span>
                </div>
                <p className="text-xs text-[#8c93a8] mt-0.5">
                  Primeira impressão (3s): &ldquo;{activePersona.firstImpression}&rdquo;
                </p>
              </div>

              <div className="flex items-center space-x-3 self-start sm:self-auto font-mono text-xs">
                <span className="px-2.5 py-1 rounded-md bg-[#090b10] border border-[#222838] text-[#8c93a8]">
                  Estado: <strong className="text-[#f3f4f8]">{activePersona.emotionalState}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-[#090b10] border border-[#222838] text-[#10b981]">
                  Score: <strong>{activePersona.conversionScore}/100</strong>
                </span>
              </div>
            </div>

            {/* Verdict Quote */}
            <div className="p-4 rounded-lg bg-[#090b10] border border-[#222838] flex items-start gap-3">
              <Quote className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-mono text-[#8c93a8] uppercase tracking-wider block mb-1">
                  Citação Sem Filtro da Persona:
                </span>
                <p className="text-xs sm:text-sm text-[#f3f4f8] font-medium italic leading-relaxed">
                  &ldquo;{activePersona.verdictQuote}&rdquo;
                </p>
              </div>
            </div>

            {/* Friction Points & Questions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 p-3.5 rounded-lg bg-[#0d0f15] border border-[#222838]">
                <span className="font-mono text-[#f43f5e] font-medium block">
                  Pontos de Fricção Específicos:
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-[#8c93a8] leading-relaxed">
                  {activePersona.frictionPoints.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2 p-3.5 rounded-lg bg-[#0d0f15] border border-[#222838]">
                <span className="font-mono text-[#f59e0b] font-medium block">
                  Dúvidas que Ficaram em Aberto:
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-[#8c93a8] leading-relaxed">
                  {activePersona.unansweredQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. O ESTÚDIO DE REESCRITA (COPY DIFF COM RACIONAL PERSUASIVO) */}
      <div className="studio-surface p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222838] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[#f3f4f8] tracking-tight">
              Estúdio de Reescrita de Alta Conversão
            </h3>
            <p className="text-xs text-[#8c93a8]">
              Versões otimizadas para quebrar cada objeção identificada pela banca, acompanhadas do racional persuasivo
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Switch */}
            <div className="flex items-center space-x-1 bg-[#090b10] p-1 rounded-lg border border-[#222838] text-xs font-mono">
              <button
                type="button"
                onClick={() => setCopyViewMode('split')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
                  copyViewMode === 'split'
                    ? 'bg-[#181c28] text-[#f3f4f8]'
                    : 'text-[#8c93a8] hover:text-[#f3f4f8]'
                }`}
                title="Visualização Lado a Lado"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lado a Lado</span>
              </button>
              <button
                type="button"
                onClick={() => setCopyViewMode('diff')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded transition-colors ${
                  copyViewMode === 'diff'
                    ? 'bg-[#181c28] text-[#f3f4f8]'
                    : 'text-[#8c93a8] hover:text-[#f3f4f8]'
                }`}
                title="Visualização Unificada (Diff)"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Diff</span>
              </button>
            </div>

            {/* Copy All Button */}
            <button
              onClick={handleCopyAllOptimizations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181c28] border border-[#222838] hover:border-[#3b435c] text-xs font-mono text-[#f3f4f8] transition-colors tactile-btn"
            >
              {allCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Copiar Todas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optimization Cards */}
        <div className="space-y-5">
          {report.copyOptimizations.map((item, index) => {
            const isCopied = copiedIndex === index;

            return (
              <div
                key={index}
                className="p-5 rounded-xl bg-[#181c28] border border-[#222838] space-y-4"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-[#090b10] border border-[#222838] text-[#10b981]">
                    {item.element}
                  </span>

                  <button
                    onClick={() => handleCopy(item.suggestedText, index)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#090b10] border border-[#222838] hover:border-[#3b435c] text-xs font-mono text-[#8c93a8] hover:text-[#f3f4f8] transition-colors tactile-btn"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-[#10b981]" />
                        <span className="text-[#10b981]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Otimização</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Split vs Diff View */}
                {copyViewMode === 'split' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                    {/* Original */}
                    <div className="p-3.5 rounded-lg bg-[#090b10] border border-[#222838] space-y-1.5">
                      <span className="text-[10px] font-mono text-[#8c93a8] uppercase tracking-wider block">
                        Versão Original:
                      </span>
                      <p className="text-[#8c93a8] leading-relaxed line-through decoration-[#f43f5e]/60">
                        {item.originalText}
                      </p>
                    </div>

                    {/* Suggested */}
                    <div className="p-3.5 rounded-lg bg-[#090b10] border border-[#10b981]/30 space-y-1.5">
                      <span className="text-[10px] font-mono text-[#10b981] uppercase tracking-wider block">
                        Versão Otimizada OLAB:
                      </span>
                      <p className="text-[#f3f4f8] font-medium leading-relaxed">
                        {item.suggestedText}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#090b10] border border-[#222838] space-y-2 text-xs font-sans">
                    <div className="flex items-start gap-2 text-[#8c93a8]">
                      <span className="font-mono text-[#f43f5e] font-bold select-none">-</span>
                      <span className="line-through decoration-[#f43f5e]/60">{item.originalText}</span>
                    </div>
                    <div className="flex items-start gap-2 text-[#f3f4f8] font-medium">
                      <span className="font-mono text-[#10b981] font-bold select-none">+</span>
                      <span>{item.suggestedText}</span>
                    </div>
                  </div>
                )}

                {/* Behavioral Rationale */}
                <div className="p-3 rounded-lg bg-[#0d0f15] border border-[#222838] text-xs">
                  <span className="text-[10px] font-mono text-[#8c93a8] uppercase tracking-wider block mb-1">
                    Racional Persuasivo (Por que Converte):
                  </span>
                  <p className="text-[#8c93a8] leading-relaxed">
                    {item.rationale}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

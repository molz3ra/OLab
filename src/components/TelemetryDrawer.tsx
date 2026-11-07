'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Cpu, FileText, Code2, Copy, Check, Shield, Activity } from 'lucide-react';
import { Telemetry, FinalReport } from '@/types/analysis';

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: Telemetry | null;
  report: FinalReport | null;
}

type TabType = 'metrics' | 'markdown' | 'json' | 'diagnostics';

export function TelemetryDrawer({
  isOpen,
  onClose,
  telemetry,
  report,
}: TelemetryDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('metrics');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Keyboard shortcut listener ('T' to toggle, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 't') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateMarkdownReport = () => {
    if (!report) return '# Nenhum relatório gerado ainda.';

    return `# Relatório de Auditoria — OLAB (ObjectionLab)
**Alvo:** ${report.url || 'Texto Direto'}
**Nicho:** ${report.niche || 'Geral'}
**Score de Conversão Geral:** ${report.overallScore}/100

---

## 1. Veredito Executivo & Gargalo Principal
> ${report.criticalBottleneck}

${report.executiveSummary}

---

## 2. A Banca Cética (Deliberação das Personas)
${report.personas
  .map(
    (p) => `### ${p.personaName} (${p.role})
* **Estado:** ${p.emotionalState}
* **Citação:** "${p.verdictQuote}"
* **Primeira Impressão:** ${p.firstImpression}
* **Pontos de Fricção:**
${p.frictionPoints.map((f) => `  - ${f}`).join('\n')}
* **Dúvidas Não Respondidas:**
${p.unansweredQuestions.map((q) => `  - ${q}`).join('\n')}
`
  )
  .join('\n')}

---

## 3. Estúdio de Copywriting (Antes vs. Depois)
${report.copyOptimizations
  .map(
    (c) => `### [${c.element}]
* **Original:** "${c.originalText}"
* **Otimizado pelo OLAB:** "${c.suggestedText}"
* **Racional Persuasivo:** ${c.rationale}
`
  )
  .join('\n')}
`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#090b10]/80 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-[#090b10] border-l border-[#222838] shadow-2xl flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#222838] flex items-center justify-between bg-[#11141d]">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-[#181c28] border border-[#2b3246] flex items-center justify-center text-[#10b981]">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#f3f4f8] uppercase tracking-wider font-mono">
                    Inspetor de Telemetria & Dados
                  </h3>
                  <p className="text-[11px] text-[#8c93a8]">
                    Métricas reais de latência, tokens e exportação estruturada
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-md bg-[#181c28] border border-[#222838] text-[#8c93a8] hover:text-[#f3f4f8] flex items-center justify-center transition-colors tactile-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="px-4 border-b border-[#222838] bg-[#0d0f15] flex space-x-1 text-xs font-mono">
              <button
                onClick={() => setActiveTab('metrics')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'metrics'
                    ? 'border-[#10b981] text-[#10b981] font-medium'
                    : 'border-transparent text-[#8c93a8] hover:text-[#f3f4f8]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Métricas Reais
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'markdown'
                    ? 'border-[#10b981] text-[#10b981] font-medium'
                    : 'border-transparent text-[#8c93a8] hover:text-[#f3f4f8]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Relatório Markdown
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'json'
                    ? 'border-[#10b981] text-[#10b981] font-medium'
                    : 'border-transparent text-[#8c93a8] hover:text-[#f3f4f8]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                JSON (Zod)
              </button>
              <button
                onClick={() => setActiveTab('diagnostics')}
                className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'diagnostics'
                    ? 'border-[#10b981] text-[#10b981] font-medium'
                    : 'border-transparent text-[#8c93a8] hover:text-[#f3f4f8]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Diagnóstico
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 text-xs">
              {/* TAB 1: METRICS */}
              {activeTab === 'metrics' && (
                <div className="space-y-5">
                  {telemetry ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-[#11141d] border border-[#222838]">
                          <span className="text-[10px] font-mono text-[#8c93a8] block">Latência Total</span>
                          <span className="text-lg font-semibold text-[#f3f4f8] font-mono">
                            {(telemetry.totalExecutionTimeMs / 1000).toFixed(2)}s
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-[#11141d] border border-[#222838]">
                          <span className="text-[10px] font-mono text-[#8c93a8] block">Banca Paralela</span>
                          <span className="text-lg font-semibold text-[#f3f4f8] font-mono">
                            {(telemetry.parallelPersonasTimeMs / 1000).toFixed(2)}s
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-[#11141d] border border-[#222838]">
                          <span className="text-[10px] font-mono text-[#8c93a8] block">Síntese de CRO</span>
                          <span className="text-lg font-semibold text-[#f3f4f8] font-mono">
                            {(telemetry.consolidationTimeMs / 1000).toFixed(2)}s
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-[#11141d] border border-[#222838]">
                          <span className="text-[10px] font-mono text-[#8c93a8] block">Tokens Estimados</span>
                          <span className="text-lg font-semibold text-[#10b981] font-mono">
                            {telemetry.estimatedTokensUsed.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-[#11141d] border border-[#222838] space-y-2">
                        <span className="text-[11px] font-mono font-medium text-[#f3f4f8] block">
                          Modelo Ativo:
                        </span>
                        <div className="flex items-center justify-between text-xs font-mono text-[#8c93a8]">
                          <span>Google Gemini AI</span>
                          <span className="text-[#10b981]">{telemetry.modelUsed}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-[#8c93a8] border border-dashed border-[#222838] rounded-xl font-mono">
                      Nenhuma simulação executada ainda. Submeta uma URL ou texto para visualizar a telemetria.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MARKDOWN */}
              {activeTab === 'markdown' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#8c93a8]">
                      Pronto para exportar no Notion ou Obsidian:
                    </span>
                    <button
                      onClick={() => handleCopy(generateMarkdownReport(), 'markdown')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#181c28] border border-[#222838] hover:border-[#3b435c] text-xs font-mono text-[#f3f4f8] transition-colors tactile-btn"
                    >
                      {copiedKey === 'markdown' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10b981]" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Markdown</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg bg-[#0d0f15] border border-[#222838] text-[11px] font-mono text-[#8c93a8] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[500px]">
                    {generateMarkdownReport()}
                  </pre>
                </div>
              )}

              {/* TAB 3: JSON */}
              {activeTab === 'json' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#8c93a8]">
                      Payload validado contra schemas Zod:
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          JSON.stringify({ report, telemetry }, null, 2),
                          'json'
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#181c28] border border-[#222838] hover:border-[#3b435c] text-xs font-mono text-[#f3f4f8] transition-colors tactile-btn"
                    >
                      {copiedKey === 'json' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#10b981]" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 rounded-lg bg-[#0d0f15] border border-[#222838] text-[11px] font-mono text-[#8c93a8] overflow-x-auto leading-relaxed max-h-[500px]">
                    {JSON.stringify({ report, telemetry }, null, 2)}
                  </pre>
                </div>
              )}

              {/* TAB 4: DIAGNOSTICS */}
              {activeTab === 'diagnostics' && (
                <div className="space-y-4 font-mono">
                  <div className="p-4 rounded-lg bg-[#11141d] border border-[#222838] space-y-3">
                    <h4 className="text-xs font-semibold text-[#f3f4f8]">Configuração do Cliente</h4>
                    <div className="space-y-2 text-xs text-[#8c93a8]">
                      <div className="flex justify-between py-1 border-b border-[#222838]">
                        <span>Ambiente de Execução:</span>
                        <span className="text-[#f3f4f8]">Next.js 16 (App Router)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#222838]">
                        <span>Segurança da Chave API:</span>
                        <span className="text-[#10b981]">Client LocalStorage (BYOK)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#222838]">
                        <span>Escalonamento de Requisição:</span>
                        <span className="text-[#f3f4f8]">250ms Anti-Burst</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span>Parser Estrutural de Conteúdo:</span>
                        <span className="text-[#f3f4f8]">Jina Reader API</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

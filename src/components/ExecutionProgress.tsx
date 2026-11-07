'use client';

import React, { useEffect, useState } from 'react';
import { Check, Clock } from 'lucide-react';

interface ExecutionProgressProps {
  personasCount: number;
}

const STAGES = [
  {
    id: 1,
    title: 'Leitura & Extração da Oferta',
    detail: 'Sanitizando conteúdo e isolando promessa principal, preço e chamadas de conversão.',
  },
  {
    id: 2,
    title: 'Deliberação da Banca Cética',
    detail: 'Simulando comitê sintético em paralelo com vieses de compras, governança e ROI.',
  },
  {
    id: 3,
    title: 'Síntese Heurística & Copy Diff',
    detail: 'Mapeando bloqueios fatais e gerando reescrita com racional persuasivo.',
  },
];

export function ExecutionProgress({ personasCount }: ExecutionProgressProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const stageTimer1 = setTimeout(() => setCurrentStage(2), 1200);
    const stageTimer2 = setTimeout(() => setCurrentStage(3), 3200);

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 0.1);
    }, 100);

    return () => {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto my-8 px-4 sm:px-6">
      <div className="studio-surface p-6 space-y-5 shadow-xl">
        {/* Header with silent progress */}
        <div className="flex items-center justify-between border-b border-[#222838] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-sm bg-[#10b981]" />
              <h3 className="text-xs font-mono font-semibold text-[#f3f4f8] uppercase tracking-wider">
                Focus Group em Deliberação
              </h3>
            </div>
            <p className="text-[11px] text-[#8c93a8] font-mono mt-0.5">
              {personasCount} personas avaliando a proposta concorrentemente
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs text-[#8c93a8]">
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsedSeconds.toFixed(1)}s</span>
          </div>
        </div>

        {/* Linear Hairline Progress Bar */}
        <div className="w-full bg-[#090b10] h-1 rounded-full overflow-hidden border border-[#222838]">
          <div
            className="h-full bg-[#10b981] transition-all duration-300"
            style={{ width: `${(currentStage / 3) * 100}%` }}
          />
        </div>

        {/* Stepper Pipeline */}
        <div className="space-y-2">
          {STAGES.map((stage) => {
            const isDone = currentStage > stage.id;
            const isCurrent = currentStage === stage.id;

            return (
              <div
                key={stage.id}
                className={`p-3 rounded-lg border transition-all flex items-start space-x-3 ${
                  isCurrent
                    ? 'bg-[#181c28] border-[#3b435c]'
                    : isDone
                    ? 'bg-[#0d0f15] border-[#222838] opacity-75'
                    : 'bg-transparent border-transparent opacity-30'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold mt-0.5 ${
                    isDone
                      ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                      : isCurrent
                      ? 'bg-[#f3f4f8] text-[#090b10]'
                      : 'bg-[#181c28] text-[#8c93a8]'
                  }`}
                >
                  {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : stage.id}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-[#f3f4f8]">
                      {stage.title}
                    </h4>
                    <span className="text-[10px] font-mono text-[#8c93a8]">
                      {isDone ? 'Concluído' : isCurrent ? 'Em andamento' : 'Aguardando'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8c93a8] mt-0.5 leading-snug">
                    {stage.detail}
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

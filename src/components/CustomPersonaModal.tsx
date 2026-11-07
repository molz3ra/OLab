'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, X, Check } from 'lucide-react';

interface CustomPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: {
    name: string;
    role: string;
    mainPain: string;
    convincer: string;
    skepticismLevel: number;
  }) => void;
  initialData?: {
    name: string;
    role: string;
    mainPain: string;
    convincer?: string;
  };
}

export function CustomPersonaModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CustomPersonaModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [role, setRole] = useState(initialData?.role || '');
  const [mainPain, setMainPain] = useState(initialData?.mainPain || '');
  const [convincer, setConvincer] = useState(initialData?.convincer || '');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setRole(initialData.role);
      setMainPain(initialData.mainPain);
      setConvincer(initialData.convincer || '');
    }
  }, [initialData, isOpen]);

  // Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !mainPain.trim()) return;

    onSave({
      name: name.trim(),
      role: role.trim(),
      mainPain: mainPain.trim(),
      convincer: convincer.trim(),
      skepticismLevel: 8, // Valor padrão calibrado internamente, sem controle arbitrário de slider
    });
    onClose();
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

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-[#11141d] border border-[#222838] shadow-2xl rounded-xl overflow-hidden font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-[#222838] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-[#181c28] border border-[#2b3246] flex items-center justify-center text-[#10b981]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f3f4f8] tracking-tight">
                      Adicionar Persona do Seu Negócio
                    </h3>
                    <p className="text-xs text-[#8c93a8]">
                      Crie um arquétipo com desconfianças reais do seu mercado
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

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[#8c93a8]">
                    Nome ou Arquétipo do Comprador:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Roberto Silva (Diretor Jurídico)"
                    className="w-full bg-[#090b10] border border-[#222838] focus:border-[#3b435c] rounded-lg px-3 py-2 text-xs text-[#f3f4f8] placeholder-[#5a6275] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[#8c93a8]">
                    Cargo / Contexto na Decisão:
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ex: Sócio responsável pelo compliance e contratos"
                    className="w-full bg-[#090b10] border border-[#222838] focus:border-[#3b435c] rounded-lg px-3 py-2 text-xs text-[#f3f4f8] placeholder-[#5a6275] focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[#8c93a8]">
                    Principal Objeção ou Medo contra sua Oferta:
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={mainPain}
                    onChange={(e) => setMainPain(e.target.value)}
                    placeholder="Ex: Acha que soluções SaaS guardam dados em servidores vulneráveis e que o cancelamento é burocrático."
                    className="w-full bg-[#090b10] border border-[#222838] focus:border-[#3b435c] rounded-lg px-3 py-2 text-xs text-[#f3f4f8] placeholder-[#5a6275] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[#8c93a8]">
                    O que convenceria essa pessoa? (Opcional):
                  </label>
                  <input
                    type="text"
                    value={convincer}
                    onChange={(e) => setConvincer(e.target.value)}
                    placeholder="Ex: Termos de confidencialidade explícitos e garantia de reembolso em 30 dias"
                    className="w-full bg-[#090b10] border border-[#222838] focus:border-[#3b435c] rounded-lg px-3 py-2 text-xs text-[#f3f4f8] placeholder-[#5a6275] focus:outline-none transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#222838] flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-md border border-[#222838] text-xs text-[#8c93a8] hover:text-[#f3f4f8] hover:bg-[#181c28] transition-colors tactile-btn"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || !role.trim() || !mainPain.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#10b981] text-[#090b10] font-semibold text-xs hover:bg-[#10b981]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all tactile-btn"
                  >
                    <span>Adicionar à Banca</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


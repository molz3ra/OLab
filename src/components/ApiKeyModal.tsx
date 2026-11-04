'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Eye, EyeOff, ShieldCheck, ExternalLink, X, Check, Trash2, AlertCircle, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }: ApiKeyModalProps) {
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setInputKey('');
    onSaveApiKey('');
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-[#0b0d13] border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden font-sans"
            >
              {/* Top Accent Line */}
              <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

              {/* Header */}
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      Configurar Google Gemini API Key
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Análises de CRO e comitê sintético em tempo real com LLM
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors tactile-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSave} className="p-6 space-y-5">
                {/* Security info card */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-200">Privacidade Local (BYOK):</strong> Sua chave é armazenada com segurança exclusivamente no <span className="font-mono text-zinc-300">localStorage</span> do seu navegador. Ela nunca é gravada em bancos de dados e segue apenas na requisição para gerar a auditoria.
                  </div>
                </div>

                {/* Input field */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-medium text-zinc-300">
                    Sua API Key do Google AI Studio:
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#12141c] border border-white/[0.1] rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 pr-11 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 transition-colors"
                      aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Free key helper */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-500">Não tem uma chave ainda?</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4"
                  >
                    <span>Obter chave gratuita no Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/[0.06]">
                  {apiKey ? (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-medium transition-all tactile-btn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Chave</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-mono">Modo: Sem chave salva</span>
                  )}

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-all tactile-btn"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!inputKey.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-zinc-950 text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all tactile-btn cursor-pointer disabled:cursor-not-allowed"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Chave Salva!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Salvar e Ativar IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


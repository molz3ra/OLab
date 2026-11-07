'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Eye, EyeOff, ShieldCheck, ExternalLink, X, Check, Trash2 } from 'lucide-react';

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

  // Fechar com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
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
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#f3f4f8] tracking-tight">
                      Configurar Google Gemini API Key
                    </h3>
                    <p className="text-xs text-[#8c93a8]">
                      Utilize sua própria cota gratuita para auditorias ilimitadas
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
              <form onSubmit={handleSave} className="p-5 space-y-4">
                {/* Security info card */}
                <div className="p-3.5 rounded-lg bg-[#181c28] border border-[#222838] flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#8c93a8] leading-relaxed">
                    <strong className="text-[#f3f4f8]">Armazenamento 100% Local:</strong> Sua chave fica salva exclusivamente no seu navegador (<span className="font-mono text-[#f3f4f8]">localStorage</span>). Ela nunca é registrada em bancos de dados externos.
                  </div>
                </div>

                {/* Input field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[#8c93a8]">
                    Chave de API (Google AI Studio):
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-[#090b10] border border-[#222838] focus:border-[#3b435c] rounded-lg px-3 py-2 text-xs font-mono text-[#f3f4f8] placeholder-[#5a6275] focus:outline-none transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8c93a8] hover:text-[#f3f4f8] transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Helper Link */}
                <div className="pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#8c93a8] hover:text-[#f3f4f8] transition-colors"
                  >
                    <span>Como obter uma chave gratuita no Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#222838] flex items-center justify-between">
                  {apiKey ? (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono text-[#f43f5e] hover:bg-[#f43f5e]/10 transition-colors tactile-btn"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover Chave</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-1.5 rounded-md border border-[#222838] text-xs text-[#8c93a8] hover:text-[#f3f4f8] hover:bg-[#181c28] transition-colors tactile-btn"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!inputKey.trim()}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#10b981] text-[#090b10] font-semibold text-xs hover:bg-[#10b981]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all tactile-btn"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#090b10]" />
                          <span>Salvo!</span>
                        </>
                      ) : (
                        <span>Salvar Chave</span>
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

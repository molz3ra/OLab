"use client";

import { Icon } from "./Icon";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[88vh] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <div className="flex items-start justify-between p-6 border-b border-[var(--color-border-subtle)] shrink-0">
          <div>
            <div className="eyebrow text-[var(--color-accent)] mb-1 flex items-center gap-1.5">
              <Icon name="shieldCheck" size={13} />
              <span>CONFORMIDADE LEGAL & PRIVACIDADE</span>
            </div>
            <h2
              id="privacy-modal-title"
              className="text-xl sm:text-2xl font-serif text-[var(--color-text-primary)]"
            >
              Termos de Uso e Política de Privacidade (LGPD)
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Última atualização: Novembro de 2026 · Em estrita conformidade com a Lei Federal nº 13.709/2018 (LGPD).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors shrink-0"
            title="Fechar"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Scrollable Legal Content */}
        <div className="p-6 overflow-y-auto text-xs text-[var(--color-text-secondary)] space-y-5 leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              1. Identificação do Controlador e Escopo
            </h3>
            <p>
              O <strong>OLAB (The Objection Lab)</strong> é uma plataforma de pesquisa analítica de ofertas e páginas de conversão por meio de agentes sintéticos com inteligência artificial. Esta Política explica de forma transparente como coletamos, tratamos, protegemos e armazenamos dados no Brasil, nos termos do Art. 9º da LGPD.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              2. Princípio da Minimização de Dados (Art. 6º, III)
            </h3>
            <p>
              Coletamos estritamente os dados essenciais para o funcionamento seguro da aplicação:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Modo Convidado (Sem login):</strong> Nenhum dado cadastral é coletado. As análises de degustação são mantidas de forma isolada no navegador do próprio visitante (via <code>localStorage</code>).
              </li>
              <li>
                <strong>Usuário Cadastrado:</strong> Coletamos apenas <strong>Nome completo</strong> e <strong>E-mail</strong> para identificação do laboratório e autenticação.
              </li>
              <li>
                <strong>Credenciais:</strong> As senhas são protegidas com algoritmos de hash criptográfico unidirecional de alta entropia. Não possuímos acesso às suas senhas em texto puro.
              </li>
              <li>
                <strong>Não Coletamos:</strong> Dados sensíveis (origem racial, religião, biometria, dados de saúde) nem documentos como CPF ou dados bancários.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              3. Finalidade do Tratamento (Art. 6º, I)
            </h3>
            <p>Os dados tratados destinam-se exclusivamente a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Autenticar o acesso do usuário ao seu workspace privado na nuvem.</li>
              <li>Armazenar e recuperar seus relatórios de objeção e personas personalizadas.</li>
              <li>Garantir a segurança da aplicação, integridade de sessões e prevenção de fraudes.</li>
            </ul>
            <p>
              <strong>Não comercializamos, não compartilhamos e não transferimos</strong> seus dados pessoais ou cópias de landing pages para anunciantes ou redes de rastreamento de terceiros.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              4. Tratamento por Modelos de Inteligência Artificial
            </h3>
            <p>
              Para a execução do foco sintético de pesquisa, o texto ou URL da landing page informado na análise é submetido à API Google Gemini. Caso utilize o modo <em>Bring Your Own Key (BYOK)</em>, sua chave é transmitida com segurança via cabeçalho HTTP estritamente para a finalidade de consulta contratada por você. Não utilizamos suas cópias privadas para treinamento de modelos de terceiros.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              5. Armazenamento, Segurança e Soberania de Dados
            </h3>
            <p>
              Nossos dados de produção são armazenados em nuvem distribuída através do <strong>Turso Cloud (LibSQL)</strong>, em datacenters localizados em <strong>São Paulo, Brasil (região AWS sa-east-1)</strong>, respeitando as diretrizes de transferência e soberania de dados nacionais. Todas as conexões utilizam criptografia de ponta a ponta (TLS 1.3) e Prepared Statements contra vazamentos.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              6. Direitos do Titular de Dados (Art. 18 da LGPD)
            </h3>
            <p>Você possui total controle sobre seus dados e pode exercer a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Acesso e Confirmação:</strong> Visualizar todos os relatórios e dados salvos no seu workspace.
              </li>
              <li>
                <strong>Portabilidade dos Dados (Inciso V):</strong> Exportar um arquivo <code>.json</code> completo de toda a sua conta através da opção <em>Exportar backup</em>.
              </li>
              <li>
                <strong>Eliminação Definitiva (Inciso VI):</strong> Excluir sua conta e apagar imediatamente todos os seus relatórios, personas e credenciais diretamente nas configurações da conta.
              </li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              7. Cookies Estritamente Necessários
            </h3>
            <p>
              Utilizamos exclusivamente cookies técnicos estritamente necessários para manter sua sessão de autenticação ativa e protegida contra ataques de CSRF. Não utilizamos cookies invasivos de remarketing ou publicidade comportamental.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-serif">
              8. Canal de Contato do Encarregado (DPO)
            </h3>
            <p>
              Para dúvidas, solicitações ou exercício de direitos referentes aos seus dados pessoais, você pode contatar diretamente o Encarregado pelo e-mail:{" "}
              <a
                href="mailto:privacidade@olab.ai"
                className="text-[var(--color-accent)] underline hover:opacity-80"
              >
                privacidade@olab.ai
              </a>
              .
            </p>
          </section>
        </div>

        {/* Bottom Footer */}
        <div className="p-4 bg-[var(--color-bg-subtle)] border-t border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[var(--color-text-tertiary)] font-mono">
            Lei Federal 13.709/2018 · LGPD
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold text-xs tracking-wide hover:opacity-90 transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

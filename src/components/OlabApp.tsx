'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { Icon, type IconName } from "./Icon";
import {
  EMPTY_DRAFT,
  PERSONAS,
  PRESETS,
  SEGMENTS,
  engineLabel,
  inferDecision,
  makeExampleReport,
  personaQuestion,
  reportDisclaimer,
  reportMarkdown,
  validateDraft,
  type Decision,
  type Draft,
  type Persona,
  type Preset,
  type Report,
} from "@/lib/lab";
import { annotateSource, diffWords, fillPlaceholder, parsePlaceholders } from "@/lib/diff";
import {
  DEFAULT_MODEL,
  GEMINI_MODELS,
  GeminiError,
  MAX_SOURCE_CHARS,
  analyze,
  verifyKey,
  type GeminiModel,
} from "@/lib/gemini";
import { ReaderError, readPage } from "@/lib/reader";
import { isAbort } from "@/lib/signal";
import {
  KEYS,
  load,
  loadText,
  parseDraft,
  parsePersonas,
  parseReports,
  save,
  saveText,
  serializeReports,
} from "@/lib/storage";
import {
  applyTheme,
  isThemePref,
  resolveTheme,
  systemPrefersDark,
  type ThemePref,
} from "@/lib/theme";
import { useSession } from "@/lib/auth-client";
import { getGuestUsage, incrementGuestUsage, type GuestQuota } from "@/lib/trial";
import { AuthModal } from "./AuthModal";
import { TrialGateModal } from "./TrialGateModal";
import { AccountModal } from "./AccountModal";
import { UserMenu } from "./UserMenu";

type View = "studio" | "report" | "reports" | "personas" | "guide";
type Dialog = "key" | "persona" | "telemetry" | "clear" | null;
type Phase = "reading" | "analyzing" | "finishing";
type RunError = { message: string; action?: "key" | "text" | "retry" };

const modelLabel = (model: GeminiModel) =>
  GEMINI_MODELS.find((m) => m.id === model)?.label || "Flash";

function relativeDate(iso: string) {
  const date = new Date(iso);
  const diff = (Date.now() - date.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  if (diff < 60) return "agora há pouco";
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 7) return rtf.format(-Math.round(diff / 86400), "day");
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function navigateTabs(event: ReactKeyboardEvent<HTMLDivElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const current = tabs.findIndex((tab) => tab === document.activeElement);
  if (current < 0) return;
  event.preventDefault();
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next]?.focus();
  tabs[next]?.click();
}

function Brand() {
  return (
    <div className="brand" aria-label="OLAB — ObjectionLab">
      <span className="brand-word">
        olab
        <span className="brand-point" />
      </span>
      <span className="brand-caption">THE OBJECTION LAB</span>
    </div>
  );
}

function Sidebar({
  view,
  onNavigate,
  reportCount,
  hasKey,
  model,
  onKey,
  theme,
  onTheme,
  mobile,
  onClose,
  blocked,
  session,
  quota,
  onOpenAuth,
  onOpenAccount,
}: {
  view: View;
  onNavigate: (view: View) => void;
  reportCount: number;
  hasKey: boolean;
  model: GeminiModel;
  onKey: () => void;
  theme: ThemePref;
  onTheme: (theme: ThemePref) => void;
  mobile: boolean;
  onClose: () => void;
  blocked: boolean;
  session: { user: { id: string; name: string; email: string; image?: string | null } } | null;
  quota: GuestQuota;
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenAccount: () => void;
}) {
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 800px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const links: { view: View; name: string; icon: IconName }[] = [
    { view: "studio", name: "Nova análise", icon: "plus" },
    { view: "reports", name: "Relatórios", icon: "report" },
    { view: "personas", name: "Biblioteca de personas", icon: "people" },
  ];
  return (
    <>
      {mobile && (
        <button className="mobile-scrim" aria-label="Fechar navegação" onClick={onClose} />
      )}
      <aside
        className={`sidebar ${mobile ? "is-open" : ""}`}
        inert={blocked || (compact && !mobile)}
      >
        <div className="brand-area">
          <Brand />
          <button
            className="icon-button mobile-close"
            onClick={onClose}
            aria-label="Fechar navegação"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace-user-area" style={{ padding: "0 14px 12px" }}>
          <UserMenu
            session={session}
            quota={quota}
            onOpenAuth={onOpenAuth}
            onOpenAccount={onOpenAccount}
          />
        </div>
        <span className="nav-label">LABORATÓRIO</span>
        <nav className="side-nav" aria-label="Navegação principal">
          {links.map((link) => (
            <button
              key={link.view}
              className={
                view === link.view || (view === "report" && link.view === "reports") ? "active" : ""
              }
              onClick={() => onNavigate(link.view)}
            >
              <Icon name={link.icon} size={17} />
              <span>{link.name}</span>
              {link.view === "reports" && <small>{reportCount.toString().padStart(2, "0")}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-rule" />
          <p>
            Menos suposições.
            <br />
            Perguntas melhores.
          </p>
          <span>Um teste antes do investimento.</span>
        </div>
        <div className="sidebar-bottom">
          <button className="guide-link" onClick={() => onNavigate("guide")}>
            <Icon name="book" size={17} /> Guia de análise <Icon name="arrowUp" size={13} />
          </button>
          <button className={`connection-card ${hasKey ? "is-connected" : "is-server"}`} onClick={onKey}>
            <div>
              <Icon name="key" size={17} />
              <span>{hasKey ? `Gemini · ${modelLabel(model)}` : "Modo Servidor Ativo"}</span>
              <Icon name="chevron" size={13} />
            </div>
            <p>
              {hasKey
                ? "Chave pessoal ativa (BYOK). Clique para gerenciar."
                : "Usando a chave padrão do sistema. Clique para conectar chave pessoal."}
            </p>
          </button>
          <ThemeSwitch value={theme} onChange={onTheme} />
          <div className="sidebar-version">
            <span>OLAB / V.03</span>
            <span>Feito para questionar.</span>
          </div>
        </div>
      </aside>
    </>
  );
}

function ThemeSwitch({
  value,
  onChange,
}: {
  value: ThemePref;
  onChange: (theme: ThemePref) => void;
}) {
  const options: { value: ThemePref; label: string; icon: IconName }[] = [
    { value: "system", label: "Sistema", icon: "monitor" },
    { value: "light", label: "Claro", icon: "sun" },
    { value: "dark", label: "Escuro", icon: "moon" },
  ];
  const keydown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const index = options.findIndex((o) => o.value === value);
    const next = options[(index + delta + options.length) % options.length];
    onChange(next.value);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
  };
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Tema" onKeyDown={keydown}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          data-value={o.value}
          aria-checked={value === o.value}
          aria-label={o.label}
          tabIndex={value === o.value ? 0 : -1}
          className={value === o.value ? "active" : ""}
          onClick={() => onChange(o.value)}
        >
          <Icon name={o.icon} size={14} />
          <span aria-hidden="true">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function SectionTitle({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-title">
      <span className="step-number">{number}</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function ResearchSketch() {
  return (
    <div
      className="research-sketch"
      aria-label="Uma oferta vista por diferentes perfis de compradores"
      role="img"
    >
      <div className="sketch-caption">
        <span>FIG. 01</span>
        <span>MUDAR A PERSPECTIVA</span>
      </div>
      <div className="sketch-space">
        <svg className="sketch-connections" viewBox="0 0 320 240" fill="none" aria-hidden="true">
          <path
            d="M78 40h82v59M267 89h-72M61 176h82v-34M244 209h-83v-58"
            stroke="var(--sketch-stroke)"
            strokeDasharray="3 4"
          />
          <circle cx="160" cy="99" r="3" fill="var(--sketch-dot)" />
          <circle cx="195" cy="89" r="3" fill="var(--sketch-dot)" />
          <circle cx="143" cy="142" r="3" fill="var(--sketch-dot)" />
          <circle cx="161" cy="151" r="3" fill="var(--sketch-dot)" />
        </svg>
        <div className="sketch-document">
          <div>
            <span />
            <span />
            <span />
          </div>
          <b>Sua oferta.</b>
          <i />
          <i />
          <i />
          <span className="sketch-doc-cta">Eu compraria?</span>
        </div>
        <div className="sketch-question question-one">
          <Icon name="chart" size={15} />
          <span>“O retorno compensa?”</span>
        </div>
        <div className="sketch-question question-two">
          <Icon name="shield" size={15} />
          <span>“Posso confiar?”</span>
        </div>
        <div className="sketch-question question-three">
          <Icon name="user" size={15} />
          <span>“Isso é para mim?”</span>
        </div>
        <span className="sketch-cross cross-one">+</span>
        <span className="sketch-cross cross-two">+</span>
      </div>
      <p>
        Uma página. Diferentes motivos
        <br />
        para não seguir em frente.
      </p>
    </div>
  );
}

function PersonaOption({
  persona,
  selected,
  onToggle,
}: {
  persona: Persona;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={`persona-option ${selected ? "is-selected" : ""}`}
      onClick={onToggle}
      aria-pressed={selected}
    >
      <span className="persona-symbol">
        <Icon name={persona.icon} size={20} />
      </span>
      <span className="persona-option-text">
        <strong>{persona.name}</strong>
        <small>{persona.focus.split(",")[0]}</small>
      </span>
      <span className="checkbox">{selected && <Icon name="check" size={12} />}</span>
    </button>
  );
}

function Studio({
  draft,
  setDraft,
  personas,
  onRun,
  onPreset,
  onCustom,
  running,
  onCancel,
  hasKey,
  onKey,
  phase,
  runError,
  onErrorAction,
  onDismissError,
  session,
  guestQuota,
  onOpenAuth,
}: {
  draft: Draft;
  setDraft: (draft: Draft) => void;
  personas: Persona[];
  onRun: () => void;
  onPreset: (preset: Preset) => void;
  onCustom: () => void;
  running: boolean;
  onCancel: () => void;
  hasKey: boolean;
  onKey: () => void;
  phase: Phase;
  runError: RunError | null;
  onErrorAction: (action: NonNullable<RunError["action"]>) => void;
  onDismissError: () => void;
  session: { user: { id: string; name: string; email: string } } | null;
  guestQuota: GuestQuota;
  onOpenAuth: (mode?: "login" | "signup") => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [clipboardError, setClipboardError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [urlChecking, setUrlChecking] = useState(false);
  const [urlPreview, setUrlPreview] = useState<{ title?: string; chars?: number; error?: string } | null>(null);

  const checkUrl = async () => {
    const raw = draft.url.trim();
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      setUrlPreview({ error: "Digite ou cole uma URL iniciando com https://" });
      return;
    }
    setUrlChecking(true);
    setUrlPreview(null);
    try {
      const res = await fetch(`/api/scrape?url=${encodeURIComponent(raw)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          setUrlPreview({
            title: data.title || "Página lida com sucesso",
            chars: data.text.length,
          });
        } else {
          setUrlPreview({ error: "Nenhum conteúdo textual encontrado na URL." });
        }
      } else {
        setUrlPreview({ error: "Não foi possível acessar esta URL." });
      }
    } catch {
      setUrlPreview({ error: "Falha de rede ao tentar ler a URL." });
    } finally {
      setUrlChecking(false);
    }
  };
  const update = (patch: Partial<Draft>) => {
    setError(null);
    onDismissError();
    setDraft({ ...draft, ...patch });
  };
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const message = validateDraft(draft);
    setError(message);
    if (!message) onRun();
  };
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "Enter" &&
        !running &&
        !document.querySelector('[role="dialog"]')
      ) {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const started = performance.now();
    const timer = window.setInterval(() => setElapsed((performance.now() - started) / 1000), 100);
    return () => clearInterval(timer);
  }, [running]);
  const steps: { key: Phase; label: string }[] = [
    ...(draft.mode === "url" ? [{ key: "reading" as const, label: "Lendo a página" }] : []),
    { key: "analyzing", label: "Consultando a banca" },
    { key: "finishing", label: "Organizando o relatório" },
  ];
  const stepIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === phase),
  );
  const errorActions: Record<NonNullable<RunError["action"]>, string> = {
    key: "Revisar chave",
    text: "Usar texto da página",
    retry: "Tentar novamente",
  };
  const toggle = (id: string) => {
    const next = draft.selected.includes(id)
      ? draft.selected.filter((x) => x !== id)
      : [...draft.selected, id];
    if (next.length > 5) {
      setError("A banca comporta até 5 personas. Remova uma antes de adicionar outra.");
      return;
    }
    update({ selected: next });
  };
  return (
    <>
      <div className="page-heading studio-heading">
        <div>
          <span className="eyebrow">UM NOVO PONTO DE VISTA</span>
          <h1>
            Antes do clique,
            <br />
            <span>existe uma dúvida.</span>
          </h1>
        </div>
        <div className="heading-description">
          <p>
            Coloque sua página diante de uma banca cética. <br />
            Encontre as objeções. Ajuste a oferta. <br />
            Só então, invista em tráfego.
          </p>
          <span>
            <i /> PESQUISA DE CONVERSÃO, SEM ACHISMO.
          </span>
        </div>
      </div>
      <div className="studio-layout">
        <form className="analysis-form" onSubmit={submit}>
          <fieldset disabled={running}>
            <section className="form-section source-section">
              <SectionTitle number="01" title="O que vamos analisar?" />
              <div
                className="input-tabs"
                role="tablist"
                aria-label="Tipo de conteúdo"
                onKeyDown={navigateTabs}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={draft.mode === "url"}
                  tabIndex={draft.mode === "url" ? 0 : -1}
                  className={draft.mode === "url" ? "active" : ""}
                  onClick={() => update({ mode: "url" })}
                >
                  <Icon name="globe" size={16} /> URL da página
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={draft.mode === "text"}
                  tabIndex={draft.mode === "text" ? 0 : -1}
                  className={draft.mode === "text" ? "active" : ""}
                  onClick={() => update({ mode: "text" })}
                >
                  <Icon name="text" size={16} /> Texto da página
                </button>
              </div>
              {draft.mode === "url" ? (
                <>
                  <label className="sr-only" htmlFor="page-url">
                    URL da página
                  </label>
                  <div className="url-field">
                    <Icon name="globe" size={18} />
                    <input
                      id="page-url"
                      value={draft.url}
                      onChange={(e) => {
                        update({ url: e.target.value });
                        setUrlPreview(null);
                      }}
                      placeholder="https://suaempresa.com"
                      autoComplete="url"
                      aria-describedby="url-hint"
                    />
                    {draft.url.trim().startsWith("http") && (
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: "0 10px", height: "30px", fontSize: "11px", whiteSpace: "nowrap" }}
                        onClick={checkUrl}
                        disabled={urlChecking}
                        title="Testar leitura e ver prévia do conteúdo"
                      >
                        {urlChecking ? "Lendo…" : "Verificar"}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Colar URL"
                      onClick={async () => {
                        try {
                          const pasted = await navigator.clipboard.readText();
                          update({ url: pasted });
                          setUrlPreview(null);
                          setClipboardError("");
                        } catch {
                          setClipboardError(
                            "Não foi possível acessar a área de transferência. Cole a URL no campo.",
                          );
                        }
                      }}
                    >
                      <Icon name="copy" size={15} />
                    </button>
                  </div>
                  {urlPreview && (
                    <div className={`url-preview-card ${urlPreview.error ? "is-error" : "is-ready"}`}>
                      <Icon name={urlPreview.error ? "alert" : "check"} size={14} />
                      <div style={{ flex: 1 }}>
                        <strong>{urlPreview.error ? "Aviso de leitura" : urlPreview.title}</strong>
                        <small>
                          {urlPreview.error
                            ? urlPreview.error
                            : `${urlPreview.chars?.toLocaleString("pt-BR")} caracteres identificados · Pronto para a banca`}
                        </small>
                      </div>
                      <button type="button" className="icon-button" onClick={() => setUrlPreview(null)}>
                        <Icon name="close" size={13} />
                      </button>
                    </div>
                  )}
                  <p className="field-hint" id="url-hint">
                    {clipboardError ||
                      "A página precisa ser pública. O texto é extraído antes de ir para a banca."}
                  </p>
                </>
              ) : (
                <>
                  <label className="sr-only" htmlFor="page-text">
                    Texto da página
                  </label>
                  <textarea
                    id="page-text"
                    className="copy-input"
                    value={draft.text}
                    onChange={(e) => update({ text: e.target.value })}
                    placeholder="Cole o título, a proposta, os benefícios e o botão de ação da sua página…"
                  />
                  <div className="text-counter">
                    <span>
                      {draft.text.length.toLocaleString("pt-BR")} caracteres ·{" "}
                      {draft.text.trim() ? draft.text.trim().split(/\s+/).length : 0} palavras
                    </span>
                    <button type="button" onClick={() => update({ text: "" })}>
                      Limpar texto
                    </button>
                  </div>
                </>
              )}
              <div className="segment-field">
                <label htmlFor="segment">Qual é o segmento da oferta?</label>
                <div className="select-field">
                  <select
                    id="segment"
                    value={draft.segment}
                    onChange={(e) => update({ segment: e.target.value as Draft["segment"] })}
                  >
                    {SEGMENTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <Icon name="down" size={14} />
                </div>
              </div>
            </section>
            <section className="form-section audience-section">
              <SectionTitle number="02" title="Quem está do outro lado?">
                <span className="selection-count">{draft.selected.length}/5</span>
              </SectionTitle>
              <p className="section-description">
                Escolha de 3 a 5 perfis. Cada um questiona uma parte da oferta.
              </p>
              <div className="persona-options">
                {personas.map((p) => (
                  <PersonaOption
                    key={p.id}
                    persona={p}
                    selected={draft.selected.includes(p.id)}
                    onToggle={() => toggle(p.id)}
                  />
                ))}
                <button className="custom-persona-button" type="button" onClick={onCustom}>
                  <span>
                    <Icon name="plus" size={18} />
                  </span>
                  <span>
                    Criar meu próprio perfil<small>Uma perspectiva do seu negócio</small>
                  </span>
                </button>
              </div>
            </section>
          </fieldset>
          <div className="form-submit">
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {!running && runError && (
              <div className="run-error" role="alert">
                <Icon name="alert" size={18} />
                <div>
                  <strong>A análise não foi concluída.</strong>
                  <p>{runError.message}</p>
                  <div className="run-error-actions">
                    {runError.action && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => onErrorAction(runError.action!)}
                      >
                        <Icon
                          name={
                            runError.action === "key"
                              ? "key"
                              : runError.action === "text"
                                ? "text"
                                : "refresh"
                          }
                          size={15}
                        />
                        {errorActions[runError.action]}
                      </button>
                    )}
                    <button type="button" className="text-button" onClick={onDismissError}>
                      Dispensar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {running ? (
              <div className="execution-progress" role="status">
                <div className="execution-line">
                  <span className="spinner" />
                  <strong>{steps[stepIndex].label}</strong>
                  <span>{elapsed.toFixed(1)}s</span>
                </div>
                <ol className="execution-steps" aria-label="Etapas da análise">
                  {steps.map((s, i) => (
                    <li
                      key={s.key}
                      className={i < stepIndex ? "done" : i === stepIndex ? "current" : ""}
                      aria-current={i === stepIndex ? "step" : undefined}
                    >
                      <span>{i < stepIndex ? <Icon name="check" size={11} /> : i + 1}</span>
                      {s.label}
                    </li>
                  ))}
                </ol>
                <div className="execution-track is-indeterminate">
                  <i />
                </div>
                <div className="session-live-board">
                  <div className="session-source-preview">
                    <span>MATERIAL NA MESA</span>
                    <p>
                      {draft.mode === "url"
                        ? `Extraindo e auditando ${draft.url.trim() || "a URL informada"}`
                        : draft.text.trim().slice(0, 180) +
                          (draft.text.trim().length > 180 ? "…" : "")}
                    </p>
                  </div>
                  <div className="session-panel-grid" aria-label="Personas avaliando a oferta">
                    {personas
                      .filter((p) => draft.selected.includes(p.id))
                      .map((p, idx) => (
                        <div
                          key={p.id}
                          className={`session-persona-card ${
                            phase === "analyzing" &&
                            Math.floor(elapsed * 1.2) % draft.selected.length === idx
                              ? "is-speaking"
                              : ""
                          }`}
                        >
                          <span className="persona-symbol">
                            <Icon name={p.icon} size={16} />
                          </span>
                          <div>
                            <strong>{p.name}</strong>
                            <small>{p.fears || p.focus}</small>
                          </div>
                          <em>{p.skepticism}/10</em>
                        </div>
                      ))}
                  </div>
                </div>
                <p className="execution-note">
                  {phase === "reading"
                    ? "Extraindo o texto público da página."
                    : `${draft.selected.length} personas avaliam a oferta. Costuma levar de 15 a 40 segundos.`}
                </p>
                <button type="button" onClick={onCancel}>
                  Cancelar análise
                </button>
              </div>
            ) : (
              <>
                <p className={`key-reminder ${hasKey ? "is-personal" : "is-server"}`}>
                  <Icon name={hasKey ? "key" : "sparkle"} size={15} />
                  <span>
                    {hasKey ? (
                      <>
                        Chave pessoal ativa (<strong>BYOK</strong>).{" "}
                        <button type="button" className="inline-link" onClick={onKey}>
                          Gerenciar chave
                        </button>
                      </>
                    ) : (
                      <>
                        Pronto para analisar com a <strong>chave compartilhada do servidor</strong>.{" "}
                        <button type="button" className="inline-link" onClick={onKey}>
                          Usar sua própria API Key
                        </button>
                      </>
                    )}
                  </span>
                </p>
                {/* Guest Quota Warning if Locked */}
                {!session && guestQuota.isLocked && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      background: "rgba(245, 158, 11, 0.08)",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "12px",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <Icon name="lock" size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong style={{ display: "block", color: "var(--color-text-primary)", fontWeight: 600, marginBottom: "2px" }}>
                        Limite de degustação atingido (3/3 análises gratuitas)
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", lineHeight: 1.5, display: "block" }}>
                        Você utilizou suas 3 análises gratuitas locais. Crie sua conta para desbloquear análises ilimitadas e salvar todo seu acervo na nuvem.
                      </span>
                    </div>
                  </div>
                )}

                <div className="submit-row">
                  <div className="selected-avatars">
                    {draft.selected.slice(0, 4).map((id) => (
                      <span key={id} title={personas.find((p) => p.id === id)?.name}>
                        <Icon name={personas.find((p) => p.id === id)?.icon || "user"} size={14} />
                      </span>
                    ))}
                    <small>
                      {draft.selected.length} perspectivas.
                      <br />
                      <b>Uma oferta melhor.</b>
                    </small>
                  </div>
                  <button
                    type="submit"
                    className="primary-button"
                    style={!session && guestQuota.isLocked ? { background: "var(--color-accent)", opacity: 0.95 } : undefined}
                  >
                    {!session && guestQuota.isLocked ? (
                      <>
                        <Icon name="lock" size={15} /> Desbloquear com conta gratuita
                      </>
                    ) : (
                      <>
                        Iniciar análise <Icon name="arrow" size={17} />
                      </>
                    )}
                  </button>
                </div>
                <div className="submit-footnote">
                  <span>
                    <Icon name={hasKey ? "lock" : "sparkle"} size={12} />{" "}
                    {hasKey
                      ? "Enviado só ao Google com a sua chave pessoal."
                      : "Executando com a chave padrão do sistema."}
                  </span>
                  <span>
                    {!session ? (
                      <button
                        type="button"
                        onClick={() => onOpenAuth("signup")}
                        className="inline-link"
                        style={{ fontSize: "11px" }}
                      >
                        Degustação: <b>{guestQuota.used}/3</b> usadas · Criar conta
                      </button>
                    ) : (
                      "⌘ / Ctrl + Enter"
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        </form>
        <aside className="context-rail">
          <ResearchSketch />
          <section className="examples-section">
            <div className="rail-label">
              VEJA NA PRÁTICA <span>SEM PREENCHER NADA</span>
            </div>
            <h2>Comece por um exemplo.</h2>
            <p>Relatórios ilustrativos, sem uso da sua chave. Veja o que você vai receber.</p>
            <div className="example-list">
              {PRESETS.map((preset, i) => (
                <button key={preset.id} disabled={running} onClick={() => onPreset(preset)}>
                  <span className="example-number">0{i + 1}</span>
                  <span>
                    <strong>{preset.name}</strong>
                    <small>{preset.type}</small>
                  </span>
                  <Icon name="arrowUp" size={16} />
                </button>
              ))}
            </div>
          </section>
          <p className="honesty-note">
            <span>NOTA DO LABORATÓRIO</span>Uma simulação ajuda a encontrar hipóteses.
            <br />
            Não substitui conversar com clientes reais.
          </p>
        </aside>
      </div>
      <footer className="page-footer">
        <span>BOAS PERGUNTAS VÊM ANTES DE BOAS CONVERSÕES.</span>
        <span>ObjectionLab © {new Date().getFullYear()}</span>
      </footer>
    </>
  );
}

function Radar({ report, baseline }: { report: Report; baseline?: Report }) {
  const point = (i: number, radius: number) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    return `${150 + Math.cos(a) * radius},${118 + Math.sin(a) * radius}`;
  };
  return (
    <svg
      className="radar-chart"
      viewBox="0 0 300 250"
      role="img"
      aria-label={`Mapa de avaliação: ${report.dimensions.map((d) => `${d.label} ${d.value}`).join(", ")}`}
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={report.dimensions.map((_, i) => point(i, 82 * scale)).join(" ")}
        />
      ))}
      {report.dimensions.map((_, i) => (
        <line
          key={i}
          x1="150"
          y1="118"
          x2={point(i, 82).split(",")[0]}
          y2={point(i, 82).split(",")[1]}
        />
      ))}
      {baseline && (
        <polygon
          className="radar-baseline"
          points={report.dimensions
            .map((d, i) => {
              const prev = baseline.dimensions.find((x) => x.label === d.label)?.value ?? d.value;
              return point(i, (prev / 100) * 82);
            })
            .join(" ")}
        />
      )}
      <polygon
        className="radar-fill"
        points={report.dimensions.map((d, i) => point(i, (d.value / 100) * 82)).join(" ")}
      />
      {report.dimensions.map((d, i) => {
        const [x, y] = point(i, (d.value / 100) * 82).split(",");
        const [lx, ly] = point(i, 111).split(",");
        return (
          <g key={d.label}>
            <circle cx={x} cy={y} r="3.5">
              <title>
                {d.label}: {d.value}/100 — {d.detail}
              </title>
            </circle>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AnnotatedText({
  source,
  objections,
  activeIndex,
  onSelect,
}: {
  source: string;
  objections: Report["objections"];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}) {
  const segments = annotateSource(source, objections);
  return (
    <div className="annotated-source">
      {segments.map((seg, idx) =>
        seg.objectionIndex === undefined ? (
          <span key={idx}>{seg.text}</span>
        ) : (
          <button
            key={idx}
            type="button"
            className={`source-highlight ${activeIndex === seg.objectionIndex ? "is-active" : ""}`}
            onClick={() => onSelect(seg.objectionIndex!)}
            title={`Objeção 0${seg.objectionIndex + 1}: ${objections[seg.objectionIndex]?.title}`}
          >
            <mark>{seg.text}</mark>
            <sup>0{seg.objectionIndex + 1}</sup>
          </button>
        ),
      )}
    </div>
  );
}

function decisionClass(decision: Decision) {
  if (decision === "Avançaria") return "advance";
  if (decision === "Abandonaria") return "drop";
  return "hesitate";
}

function ReportView({
  report,
  reports,
  initialBaselineId,
  onNew,
  onReevaluate,
  notify,
}: {
  report: Report;
  reports: Report[];
  initialBaselineId?: string;
  onNew: () => void;
  onReevaluate: (revisedCopy: string, baselineReport: Report) => void;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState<"overview" | "personas" | "copy">("overview");
  const [activePersona, setActivePersona] = useState(report.personas[0]?.id);
  const [copyStyle, setCopyStyle] = useState<"short" | "full">("short");
  const [copyMode, setCopyMode] = useState<"side" | "diff" | "edit">("side");
  const [customRewrites, setCustomRewrites] = useState<{ short: string; full: string }>(() => ({
    short: report.rewrites.short,
    full: report.rewrites.full,
  }));
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [slotValue, setSlotValue] = useState("");
  const [showMarks, setShowMarks] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [compareId, setCompareId] = useState<string>(initialBaselineId || report.baselineId || "");
  const candidates = reports.filter((r) => r.id !== report.id);
  const baseline = candidates.find((r) => r.id === compareId);
  const scoreDelta = baseline ? report.score - baseline.score : null;
  const persona = report.personas.find((p) => p.id === activePersona) || report.personas[0];
  const verdict = report.verdicts.find((v) => v.personaId === persona?.id);
  const isExample = report.meta.engine === "example";
  const currentCopy = customRewrites[copyStyle];
  const segments = parsePlaceholders(currentCopy);
  const remainingSlots = segments.filter((s) => s.type === "slot");
  const wordDiff = diffWords(report.source, currentCopy);
  const annotatedCount = annotateSource(report.source, report.objections).filter(
    (s) => s.objectionIndex !== undefined,
  ).length;
  const updateCurrentCopy = (next: string) =>
    setCustomRewrites((old) => ({ ...old, [copyStyle]: next }));
  const applySlot = (slotIndex: number) => {
    if (!slotValue.trim()) return;
    updateCurrentCopy(fillPlaceholder(currentCopy, slotIndex, slotValue));
    setActiveSlot(null);
    setSlotValue("");
    notify("Lacuna preenchida na sugestão de copy.");
  };
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Copiado para a área de transferência.");
    } catch {
      notify("Seu navegador bloqueou a cópia. Selecione e copie o texto manualmente.");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([reportMarkdown({ ...report, rewrites: customRewrites })], {
        type: "text/markdown;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.id.toLowerCase()}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportOpen(false);
  };
  const jumpToObjection = (index: number) => {
    setExpanded(index);
    if (tab !== "overview") setTab("overview");
    setTimeout(() => {
      document.getElementById(`objection-item-${index}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 40);
  };
  return (
    <>
      <div className="report-page-heading">
        <div>
          <div className="eyebrow">
            RELATÓRIO / {report.id.slice(-6)}
            {report.iteration && report.iteration > 1 ? ` · REVISÃO #${report.iteration}` : ""}
          </div>
          <h1>Uma oferta. Novas perguntas.</h1>
          <p>
            <Icon name={report.sourceType === "url" ? "globe" : "text"} size={14} />
            {report.target}
          </p>
        </div>
        <div className="report-heading-actions">
          {candidates.length > 0 && (
            <label className="compare-picker">
              <span>Comparar com</span>
              <div className="select-field">
                <select value={compareId} onChange={(e) => setCompareId(e.target.value)}>
                  <option value="">Sem comparação</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.target.slice(0, 32)} ({c.score}/100)
                    </option>
                  ))}
                </select>
                <Icon name="down" size={13} />
              </div>
            </label>
          )}
          <button className="secondary-button" onClick={onNew}>
            <Icon name="plus" size={15} /> Nova análise
          </button>
        </div>
      </div>
      <div className={`report-demo-note ${isExample ? "is-example" : ""}`}>
        <span>{isExample ? "EXEMPLO ILUSTRATIVO" : engineLabel(report).toUpperCase()}</span>
        <p>
          {isExample
            ? "Relatório pronto, gerado por regras locais para mostrar o formato. Você pode preencher as lacunas da copy e testar a reavaliação."
            : "Personas sintéticas, geradas por IA a partir do seu texto. Os índices orientam a revisão e não são taxas de conversão."}
          {report.meta.truncated &&
            ` Analisamos os primeiros ${(MAX_SOURCE_CHARS / 1000).toFixed(0)} mil caracteres da página.`}
        </p>
      </div>
      <div className="report-toolbar">
        <div
          className="report-tabs"
          role="tablist"
          aria-label="Seções do relatório"
          onKeyDown={navigateTabs}
        >
          {(
            [
              ["overview", "Visão geral"],
              ["personas", "O que a banca disse"],
              ["copy", "Revisão da copy"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              tabIndex={tab === key ? 0 : -1}
              className={tab === key ? "active" : ""}
              onClick={() => setTab(key)}
            >
              {label}
              {key === "personas" && <span>{report.personas.length}</span>}
              {key === "copy" && remainingSlots.length > 0 && (
                <span title="Lacunas para preencher">{remainingSlots.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="report-tools">
          <button
            className="icon-button"
            aria-label="Copiar resumo"
            onClick={() =>
              copy(
                `OLAB — ${report.target}\nÍndice indicativo: ${report.score}/100${scoreDelta !== null ? ` (${scoreDelta >= 0 ? "+" : ""}${scoreDelta} vs. anterior)` : ""}\n${report.summary}\nPrincipal objeção: ${report.objections[0].title}\n${reportDisclaimer(report)}`,
              )
            }
          >
            <Icon name="copy" size={16} />
          </button>
          <div className="export-menu">
            <button
              className="export-button"
              onClick={() => setExportOpen(!exportOpen)}
              aria-expanded={exportOpen}
            >
              <Icon name="download" size={15} /> Exportar <Icon name="down" size={12} />
            </button>
            {exportOpen && (
              <div className="dropdown-menu">
                <button
                  type="button"
                  onClick={() => {
                    void copy(customRewrites[copyStyle]);
                    notify("Copy otimizada copiada para a área de transferência!");
                    setExportOpen(false);
                  }}
                >
                  <Icon name="copy" size={13} /> Copiar copy revisada
                </button>
                <button type="button" onClick={download}>
                  <Icon name="download" size={13} /> Baixar Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(report, null, 2)], {
                      type: "application/json;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${report.id.toLowerCase()}.json`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    setExportOpen(false);
                    notify("JSON do relatório baixado.");
                  }}
                >
                  <Icon name="report" size={13} /> Baixar JSON (.json)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    window.print();
                  }}
                >
                  <Icon name="globe" size={13} /> Imprimir / salvar PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {tab === "overview" && (
        <div className="report-overview">
          <div className="report-overview-top">
            <section className="health-panel">
              <span className="eyebrow">ÍNDICE DE CLAREZA DA OFERTA</span>
              <div className="health-score-row">
                <div className="health-score">
                  {report.score}
                  <span>/ 100</span>
                </div>
                {baseline && scoreDelta !== null && (
                  <div
                    className={`score-delta ${scoreDelta > 0 ? "is-up" : scoreDelta < 0 ? "is-down" : ""}`}
                    aria-label={`Variação de ${scoreDelta} pontos em relação ao relatório anterior`}
                  >
                    <strong>{scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts</strong>
                    <small>Antes: {baseline.score}/100</small>
                  </div>
                )}
              </div>
              <div className="score-scale">
                <i style={{ width: `${report.score}%` }} />
              </div>
              <div className="health-status">
                <span className="status-square" />
                {report.score < 60
                  ? "Há objeções importantes a resolver"
                  : report.score < 85
                    ? "A oferta ainda pode ficar mais clara"
                    : "Uma base sólida para testar"}
              </div>
              <p className="health-summary">{report.summary}</p>
              <p>Um sinal para orientar a revisão. Não é uma previsão de conversão.</p>
            </section>
            <section className="map-panel">
              <div className="map-panel-header">
                <span className="eyebrow">ONDE A OFERTA PERDE FORÇA</span>
                {baseline && (
                  <span className="radar-legend">
                    <i className="current" /> Atual <i className="previous" /> Antes
                  </span>
                )}
              </div>
              <Radar report={report} baseline={baseline} />
              {baseline && (
                <ul className="dimension-deltas" aria-label="Evolução por dimensão">
                  {report.dimensions.map((d) => {
                    const prev =
                      baseline.dimensions.find((x) => x.label === d.label)?.value ?? d.value;
                    const diff = d.value - prev;
                    return (
                      <li key={d.label}>
                        <span>{d.label}</span>
                        <b>{d.value}</b>
                        <em className={diff > 0 ? "up" : diff < 0 ? "down" : ""}>
                          {diff > 0 ? `+${diff}` : diff === 0 ? "0" : diff}
                        </em>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <section className="diagnosis-panel">
              <span className="eyebrow">PRIMEIRO, RESOLVA ISTO.</span>
              <span className="diagnosis-number">01</span>
              <h2>{report.objections[0].title}.</h2>
              <p>{report.objections[0].detail}</p>
              <button onClick={() => setTab("copy")}>
                Ir para a revisão <Icon name="arrow" size={16} />
              </button>
            </section>
          </div>
          <section className="objections-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DO DIAGNÓSTICO À AÇÃO</span>
                <h2>O que está travando a decisão</h2>
              </div>
              <span>{String(report.objections.length).padStart(2, "0")} PONTOS DE ATENÇÃO</span>
            </div>
            <div className="objection-table">
              {report.objections.map((o, i) => (
                <div
                  id={`objection-item-${i}`}
                  className={`objection-item ${expanded === i ? "expanded" : ""}`}
                  key={i}
                >
                  <button
                    aria-expanded={expanded === i}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    <span className="table-number">0{i + 1}</span>
                    <strong>{o.title}</strong>
                    <span className={`severity ${o.severity === "Alta" ? "high" : ""}`}>
                      {o.severity}
                    </span>
                    <Icon name={expanded === i ? "close" : "plus"} size={17} />
                  </button>
                  {expanded === i && (
                    <div className="objection-detail">
                      {o.excerpt && (
                        <blockquote className="objection-excerpt">
                          <span>TRECHO NA PÁGINA</span>
                          <p>“{o.excerpt}”</p>
                        </blockquote>
                      )}
                      <p>{o.detail}</p>
                      <div>
                        <span>COMO REDUZIR O ATRITO</span>
                        <p>{o.fix}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          <section className="annotated-manuscript">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PÁGINA ANOTADA PELA BANCA</span>
                <h2>Onde as dúvidas aparecem no texto original</h2>
              </div>
              <span>
                {annotatedCount > 0
                  ? `${String(annotatedCount).padStart(2, "0")} TRECHOS GRIFADOS`
                  : "TEXTO DE ORIGEM"}
              </span>
            </div>
            <p className="manuscript-caption">
              Clique em um trecho grifado para abrir a objeção correspondente acima.
            </p>
            <AnnotatedText
              source={report.source}
              objections={report.objections}
              activeIndex={expanded}
              onSelect={jumpToObjection}
            />
          </section>
          <button className="next-section" onClick={() => setTab("personas")}>
            <span>
              CONTINUE A INVESTIGAÇÃO<strong>Ouça cada perspectiva da banca.</strong>
            </span>
            <Icon name="arrow" size={22} />
          </button>
        </div>
      )}
      {tab === "personas" && persona && (
        <div className="personas-tab-stack">
          <section className="roundtable-section" aria-label="Quadro da banca">
            <div className="roundtable-header">
              <div>
                <span className="eyebrow">MESA-REDONDA · CONSENSO E TENSÃO</span>
                <h2>Como a banca se posiciona diante da oferta</h2>
              </div>
              <p>
                {report.consensus ||
                  "Os perfis compartilham dúvidas sobre provas e condições, mas divergem no que consideram decisivo para avançar."}
              </p>
            </div>
            <div className="roundtable-grid">
              {report.personas.map((p) => {
                const v = report.verdicts.find((x) => x.personaId === p.id);
                const decision = v?.decision || inferDecision(p, report.score);
                const question = v?.question || personaQuestion(p);
                const active = persona.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`roundtable-card ${active ? "is-active" : ""}`}
                    onClick={() => setActivePersona(p.id)}
                    aria-pressed={active}
                  >
                    <div className="roundtable-card-top">
                      <span className="persona-symbol">
                        <Icon name={p.icon} size={18} />
                      </span>
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.role}</small>
                      </div>
                      <span className={`decision-badge ${decisionClass(decision)}`}>
                        {decision}
                      </span>
                    </div>
                    <p className="roundtable-question">“{question}”</p>
                    <span className="roundtable-Action">
                      Ver depoimento completo <Icon name="arrow" size={13} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="persona-report-layout">
            <div className="report-persona-list">
              {report.personas.map((p) => {
                const v = report.verdicts.find((x) => x.personaId === p.id);
                const decision = v?.decision || inferDecision(p, report.score);
                return (
                  <button
                    key={p.id}
                    className={persona.id === p.id ? "active" : ""}
                    onClick={() => setActivePersona(p.id)}
                  >
                    <span className="persona-symbol">
                      <Icon name={p.icon} size={21} />
                    </span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>
                        {p.role} · {decision}
                      </small>
                    </span>
                    <Icon name="chevron" size={14} />
                  </button>
                );
              })}
            </div>
            <div className="persona-testimony">
              <div className="testimony-header-row">
                <span className="eyebrow">PERSPECTIVA / {persona.role.toUpperCase()}</span>
                <span
                  className={`decision-badge ${decisionClass(
                    verdict?.decision || inferDecision(persona, report.score),
                  )}`}
                >
                  {verdict?.decision || inferDecision(persona, report.score)}
                </span>
              </div>
              <blockquote>
                “{verdict?.quote || "Esta perspectiva não foi registrada no relatório."}”
              </blockquote>
              <div className="testimony-author">
                <Icon name={persona.icon} size={19} />
                <span>
                  {persona.name}
                  <small>Persona sintética · ceticismo {persona.skepticism}/10</small>
                </span>
              </div>
              <div className="testimony-focus">
                <span>PERGUNTA DECISIVA</span>
                <p>“{verdict?.question || personaQuestion(persona)}”</p>
                <span>O QUE TRAVA ESTE PERFIL</span>
                <p>{verdict?.concern || persona.fears || persona.focus}</p>
                <span>COMO RESPONDER À OBJEÇÃO</span>
                <p>{verdict?.fix || report.objections[0].fix}</p>
              </div>
              <button className="text-button" onClick={() => setTab("copy")}>
                Revisar o texto com essa perspectiva <Icon name="arrow" size={16} />
              </button>
            </div>
          </section>
        </div>
      )}
      {tab === "copy" && (
        <section className="copy-studio">
          <div className="copy-studio-heading">
            <div>
              <h2>Menos promessa. Mais clareza.</h2>
              <p>
                Preencha as lacunas entre colchetes com dados reais, ajuste o texto e coloque a nova
                versão à prova.
              </p>
            </div>
            <label className="select-field">
              <span className="sr-only">Estilo da reescrita</span>
              <select
                value={copyStyle}
                onChange={(e) => {
                  setCopyStyle(e.target.value as "short" | "full");
                  setActiveSlot(null);
                }}
              >
                <option value="short">Direta e curta</option>
                <option value="full">Argumentativa completa</option>
              </select>
              <Icon name="down" size={14} />
            </label>
          </div>
          <div className="copy-toolbar-row">
            <div className="copy-display-controls" role="tablist" aria-label="Modo de revisão">
              <button
                type="button"
                role="tab"
                aria-selected={copyMode === "side"}
                className={copyMode === "side" ? "active" : ""}
                onClick={() => setCopyMode("side")}
              >
                Lado a lado
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={copyMode === "diff"}
                className={copyMode === "diff" ? "active" : ""}
                onClick={() => setCopyMode("diff")}
              >
                Comparar alterações
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={copyMode === "edit"}
                className={copyMode === "edit" ? "active" : ""}
                onClick={() => setCopyMode("edit")}
              >
                Editar texto
              </button>
            </div>
            <div className="copy-slot-status">
              {remainingSlots.length > 0 ? (
                <span>
                  <b>{remainingSlots.length}</b>{" "}
                  {remainingSlots.length === 1
                    ? "lacuna real para preencher"
                    : "lacunas reais para preencher"}
                </span>
              ) : (
                <span className="slots-complete">
                  <Icon name="check" size={13} /> Todas as lacunas preenchidas
                </span>
              )}
              {currentCopy !== report.rewrites[copyStyle] && (
                <button
                  type="button"
                  className="inline-link"
                  onClick={() => {
                    updateCurrentCopy(report.rewrites[copyStyle]);
                    setActiveSlot(null);
                  }}
                >
                  Restaurar sugestão original
                </button>
              )}
            </div>
          </div>
          {copyMode === "diff" ? (
            <div className="word-diff-panel">
              <div className="word-diff-header">
                <span className="eyebrow">COMPARAÇÃO PALAVRA A PALAVRA</span>
                <div className="diff-stats">
                  <span className="added">+{wordDiff.stats.added} adicionadas</span>
                  <span className="removed">−{wordDiff.stats.removed} removidas</span>
                </div>
              </div>
              <p className="word-diff-stream">
                {wordDiff.tokens.map((t, i) =>
                  t.type === "del" ? (
                    <del key={i}>{t.text}</del>
                  ) : t.type === "ins" ? (
                    <ins key={i}>{t.text}</ins>
                  ) : (
                    <span key={i}>{t.text}</span>
                  ),
                )}
              </p>
            </div>
          ) : (
            <div className="copy-documents">
              <article>
                <div>
                  <span>01 / TEXTO ORIGINAL</span>
                  {annotatedCount > 0 ? (
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => setShowMarks(!showMarks)}
                    >
                      {showMarks ? "Ocultar grifos" : "Mostrar grifos"}
                    </button>
                  ) : (
                    <Icon name="text" size={16} />
                  )}
                </div>
                {showMarks && annotatedCount > 0 ? (
                  <AnnotatedText
                    source={report.source}
                    objections={report.objections}
                    activeIndex={expanded}
                    onSelect={jumpToObjection}
                  />
                ) : (
                  <p>{report.source}</p>
                )}
              </article>
              <article className="revised-document">
                <div>
                  <span>02 / DIREÇÃO SUGERIDA</span>
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => setCopyMode(copyMode === "edit" ? "side" : "edit")}
                  >
                    {copyMode === "edit" ? "Ver lacunas destacadas" : "Editar livremente"}
                  </button>
                </div>
                {copyMode === "edit" ? (
                  <div className="copy-live-editor">
                    <label className="sr-only" htmlFor="revised-copy-editor">
                      Editar texto sugerido
                    </label>
                    <textarea
                      id="revised-copy-editor"
                      value={currentCopy}
                      onChange={(e) => updateCurrentCopy(e.target.value)}
                      rows={9}
                    />
                    <small>
                      {currentCopy.length.toLocaleString("pt-BR")} caracteres ·{" "}
                      {currentCopy.trim() ? currentCopy.trim().split(/\s+/).length : 0} palavras
                    </small>
                  </div>
                ) : (
                  <div className="interactive-copy-body">
                    <p>
                      {segments.map((seg, idx) =>
                        seg.type === "text" ? (
                          <span key={idx}>{seg.value}</span>
                        ) : (
                          <button
                            key={idx}
                            type="button"
                            className={`copy-slot ${activeSlot === seg.slotIndex ? "is-open" : ""}`}
                            onClick={() => {
                              setActiveSlot(seg.slotIndex);
                              setSlotValue("");
                            }}
                          >
                            <span>[{seg.label}]</span>
                          </button>
                        ),
                      )}
                    </p>
                    {activeSlot !== null && (
                      <form
                        className="slot-popover"
                        onSubmit={(e) => {
                          e.preventDefault();
                          applySlot(activeSlot);
                        }}
                      >
                        <label htmlFor="slot-input">
                          Preencher{" "}
                          <strong>
                            [{remainingSlots.find((s) => s.slotIndex === activeSlot)?.label}]
                          </strong>{" "}
                          com dado real:
                        </label>
                        <div className="slot-popover-row">
                          <input
                            id="slot-input"
                            value={slotValue}
                            onChange={(e) => setSlotValue(e.target.value)}
                            placeholder="Ex.: R$ 190/mês, 14 dias sem compromisso, +320 clínicas…"
                            autoFocus
                          />
                          <button
                            type="submit"
                            className="primary-button"
                            disabled={!slotValue.trim()}
                          >
                            Aplicar
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setActiveSlot(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
                <div className="revised-actions">
                  <button type="button" onClick={() => copy(currentCopy)}>
                    <Icon name="copy" size={15} /> Copiar versão atual
                  </button>
                  <button
                    type="button"
                    className="primary-button reevaluate-button"
                    onClick={() => onReevaluate(currentCopy, report)}
                  >
                    <Icon name="refresh" size={15} /> Reavaliar esta versão com a banca
                  </button>
                </div>
              </article>
            </div>
          )}
          <p className="copy-disclaimer">
            <Icon name="help" size={14} />{" "}
            {isExample
              ? "Clique em qualquer trecho entre [colchetes] para preenchê-lo com dados reais e clique em “Reavaliar esta versão com a banca” para ver o comparativo Antes → Depois."
              : "A banca foi instruída a não inventar provas. Clique nos trechos entre [colchetes] para preencher com dados reais antes de reavaliar ou publicar."}
          </p>
        </section>
      )}
    </>
  );
}

function DialogFrame({
  title,
  eyebrow,
  children,
  onClose,
  drawer = false,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
  onClose: () => void;
  drawer?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusable = () =>
      Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, textarea, a[href], [tabindex="0"]',
        ) || [],
      );
    getFocusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const elements = getFocusable(),
          first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className={`dialog-overlay ${drawer ? "drawer-overlay" : ""}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={root}
        className={drawer ? "telemetry-drawer" : "dialog"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 id="dialog-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar janela">
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function KeyDialog({
  current,
  model,
  notice,
  onSave,
  onClose,
}: {
  current: string;
  model: GeminiModel;
  notice?: string;
  onSave: (key: string, model: GeminiModel) => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState(current);
  const [selected, setSelected] = useState<GeminiModel>(model);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const controller = useRef<AbortController>(undefined);
  useEffect(() => () => controller.current?.abort(), []);
  const reset = () => {
    setError("");
    setUnverified(false);
  };
  const submit = async () => {
    const value = key.trim();
    if (!value) {
      // Se salvar vazio, usa o modo servidor compartilhado
      onSave("", selected);
      return;
    }
    if (!/^AIza[\w-]{25,}$/.test(value)) {
      setError("Confira o formato da chave fornecida pelo Google AI Studio.");
      return;
    }
    if (value === current && selected === model) return onClose();
    reset();
    setChecking(true);
    controller.current = new AbortController();
    try {
      await verifyKey(value, selected, controller.current.signal);
      onSave(value, selected);
    } catch (e) {
      if (isAbort(e)) return;
      if (e instanceof GeminiError && (e.code === "network" || e.code === "timeout")) {
        setUnverified(true);
        setError("Não foi possível verificar a chave agora. Você pode salvar mesmo assim.");
      } else if (e instanceof GeminiError && e.code === "model_unavailable") {
        setError(e.message);
      } else {
        setError("Chave recusada pelo Google. Confira se ela está ativa e copie novamente.");
      }
    } finally {
      setChecking(false);
    }
  };
  return (
    <DialogFrame title="Conexão & Chave da API" eyebrow="CONFIGURAÇÃO DA IA" onClose={onClose}>
      {notice && (
        <p className="dialog-notice" role="status">
          <Icon name="key" size={15} /> {notice}
        </p>
      )}
      <p className="dialog-description">
        O OLAB permite alternar entre a <strong>chave compartilhada do servidor</strong> (ideal para testar sem fricção)
        ou a <strong>sua própria chave Google Gemini</strong> (BYOK, com limites maiores e privacidade total).
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="field-label" htmlFor="api-key">
          Chave Pessoal (BYOK)
        </label>
        <div className="key-input">
          <Icon name="key" size={17} />
          <input
            id="api-key"
            value={key}
            type={visible ? "text" : "password"}
            onChange={(e) => {
              setKey(e.target.value);
              reset();
            }}
            placeholder="Deixe em branco para usar o modo servidor ou cole sua chave AIza…"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!error && !unverified}
            aria-describedby={error ? "key-error" : undefined}
          />
          <button
            type="button"
            aria-label={visible ? "Ocultar chave" : "Exibir chave"}
            onClick={() => setVisible(!visible)}
          >
            <Icon name={visible ? "eyeOff" : "eye"} size={17} />
          </button>
        </div>
        {error && (
          <p className={unverified ? "form-warning" : "form-error"} role="alert" id="key-error">
            {error}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <a
            className="text-button"
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
          >
            Criar chave pessoal no Google AI Studio <Icon name="arrowUp" size={14} />
          </a>
          {current && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setKey("");
                onSave("", selected);
              }}
            >
              Alternar para Chave do Servidor
            </button>
          )}
        </div>
        <fieldset className="model-field">
          <legend className="field-label">Modelo</legend>
          {GEMINI_MODELS.map((m) => (
            <label key={m.id} className={selected === m.id ? "active" : ""}>
              <input
                type="radio"
                name="model"
                value={m.id}
                checked={selected === m.id}
                onChange={() => {
                  setSelected(m.id);
                  reset();
                }}
              />
              <span>
                <strong>
                  {m.label}
                  {m.id === DEFAULT_MODEL && <em>Recomendado</em>}
                </strong>
                <small>{m.description}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <div className="security-note">
          <Icon name="lock" size={17} />
          <p>
            No modo BYOK, sua chave fica armazenada exclusivamente no seu navegador. No modo compartilhado,
            as requisições são intermediadas com segurança pelo backend do OLAB sem persistir dados pessoais.
          </p>
        </div>
        <div className="dialog-actions">
          {current ? (
            <button
              type="button"
              className="text-button danger"
              onClick={() => onSave("", selected)}
            >
              <Icon name="trash" size={15} /> Remover chave pessoal
            </button>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => onClose()}
            >
              Continuar com Chave do Servidor
            </button>
          )}
          {unverified && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => onSave(key.trim(), selected)}
            >
              Salvar mesmo assim
            </button>
          )}
          <button className="primary-button" disabled={checking} type="submit">
            {checking ? (
              <>
                <span className="spinner" /> Verificando…
              </>
            ) : key.trim() ? (
              <>
                Verificar e salvar chave <Icon name="arrow" size={16} />
              </>
            ) : (
              <>
                Salvar preferências <Icon name="check" size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}

function PersonaDialog({
  initialPersona,
  onSave,
  onClose,
}: {
  initialPersona?: Persona | null;
  onSave: (persona: Persona) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialPersona?.name || "");
  const [role, setRole] = useState(initialPersona?.role || "");
  const [fears, setFears] = useState(initialPersona?.fears || initialPersona?.focus || "");
  const [skepticism, setSkepticism] = useState(initialPersona?.skepticism || 7);
  const [style, setStyle] = useState(initialPersona?.style || "Analítico e objetivo");
  const isEditing = !!initialPersona;

  return (
    <DialogFrame
      title={isEditing ? "Editar perspectiva do perfil" : "Quem mais precisa ser ouvido?"}
      eyebrow={isEditing ? "EDITAR PERSONA" : "NOVA PERSONA"}
      onClose={onClose}
    >
      <p className="dialog-description">
        {isEditing
          ? "Atualize os critérios de julgamento e preocupações centrais deste perfil."
          : "Traga para a banca uma perspectiva específica do seu mercado."}
      </p>
      <form
        className="persona-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim() && role.trim())
            onSave({
              id: initialPersona?.id || `custom-${Date.now()}`,
              name: name.trim(),
              role: role.trim(),
              focus: fears.trim() || role.trim(),
              fears: fears.trim(),
              skepticism,
              style,
              icon: initialPersona?.icon || "people",
            });
        }}
      >
        <div className="two-fields">
          <label>
            Nome do perfil
            <input
              required
              maxLength={45}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Médico tradicionalista"
            />
          </label>
          <label>
            Cargo ou contexto
            <input
              required
              maxLength={70}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex.: Diretor de uma clínica"
            />
          </label>
        </div>
        <label>
          O que impede essa pessoa de comprar?
          <textarea
            value={fears}
            onChange={(e) => setFears(e.target.value)}
            placeholder="Medos, experiências ruins, exigências…"
            maxLength={500}
          />
        </label>
        <label>
          Estilo de julgamento
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option>Analítico e objetivo</option>
            <option>Apressado e cético</option>
            <option>Conservador e cauteloso</option>
            <option>Impulsivo por valor</option>
          </select>
        </label>
        <label className="range-label">
          <span>
            Nível de ceticismo <b>{skepticism}/10</b>
          </span>
          <input
            aria-label="Nível de ceticismo"
            type="range"
            min="1"
            max="10"
            value={skepticism}
            onChange={(e) => setSkepticism(Number(e.target.value))}
          />
          <small>
            <span>Aberto a conhecer</span>
            <span>Difícil de convencer</span>
          </small>
        </label>
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit" disabled={!name.trim() || !role.trim()}>
            {isEditing ? "Salvar alterações" : "Adicionar persona"}{" "}
            <Icon name={isEditing ? "check" : "plus"} size={16} />
          </button>
        </div>
      </form>
    </DialogFrame>
  );
}

function TelemetryDialog({
  report,
  hasKey,
  model,
  onClose,
  notify,
}: {
  report?: Report;
  hasKey: boolean;
  model: GeminiModel;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState<"session" | "markdown" | "json">("session");
  const markdown = report ? reportMarkdown(report) : "# Nenhum relatório aberto.";
  const json = JSON.stringify(report || { status: "aguardando" }, null, 2);
  const meta = report?.meta;
  const seconds = (ms?: number) => (ms === undefined ? "—" : `${(ms / 1000).toFixed(1)} s`);
  const tokens = (n?: number) => (n === undefined ? "—" : n.toLocaleString("pt-BR"));
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab === "markdown" ? markdown : json);
      notify("Conteúdo copiado.");
    } catch {
      notify("O navegador bloqueou o acesso à área de transferência.");
    }
  };
  return (
    <DialogFrame title="Por dentro da análise." eyebrow="INSPEÇÃO TÉCNICA" onClose={onClose} drawer>
      <div
        className="telemetry-tabs"
        role="tablist"
        aria-label="Dados técnicos"
        onKeyDown={navigateTabs}
      >
        {(
          [
            ["session", "Sessão"],
            ["markdown", "Markdown"],
            ["json", "JSON"],
          ] as const
        ).map(([key, label]) => (
          <button
            role="tab"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            key={key}
            className={tab === key ? "active" : ""}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="telemetry-content">
        {tab === "session" ? (
          <>
            <div className="telemetry-notice">
              <Icon name="code" size={21} />
              <h3>
                {!meta
                  ? "Nenhum relatório aberto."
                  : meta.engine === "gemini"
                    ? `Análise gerada por ${meta.model}.`
                    : "Exemplo ilustrativo, sem chamadas de IA."}
              </h3>
              <p>
                {!meta
                  ? "Abra ou gere um relatório para ver os dados da execução."
                  : meta.engine === "gemini"
                    ? "A resposta do Gemini chegou em JSON estruturado e foi validada antes de virar relatório. Nenhum dado passou por servidores do OLAB."
                    : "Gerado por regras locais no navegador para mostrar o formato do relatório. Nenhum token foi consumido."}
              </p>
            </div>
            <dl className="session-data">
              <div>
                <dt>Motor</dt>
                <dd>{report ? engineLabel(report) : "—"}</dd>
              </div>
              <div>
                <dt>Tempo total</dt>
                <dd>{report ? `${report.elapsed.toFixed(1)} s` : "—"}</dd>
              </div>
              <div>
                <dt>Leitura da página</dt>
                <dd>
                  {meta?.readerMs !== undefined ? `${seconds(meta.readerMs)} · Jina Reader` : "—"}
                </dd>
              </div>
              <div>
                <dt>Resposta do modelo</dt>
                <dd>{seconds(meta?.analysisMs)}</dd>
              </div>
              <div>
                <dt>Tokens de entrada</dt>
                <dd>{tokens(meta?.promptTokens)}</dd>
              </div>
              <div>
                <dt>Tokens de saída</dt>
                <dd>{tokens(meta?.outputTokens)}</dd>
              </div>
              <div>
                <dt>Caracteres analisados</dt>
                <dd>
                  {meta ? meta.sourceChars.toLocaleString("pt-BR") : "—"}
                  {meta?.truncated && " · cortado"}
                </dd>
              </div>
              <div>
                <dt>Personas avaliadas</dt>
                <dd>{report?.personas.length || "—"}</dd>
              </div>
              <div>
                <dt>Chave local</dt>
                <dd>{hasKey ? `Configurada · ${modelLabel(model)}` : "Não configurada"}</dd>
              </div>
              <div>
                <dt>Runtime</dt>
                <dd>React 19 / TypeScript / Vite</dd>
              </div>
            </dl>
            <p className="session-note">
              Os relatórios ficam salvos neste navegador, até {30} no histórico.
            </p>
          </>
        ) : (
          <div className="technical-document">
            <div>
              <span>{tab === "markdown" ? "relatorio.md" : "resultado.json"}</span>
              <button onClick={copy}>
                <Icon name="copy" size={14} /> Copiar
              </button>
            </div>
            <pre>{tab === "markdown" ? markdown : json}</pre>
          </div>
        )}
      </div>
    </DialogFrame>
  );
}

function ReportsPage({
  reports,
  onOpen,
  onCompare,
  onNew,
  onDelete,
  onClear,
  onExportBackup,
  onImportBackup,
}: {
  reports: Report[];
  onOpen: (report: Report) => void;
  onCompare: (current: Report, baseline: Report) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onExportBackup: () => void;
  onImportBackup: (imported: Report[]) => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [compareMode, setCompareMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = reports.filter((r) => {
    const matchesSegment = segmentFilter === "all" || r.segment === segmentFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q || r.target.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q);
    return matchesSegment && matchesQuery;
  });
  const togglePick = (id: string) => {
    setPicked((old) =>
      old.includes(id)
        ? old.filter((x) => x !== id)
        : old.length >= 2
          ? [old[1], id]
          : [...old, id],
    );
  };
  const launchCompare = () => {
    if (picked.length !== 2) return;
    const first = reports.find((r) => r.id === picked[0]);
    const second = reports.find((r) => r.id === picked[1]);
    if (!first || !second) return;
    const [newer, older] =
      new Date(first.createdAt).getTime() >= new Date(second.createdAt).getTime()
        ? [first, second]
        : [second, first];
    onCompare(newer, older);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportBackup(parsed);
        }
      } catch {}
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  return (
    <>
      <div className="simple-page-heading">
        <span className="eyebrow">SEU CADERNO DE PESQUISA</span>
        <h1>Seus relatórios.</h1>
        <p>Suas investigações ficam salvas neste navegador. Busque, filtre ou compare evoluções.</p>
      </div>
      {reports.length ? (
        <>
          <div className="reports-controls">
            <div className="reports-search">
              <label className="sr-only" htmlFor="reports-search-input">
                Buscar relatórios
              </label>
              <input
                id="reports-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por página, título ou resumo…"
              />
            </div>
            <div className="select-field reports-segment-filter">
              <label className="sr-only" htmlFor="reports-segment-select">
                Filtrar por segmento
              </label>
              <select
                id="reports-segment-select"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <option value="all">Todos os segmentos</option>
                {SEGMENTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Icon name="down" size={13} />
            </div>
            {reports.length >= 2 && (
              <button
                type="button"
                className={`secondary-button ${compareMode ? "is-active" : ""}`}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setPicked([]);
                }}
              >
                {compareMode ? "Sair da comparação" : "Comparar dois relatórios"}
              </button>
            )}
            {compareMode && (
              <button
                type="button"
                className="primary-button"
                disabled={picked.length !== 2}
                onClick={launchCompare}
              >
                Abrir comparação ({picked.length}/2) <Icon name="arrow" size={15} />
              </button>
            )}
            <button
              type="button"
              className="secondary-button"
              onClick={onExportBackup}
              title="Baixar todos os relatórios em JSON"
            >
              <Icon name="download" size={13} /> Exportar backup
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => fileInputRef.current?.click()}
              title="Importar relatórios de arquivo JSON"
            >
              <Icon name="arrowUp" size={13} /> Importar backup
            </button>
          </div>
          {filtered.length ? (
            <div className="reports-table">
              <div className="reports-table-label">
                <span>PÁGINA / OFERTA</span>
                <span>PERSONAS</span>
                <span>ÍNDICE</span>
                <span />
              </div>
              {filtered.map((report) => {
                const prev = report.baselineId
                  ? reports.find((r) => r.id === report.baselineId)
                  : undefined;
                const delta = prev ? report.score - prev.score : null;
                const isPicked = picked.includes(report.id);
                return (
                  <div className={`report-row ${isPicked ? "is-picked" : ""}`} key={report.id}>
                    {compareMode && (
                      <button
                        type="button"
                        className={`row-pick ${isPicked ? "checked" : ""}`}
                        aria-pressed={isPicked}
                        aria-label={`Selecionar ${report.target} para comparação`}
                        onClick={() => togglePick(report.id)}
                      >
                        {isPicked && <Icon name="check" size={12} />}
                      </button>
                    )}
                    <button
                      className="report-row-open"
                      onClick={() => (compareMode ? togglePick(report.id) : onOpen(report))}
                    >
                      <span>
                        <strong>{report.target}</strong>
                        <small>
                          <time dateTime={report.createdAt}>{relativeDate(report.createdAt)}</time>
                          <span
                            className={`engine-tag ${report.meta.engine === "example" ? "is-example" : ""}`}
                          >
                            {engineLabel(report)}
                          </span>
                          {delta !== null && (
                            <span className={`delta-tag ${delta >= 0 ? "up" : "down"}`}>
                              {delta >= 0 ? `+${delta}` : delta} pts
                            </span>
                          )}
                        </small>
                      </span>
                      <span>{report.personas.length} perfis</span>
                      <span className="table-score">
                        {report.score}
                        <small>/100</small>
                      </span>
                      <Icon name="arrow" size={18} />
                    </button>
                    {confirming === report.id ? (
                      <div className="row-confirm" role="group" aria-label="Confirmar exclusão">
                        <span>Excluir?</span>
                        <button
                          className="danger"
                          onClick={() => {
                            setConfirming(null);
                            onDelete(report.id);
                          }}
                        >
                          Sim
                        </button>
                        <button onClick={() => setConfirming(null)} autoFocus>
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        className="icon-button row-delete"
                        aria-label={`Excluir relatório ${report.target}`}
                        onClick={() => setConfirming(report.id)}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
              <div className="reports-table-footer">
                <span>
                  {reports.length} de 30 relatórios guardados. Os mais antigos saem primeiro.
                </span>
                <button className="text-button danger" onClick={onClear}>
                  <Icon name="trash" size={14} /> Limpar histórico
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-reports">
              <Icon name="report" size={30} />
              <h2>Nenhum relatório corresponde ao filtro.</h2>
              <p>Limpe a busca ou troque o segmento para ver todas as análises salvas.</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setQuery("");
                  setSegmentFilter("all");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-reports">
          <Icon name="report" size={34} />
          <h2>Uma boa investigação começa com uma pergunta.</h2>
          <p>Faça sua primeira análise. Os relatórios gerados ficam guardados neste navegador.</p>
          <button className="primary-button" onClick={onNew}>
            Começar uma análise <Icon name="arrow" size={17} />
          </button>
        </div>
      )}
    </>
  );
}

function PersonasPage({
  personas,
  selected,
  onToggle,
  onCustom,
  onEdit,
  onDelete,
  onResetDefault,
}: {
  personas: Persona[];
  selected: string[];
  onToggle: (id: string) => void;
  onCustom: () => void;
  onEdit: (persona: Persona) => void;
  onDelete: (id: string) => void;
  onResetDefault: () => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const hasCustom = personas.some((p) => p.id.startsWith("custom-"));

  return (
    <>
      <div className="simple-page-heading">
        <span className="eyebrow">DIFERENTES OLHARES, MELHORES PERGUNTAS</span>
        <h1>Conheça a sua banca.</h1>
        <p>Ninguém compra pelo mesmo motivo. Escolha quem deve questionar sua próxima oferta.</p>
      </div>
      <div className="library-toolbar">
        <span>{selected.length} de 5 perfis na próxima análise</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {hasCustom && (
            <button
              type="button"
              className="secondary-button"
              onClick={onResetDefault}
              title="Restaura os perfis originais do OLAB"
            >
              Restaurar banca padrão
            </button>
          )}
          <button className="primary-button" onClick={onCustom}>
            Criar persona <Icon name="plus" size={17} />
          </button>
        </div>
      </div>
      <div className="persona-library">
        {personas.map((p, i) => (
          <article key={p.id}>
            <div className="library-card-top">
              <span className="persona-symbol">
                <Icon name={p.icon} size={25} />
              </span>
              <span>
                {p.id.startsWith("custom-") ? "PERSONALIZADO" : "PERFIL"}{" "}
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <h2>{p.name}</h2>
            <span className="persona-role">{p.role}</span>
            <p>{p.fears || p.focus}</p>
            <div className="skepticism-line">
              <span>Ceticismo</span>
              <div>
                {Array.from({ length: 10 }, (_, i) => (
                  <i className={i < p.skepticism ? "filled" : ""} key={i} />
                ))}
              </div>
              <b>{p.skepticism}/10</b>
            </div>
            <button
              className={selected.includes(p.id) ? "library-selected" : ""}
              onClick={() => onToggle(p.id)}
            >
              <Icon name={selected.includes(p.id) ? "check" : "plus"} size={15} />
              {selected.includes(p.id) ? "Na sua banca" : "Adicionar à banca"}
            </button>
            {p.id.startsWith("custom-") && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px" }}>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onEdit(p)}
                >
                  <Icon name="pencil" size={14} /> Editar
                </button>
                {confirming === p.id ? (
                  <div className="row-confirm" role="group" aria-label="Confirmar exclusão">
                    <span>Excluir?</span>
                    <button
                      className="danger"
                      onClick={() => {
                        setConfirming(null);
                        onDelete(p.id);
                      }}
                    >
                      Sim
                    </button>
                    <button onClick={() => setConfirming(null)} autoFocus>
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    className="text-button danger persona-delete"
                    onClick={() => setConfirming(p.id)}
                  >
                    <Icon name="trash" size={14} /> Excluir
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function GuidePage({ onNew }: { onNew: () => void }) {
  return (
    <div className="guide-page">
      <div className="simple-page-heading">
        <span className="eyebrow">NOTAS DE CAMPO / 001</span>
        <h1>
          Teste a hipótese.
          <br />
          Não a sua intuição.
        </h1>
        <p>Um roteiro simples para tirar mais valor de cada análise.</p>
      </div>
      {[
        [
          "Traga a oferta inteira.",
          "Um título isolado diz pouco. Inclua o benefício, os argumentos, o preço, as condições e o botão de ação. Quanto melhor o contexto, melhores as perguntas.",
        ],
        [
          "Escolha quem realmente decide.",
          "Forme uma banca que represente seu processo de compra. Um software B2B costuma envolver tecnologia, finanças e operação. Uma loja precisa ouvir consumidores e questionar o risco da compra.",
        ],
        [
          "Transforme objeções em experimentos.",
          "Não publique uma reescrita automaticamente. Use o relatório para formular hipóteses, adicionar provas reais e priorizar um teste. Nunca invente depoimentos, prazos ou garantias.",
        ],
      ].map(([title, description], i) => (
        <section key={title}>
          <span>0{i + 1}</span>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </section>
      ))}
      <div className="guide-caveat">
        <Icon name="help" size={22} />
        <div>
          <strong>Simulação não é validação de mercado.</strong>
          <p>
            Personas sintéticas ajudam a estruturar perguntas, mas não substituem entrevistas,
            testes de usabilidade ou experimentos com pessoas reais. As respostas são geradas pelo
            Google Gemini e podem conter erros. Confira cada sugestão antes de publicar.
          </p>
        </div>
      </div>
      <button className="primary-button" onClick={onNew}>
        Voltar para a bancada <Icon name="arrow" size={17} />
      </button>
    </div>
  );
}

function ClearDialog({
  count,
  onConfirm,
  onClose,
}: {
  count: number;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <DialogFrame title="Limpar o histórico?" eyebrow="RELATÓRIOS" onClose={onClose}>
      <p className="dialog-description">
        {count === 1 ? "O relatório salvo" : `Os ${count} relatórios salvos`} neste navegador serão
        excluídos. Exporte antes o que quiser guardar. Esta ação não pode ser desfeita.
      </p>
      <div className="dialog-actions">
        <button type="button" className="secondary-button" onClick={onClose}>
          Cancelar
        </button>
        <button type="button" className="primary-button danger-button" onClick={onConfirm}>
          <Icon name="trash" size={15} /> Excluir relatórios
        </button>
      </div>
    </DialogFrame>
  );
}

const initialPersonas = () => [...PERSONAS, ...load(KEYS.personas, parsePersonas, [])];

function initialDraft(personas: Persona[]): Draft {
  const saved = load(KEYS.draft, parseDraft, null);
  if (!saved) return { ...EMPTY_DRAFT, selected: [...EMPTY_DRAFT.selected] };
  return { ...saved, selected: saved.selected.filter((id) => personas.some((p) => p.id === id)) };
}

function initialModel(): GeminiModel {
  const saved = loadText(KEYS.model);
  return GEMINI_MODELS.some((m) => m.id === saved) ? (saved as GeminiModel) : DEFAULT_MODEL;
}

export default function App() {
  const session = useSession();
  const [guestQuota, setGuestQuota] = useState<GuestQuota>(() => getGuestUsage());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [trialGateOpen, setTrialGateOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [view, setView] = useState<View>("studio");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [keyNotice, setKeyNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(personas));
  const [reports, setReports] = useState<Report[]>(() => load(KEYS.reports, parseReports, []));
  const [sessionExamples, setSessionExamples] = useState<Report[]>([]);
  const [activeReport, setActiveReport] = useState<Report>();
  const [compareBaselineId, setCompareBaselineId] = useState<string>();
  const [pendingBaseline, setPendingBaseline] = useState<{ id: string; iteration: number }>();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("analyzing");
  const [runError, setRunError] = useState<RunError | null>(null);
  const [toast, setToast] = useState("");
  const [apiKey, setApiKey] = useState(() => loadText(KEYS.apiKey) || "");
  const [model, setModel] = useState<GeminiModel>(initialModel);
  const [themePref, setThemePref] = useState<ThemePref>(() => {
    const saved = loadText(KEYS.theme);
    return isThemePref(saved) ? saved : "system";
  });
  const [prefersDark, setPrefersDark] = useState(systemPrefersDark);
  const runController = useRef<AbortController>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const storageWarned = useRef(false);
  const syncedUserRef = useRef<string | null>(null);

  const openAuth = (mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Sincronização automática na nuvem ao logar
  useEffect(() => {
    const user = session?.data?.user;
    if (!user || syncedUserRef.current === user.id) return;
    syncedUserRef.current = user.id;

    fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reports,
        personas: personas.filter((p) => p.id.startsWith("custom-")),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.allReports && Array.isArray(data.allReports) && data.allReports.length > 0) {
          setReports((current) => {
            const map = new Map<string, Report>();
            for (const r of [...data.allReports, ...current]) {
              map.set(r.id, r);
            }
            return Array.from(map.values());
          });
        }
        if (data.allPersonas && Array.isArray(data.allPersonas) && data.allPersonas.length > 0) {
          setPersonas((current) => {
            const map = new Map<string, Persona>();
            for (const p of [...current, ...data.allPersonas]) {
              map.set(p.id, p);
            }
            return Array.from(map.values());
          });
        }
        notify(`Bem-vindo, ${user.name}! Workspace sincronizado.`);
      })
      .catch((err) => console.error("[Sync] Erro na sincronização inicial:", err));
  }, [session?.data?.user]);
  const notify = (message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(""), 3600);
  };
  const persist = (key: string, value: unknown) => {
    if (save(key, value) || storageWarned.current) return;
    storageWarned.current = true;
    notify("Não foi possível salvar no navegador. Os dados seguem disponíveis até fechar a aba.");
  };
  const closeDialog = () => {
    setDialog(null);
    setKeyNotice("");
  };
  useEffect(
    () => () => {
      runController.current?.abort();
      clearTimeout(toastTimer.current);
    },
    [],
  );
  // Persistence
  useEffect(() => persist(KEYS.reports, serializeReports(reports)), [reports]);
  useEffect(
    () =>
      persist(
        KEYS.personas,
        personas.filter((p) => p.id.startsWith("custom-")),
      ),
    [personas],
  );
  useEffect(() => {
    const timer = setTimeout(() => persist(KEYS.draft, draft), 400);
    return () => clearTimeout(timer);
  }, [draft]);
  // Theme
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setPrefersDark(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => applyTheme(resolveTheme(themePref, prefersDark)), [themePref, prefersDark]);
  const changeTheme = (pref: ThemePref) => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    setTimeout(() => root.classList.remove("theme-switching"), 220);
    setThemePref(pref);
    saveText(KEYS.theme, pref);
  };
  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNav(false);
      if (
        e.key.toLowerCase() === "t" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName) &&
        !(e.target as HTMLElement).isContentEditable
      )
        setDialog((d) => (d === "telemetry" ? null : d ? d : "telemetry"));
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const navigate = (next: View) => {
    if (running) {
      notify("Conclua ou cancele a análise em andamento.");
      setMobileNav(false);
      return;
    }
    setView(next);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const openReport = (report: Report, baselineId?: string) => {
    setActiveReport(report);
    setCompareBaselineId(baselineId ?? report.baselineId);
    setView("report");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const openKey = (notice = "") => {
    setKeyNotice(notice);
    setDialog("key");
  };
  const run = async (
    overrideDraft?: Draft,
    lineage?: { baselineId: string; iteration: number },
  ) => {
    const snapshot = overrideDraft || draft;
    const effectiveLineage =
      lineage ||
      (pendingBaseline
        ? { baselineId: pendingBaseline.id, iteration: pendingBaseline.iteration }
        : undefined);
    if (running || validateDraft(snapshot)) return;

    // Trial Gate check for unauthenticated visitors
    if (!session?.data?.user && guestQuota.isLocked) {
      setTrialGateOpen(true);
      return;
    }

    const controller = new AbortController();
    runController.current = controller;
    const panel = personas.filter((p) => snapshot.selected.includes(p.id));
    const started = performance.now();
    setRunError(null);
    setRunning(true);
    try {
      let sourceText = snapshot.text;
      let sourceTitle: string | undefined;
      let readerMs: number | undefined;
      if (snapshot.mode === "url") {
        setPhase("reading");
        const page = await readPage(snapshot.url, controller.signal);
        sourceText = page.text;
        sourceTitle = page.title;
        readerMs = page.ms;
      }
      setPhase("analyzing");
      const result = await analyze({
        draft: snapshot,
        sourceText,
        sourceTitle,
        personas: panel,
        apiKey,
        model,
        signal: controller.signal,
        baselineId: effectiveLineage?.baselineId,
        iteration: effectiveLineage?.iteration,
      });
      setPhase("finishing");
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (controller.signal.aborted) return;
      const report: Report = {
        ...result,
        elapsed: (performance.now() - started) / 1000,
        meta: { ...result.meta, readerMs },
      };
      setPendingBaseline(undefined);
      setReports((old) => [report, ...old]);
      setRunning(false);
      openReport(report, report.baselineId);

      // Quota tracking & cloud sync
      if (!session?.data?.user) {
        const nextQuota = incrementGuestUsage();
        setGuestQuota(nextQuota);
      } else {
        fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reports: [report] }),
        }).catch((err) => console.error("[Sync] Erro ao sincronizar:", err));
      }
    } catch (error) {
      if (controller.signal.aborted || isAbort(error)) return;
      setRunning(false);
      if (error instanceof ReaderError)
        setRunError({
          message: error.message,
          action: error.code === "blocked" || error.code === "rate_limited" ? "text" : "retry",
        });
      else if (error instanceof GeminiError)
        setRunError({
          message: error.message,
          action:
            error.code === "invalid_key" ||
            error.code === "model_unavailable" ||
            error.code === "quota"
              ? "key"
              : error.code === "blocked"
                ? undefined
                : "retry",
        });
      else setRunError({ message: "Algo inesperado aconteceu. Tente novamente.", action: "retry" });
    }
  };
  const reevaluate = (revisedCopy: string, baselineReport: Report) => {
    const nextDraft: Draft = {
      mode: "text",
      url: "",
      text: revisedCopy,
      segment: baselineReport.segment,
      selected: baselineReport.personas.map((p) => p.id),
    };
    const nextIteration = (baselineReport.iteration || 1) + 1;
    setDraft(nextDraft);
    setRunError(null);
    // If the user is exploring an illustrative example and hasn't configured an API key yet,
    // run the local heuristic re-evaluation immediately so the Before -> After flow is testable.
    if (baselineReport.meta.engine === "example" && !apiKey) {
      const nextExample: Report = {
        ...makeExampleReport(nextDraft, personas, 0.3),
        baselineId: baselineReport.id,
        iteration: nextIteration,
      };
      setSessionExamples((old) => [nextExample, ...old]);
      openReport(nextExample, baselineReport.id);
      notify(`Revisão #${nextIteration} comparada com a versão anterior.`);
      return;
    }
    setPendingBaseline({ id: baselineReport.id, iteration: nextIteration });
    setView("studio");
    window.scrollTo({ top: 0, behavior: "instant" });
    void run(nextDraft, { baselineId: baselineReport.id, iteration: nextIteration });
  };
  const cancel = () => {
    runController.current?.abort();
    setRunning(false);
    notify("Análise cancelada.");
  };
  const errorAction = (action: NonNullable<RunError["action"]>) => {
    setRunError(null);
    if (action === "key") openKey();
    else if (action === "text") {
      setDraft((d) => ({ ...d, mode: "text" }));
      setTimeout(() => document.getElementById("page-text")?.focus(), 0);
    } else void run();
  };
  const preset = (p: Preset) => {
    const next: Draft = {
      mode: "text",
      url: "",
      text: p.text,
      segment: p.segment,
      selected: p.selected,
    };
    setDraft(next);
    setRunError(null);
    setPendingBaseline(undefined);
    const example = makeExampleReport(next, personas);
    setSessionExamples((old) => [example, ...old]);
    openReport(example);
  };
  const togglePersona = (id: string) => {
    if (!draft.selected.includes(id) && draft.selected.length >= 5) {
      notify("A banca já tem 5 perfis. Remova um para incluir outro.");
      return;
    }
    setDraft((d) => ({
      ...d,
      selected: d.selected.includes(id) ? d.selected.filter((x) => x !== id) : [...d.selected, id],
    }));
  };
  const deletePersona = (id: string) => {
    setPersonas((old) => old.filter((p) => p.id !== id));
    setDraft((d) => ({ ...d, selected: d.selected.filter((x) => x !== id) }));
    notify("Perfil excluído da biblioteca.");
  };
  const deleteReport = (id: string) => {
    setReports((old) => old.filter((r) => r.id !== id));
    if (activeReport?.id === id) setActiveReport(undefined);
    notify("Relatório excluído.");
  };
  const saveKey = (key: string, nextModel: GeminiModel) => {
    const ok = saveText(KEYS.apiKey, key || null);
    saveText(KEYS.model, nextModel);
    if (!ok) {
      notify("O navegador não permitiu salvar a chave. Nenhuma alteração foi feita.");
      return;
    }
    setApiKey(key);
    setModel(nextModel);
    setRunError(null);
    closeDialog();
    notify(
      key
        ? `Chave salva neste navegador. Modelo: ${modelLabel(nextModel)}.`
        : "Chave removida deste navegador.",
    );
  };
  const resetDefaultPersonas = () => {
    setPersonas(PERSONAS);
    persist(KEYS.personas, []);
    notify("Banca de personas restaurada para os padrões originais.");
  };

  const exportBackup = () => {
    const data = JSON.stringify(reports, null, 2);
    const blob = new Blob([data], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `olab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Backup dos relatórios exportado em JSON.");
  };

  const importBackup = (imported: Report[]) => {
    if (!Array.isArray(imported) || imported.length === 0) {
      notify("Arquivo de backup inválido ou vazio.");
      return;
    }
    setReports((old) => {
      const existingIds = new Set(old.map((r) => r.id));
      const newItems = imported.filter((r) => r.id && !existingIds.has(r.id));
      const merged = [...newItems, ...old].slice(0, 30);
      notify(`${newItems.length} novos relatórios importados com sucesso.`);
      return merged;
    });
  };

  const allKnownReports = [
    ...reports,
    ...sessionExamples.filter((e) => !reports.some((r) => r.id === e.id)),
  ];
  const labels: Record<View, string> = {
    studio: "Nova análise",
    report: "Relatório de fricção",
    reports: "Relatórios",
    personas: "Biblioteca de personas",
    guide: "Guia de análise",
  };
  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        onNavigate={navigate}
        reportCount={reports.length}
        hasKey={!!apiKey}
        model={model}
        onKey={() => openKey()}
        theme={themePref}
        onTheme={changeTheme}
        mobile={mobileNav}
        onClose={() => setMobileNav(false)}
        blocked={!!dialog || authModalOpen || trialGateOpen || accountModalOpen}
        session={session?.data ?? null}
        quota={guestQuota}
        onOpenAuth={openAuth}
        onOpenAccount={() => setAccountModalOpen(true)}
      />
      <div className="workspace-main" inert={!!dialog || mobileNav || authModalOpen || trialGateOpen || accountModalOpen}>
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobileNav(true)}
              aria-label="Abrir navegação"
            >
              <Icon name="menu" />
            </button>
            <button
              type="button"
              className="crumb-button"
              onClick={() => navigate("studio")}
            >
              Workspace
            </button>
            <Icon name="chevron" size={12} />
            <strong>{labels[view]}</strong>
          </div>
          <div className="topbar-actions">
            {!session?.data?.user ? (
              <button
                type="button"
                onClick={() => openAuth("login")}
                className="primary-button"
                style={{ padding: "5px 12px", fontSize: "11px", height: "auto" }}
              >
                <Icon name="user" size={13} />
                <span>Entrar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAccountModalOpen(true)}
                className="icon-button"
                title="Minha Conta"
              >
                <Icon name="userCheck" size={16} />
              </button>
            )}
            <button
              className={`demo-status ${apiKey ? "is-connected" : "is-server"}`}
              onClick={() => openKey()}
              aria-label={
                apiKey
                  ? `Gemini ${modelLabel(model)} conectado (BYOK). Gerenciar chave`
                  : "Modo servidor ativo. Clique para configurar chave própria"
              }
            >
              <i /> {apiKey ? `BYOK · ${modelLabel(model)}` : "Modo Servidor Ativo"}
            </button>
            <span className="topbar-divider" />
            <button
              className="telemetry-trigger"
              onClick={() => setDialog("telemetry")}
              aria-label="Abrir inspeção técnica"
            >
              <Icon name="activity" size={17} />
              <span>Inspeção técnica</span>
              <kbd>T</kbd>
            </button>
            <button
              className="icon-button help-button"
              onClick={() => navigate("guide")}
              aria-label="Abrir guia de análise"
            >
              <Icon name="help" size={19} />
            </button>
          </div>
        </header>
        <main
          className={`workspace-content ${view === "report" ? "report-content" : ""}`}
          id="main-content"
        >
          {view === "studio" && (
            <Studio
              draft={draft}
              setDraft={setDraft}
              personas={personas}
              onRun={() => void run()}
              onPreset={preset}
              onCustom={() => {
                setEditingPersona(null);
                setDialog("persona");
              }}
              running={running}
              onCancel={cancel}
              hasKey={!!apiKey}
              onKey={() => openKey()}
              phase={phase}
              runError={runError}
              onErrorAction={errorAction}
              onDismissError={() => setRunError(null)}
              session={session?.data ?? null}
              guestQuota={guestQuota}
              onOpenAuth={openAuth}
            />
          )}
          {view === "report" && activeReport && (
            <ReportView
              key={`${activeReport.id}-${compareBaselineId || ""}`}
              report={activeReport}
              reports={allKnownReports}
              initialBaselineId={compareBaselineId}
              onNew={() => navigate("studio")}
              onReevaluate={reevaluate}
              notify={notify}
            />
          )}
          {view === "reports" && (
            <ReportsPage
              reports={reports}
              onNew={() => navigate("studio")}
              onOpen={(r) => openReport(r)}
              onCompare={(current, baseline) => openReport(current, baseline.id)}
              onDelete={deleteReport}
              onClear={() => setDialog("clear")}
              onExportBackup={exportBackup}
              onImportBackup={importBackup}
            />
          )}
          {view === "personas" && (
            <PersonasPage
              personas={personas}
              selected={draft.selected}
              onToggle={togglePersona}
              onCustom={() => {
                setEditingPersona(null);
                setDialog("persona");
              }}
              onEdit={(p) => {
                setEditingPersona(p);
                setDialog("persona");
              }}
              onDelete={deletePersona}
              onResetDefault={resetDefaultPersonas}
            />
          )}
          {view === "guide" && <GuidePage onNew={() => navigate("studio")} />}
        </main>
      </div>
      {dialog === "key" && (
        <KeyDialog
          current={apiKey}
          model={model}
          notice={keyNotice}
          onSave={saveKey}
          onClose={closeDialog}
        />
      )}
      {dialog === "persona" && (
        <PersonaDialog
          initialPersona={editingPersona}
          onClose={() => {
            setEditingPersona(null);
            closeDialog();
          }}
          onSave={(persona) => {
            setPersonas((old) => {
              const exists = old.some((p) => p.id === persona.id);
              if (exists) {
                return old.map((p) => (p.id === persona.id ? persona : p));
              }
              return [...old, persona];
            });
            if (!draft.selected.includes(persona.id) && draft.selected.length < 5) {
              setDraft((old) => ({ ...old, selected: [...old.selected, persona.id] }));
            }
            setEditingPersona(null);
            closeDialog();
            notify(editingPersona ? "Perfil de persona atualizado." : "Nova perspectiva adicionada à banca.");
          }}
        />
      )}
      {dialog === "telemetry" && (
        <TelemetryDialog
          report={activeReport}
          hasKey={!!apiKey}
          model={model}
          onClose={closeDialog}
          notify={notify}
        />
      )}
      {dialog === "clear" && (
        <ClearDialog
          count={reports.length}
          onClose={closeDialog}
          onConfirm={() => {
            setReports([]);
            if (activeReport?.meta.engine === "gemini") setActiveReport(undefined);
            closeDialog();
            notify("Histórico de relatórios limpo.");
          }}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={17} />
          <span>{toast}</span>
          <button onClick={() => setToast("")} aria-label="Dispensar notificação">
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setAuthModalOpen(false);
          setTrialGateOpen(false);
        }}
      />
      <TrialGateModal
        isOpen={trialGateOpen}
        onClose={() => setTrialGateOpen(false)}
        onOpenAuth={(mode) => {
          setTrialGateOpen(false);
          setAuthModalMode(mode || "signup");
          setAuthModalOpen(true);
        }}
      />
      {session?.data?.user && (
        <AccountModal
          isOpen={accountModalOpen}
          onClose={() => setAccountModalOpen(false)}
          user={session.data.user}
          reportsCount={reports.length}
          personasCount={personas.length}
          onExportBackup={exportBackup}
        />
      )}
    </div>
  );
}

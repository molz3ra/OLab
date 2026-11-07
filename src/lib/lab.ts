export type Persona = {
  id: string;
  name: string;
  role: string;
  focus: string;
  skepticism: number;
  icon: "code" | "chart" | "bag" | "user" | "shield" | "people";
  fears?: string;
  style?: string;
};

export type Segment = "saas" | "commerce" | "course" | "service" | "app" | "other";
export type Draft = {
  mode: "url" | "text";
  url: string;
  text: string;
  segment: Segment;
  selected: string[];
};
export type Preset = {
  id: string;
  name: string;
  type: string;
  segment: Segment;
  text: string;
  selected: string[];
};
export type Decision = "Avançaria" | "Hesitaria" | "Abandonaria";
export const DECISIONS: Decision[] = ["Avançaria", "Hesitaria", "Abandonaria"];
export type Verdict = {
  personaId: string;
  quote: string;
  concern: string;
  fix: string;
  decision?: Decision;
  question?: string;
};
export type AnalysisMeta = {
  engine: "gemini" | "example";
  model?: string;
  readerMs?: number;
  analysisMs?: number;
  promptTokens?: number;
  outputTokens?: number;
  sourceChars: number;
  truncated?: boolean;
};
export type Dimension = { label: string; value: number; detail: string };
export type Objection = {
  title: string;
  detail: string;
  fix: string;
  severity: "Alta" | "Média";
  excerpt?: string;
};

export const DIMENSIONS: { label: string; detail: string }[] = [
  { label: "Clareza", detail: "A pessoa entende o que está sendo oferecido?" },
  { label: "Valor", detail: "O benefício é concreto e relevante?" },
  { label: "Confiança", detail: "Existem evidências para acreditar na promessa?" },
  { label: "Preço", detail: "O custo e as condições estão transparentes?" },
  { label: "Segurança", detail: "O risco da decisão está reduzido?" },
];
export const DIMENSION_LABELS = DIMENSIONS.map((d) => d.label);

export type Report = {
  id: string;
  target: string;
  createdAt: string;
  source: string;
  sourceType: "url" | "text";
  segment: Segment;
  personas: Persona[];
  score: number;
  summary: string;
  consensus?: string;
  baselineId?: string;
  iteration?: number;
  dimensions: Dimension[];
  objections: Objection[];
  verdicts: Verdict[];
  rewrites: { short: string; full: string };
  elapsed: number;
  meta: AnalysisMeta;
};

export function newReportId() {
  return `OL-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function normalizeUrl(raw: string) {
  const value = raw.trim();
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function inferDecision(persona: Persona, score: number): Decision {
  const threshold = score - persona.skepticism * 3;
  if (threshold >= 52) return "Avançaria";
  if (threshold >= 22) return "Hesitaria";
  return "Abandonaria";
}

export function personaQuestion(persona: Persona): string {
  const byId: Record<string, string> = {
    tech: "Qual é o esforço real de integração e segurança para o meu time?",
    finance: "Qual é o custo total e em quanto tempo esse valor se paga?",
    buyer: "O que exatamente eu recebo agora e por que escolher você?",
    operator: "Como funciona na rotina e quem me ajuda se eu travar?",
    compliance: "Quais são as garantias contratuais e como saio se não der certo?",
  };
  return (
    byId[persona.id] ||
    `Como a oferta responde a: ${(persona.fears || persona.focus).replace(/\.$/, "")}?`
  );
}

export function reportTarget(draft: Draft, title?: string) {
  if (draft.mode === "url")
    return draft.url
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
  return (title || draft.text.trim().split("\n")[0]).slice(0, 70);
}

export const PERSONAS: Persona[] = [
  {
    id: "tech",
    name: "Tech lead cético",
    role: "Tecnologia",
    focus: "Segurança, integrações e esforço técnico.",
    skepticism: 9,
    icon: "code",
  },
  {
    id: "finance",
    name: "Gestor financeiro",
    role: "Financeiro",
    focus: "Retorno, custos ocultos e risco financeiro.",
    skepticism: 9,
    icon: "chart",
  },
  {
    id: "buyer",
    name: "Comprador prático",
    role: "Consumidor",
    focus: "Benefício imediato e facilidade na compra.",
    skepticism: 6,
    icon: "bag",
  },
  {
    id: "operator",
    name: "Usuário operacional",
    role: "Operação",
    focus: "Facilidade de uso, suporte e adaptação.",
    skepticism: 7,
    icon: "user",
  },
  {
    id: "compliance",
    name: "Gestor de compras",
    role: "Compliance",
    focus: "Reputação, garantias e condições de saída.",
    skepticism: 9,
    icon: "shield",
  },
];

export const SEGMENTS: { value: Segment; label: string }[] = [
  { value: "saas", label: "SaaS e software B2B" },
  { value: "commerce", label: "E-commerce e produtos físicos" },
  { value: "course", label: "Cursos e infoprodutos" },
  { value: "service", label: "Serviços e consultoria" },
  { value: "app", label: "Aplicativos e assinaturas" },
  { value: "other", label: "Outro segmento" },
];

export const PRESETS: Preset[] = [
  {
    id: "saas",
    name: "Software financeiro",
    type: "SaaS · B2B",
    segment: "saas",
    text: "Todo o financeiro da sua empresa, em um só lugar.\n\nAutomatize contas a pagar, acompanhe o fluxo de caixa e tome decisões melhores. A Fluxo conecta sua operação financeira para você focar no crescimento.\n\nComece agora e transforme sua gestão.",
    selected: ["tech", "finance", "operator"],
  },
  {
    id: "course",
    name: "Curso de inteligência artificial",
    type: "Educação · B2C",
    segment: "course",
    text: "Sua próxima oportunidade começa com inteligência artificial.\n\nAprenda a usar as ferramentas que estão transformando o mercado. Do primeiro prompt à automação do seu trabalho, sem precisar programar.\n\nEntre para a próxima turma. Vagas limitadas.",
    selected: ["buyer", "finance", "operator"],
  },
  {
    id: "commerce",
    name: "Marca de produtos naturais",
    type: "E-commerce · DTC",
    segment: "commerce",
    text: "Menos ingredientes. Mais cuidado.\n\nConheça nossa linha de cuidados naturais para a pele. Fórmulas limpas, ingredientes de origem vegetal e uma rotina mais simples para você.\n\nEncontre o seu novo essencial. Compre agora.",
    selected: ["buyer", "operator", "compliance"],
  },
];

export const EMPTY_DRAFT: Draft = {
  mode: "url",
  url: "",
  text: "",
  segment: "saas",
  selected: ["tech", "finance", "operator"],
};

export function validateDraft(draft: Draft): string | null {
  if (draft.selected.length < 3 || draft.selected.length > 5)
    return "Selecione de 3 a 5 personas para formar a banca.";
  if (draft.mode === "text")
    return draft.text.trim().length < 40
      ? "Inclua pelo menos 40 caracteres para que a banca tenha contexto."
      : null;
  try {
    const url = new URL(normalizeUrl(draft.url));
    if (!url.hostname.includes(".") || !["http:", "https:"].includes(url.protocol))
      return "Insira uma URL válida, como suaempresa.com.";
    return null;
  } catch {
    return "Insira uma URL válida, como suaempresa.com.";
  }
}

/** Relatório ilustrativo, gerado por regras locais. Usado apenas pelos exemplos da bancada. */
export function makeExampleReport(draft: Draft, personas: Persona[], elapsed = 0.2): Report {
  const source = draft.text.trim();
  const text = source.toLowerCase();
  const hasProof = /case|clientes|depoimento|comprovad|estudo|pesquisa|\d+%/.test(text);
  const hasPrice = /r\$|preço|por mês|mensal|gratuito|grátis/.test(text);
  const hasGuarantee = /garantia|cancele|cancelamento|reembolso|sem compromisso/.test(text);
  const hasTime = /\d+\s*(dias|horas|minutos|semanas)/.test(text);
  const score = Math.min(
    92,
    42 +
      Number(hasProof) * 17 +
      Number(hasPrice) * 10 +
      Number(hasGuarantee) * 13 +
      Number(hasTime) * 8,
  );
  const segment = SEGMENTS.find((s) => s.value === draft.segment)?.label || "Sua oferta";
  const lines = source
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const sentences = source
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 12);
  const objections: Report["objections"] = [
    {
      title: hasProof
        ? "A evidência precisa de contexto"
        : "A promessa não vem acompanhada de prova",
      detail: hasProof
        ? "Há indícios de prova, mas o resultado precisa ser ligado a um perfil de cliente e a um cenário verificável."
        : "A página apresenta o benefício, mas não mostra um caso, depoimento ou dado que o sustente.",
      fix: "Adicione um caso verificável com o contexto, o resultado e a fonte. Não invente números para preencher essa lacuna.",
      severity: "Alta",
      excerpt: lines[0] || sentences[0],
    },
    {
      title: hasPrice
        ? "O custo total ainda pode gerar dúvida"
        : "O custo da decisão não está claro",
      detail: hasPrice
        ? "Explique o que está incluído e se existem condições adicionais."
        : "Sem preço ou próximo passo explícito, a pessoa precisa assumir o risco de descobrir depois.",
      fix: "Informe o preço, o que está incluído e como funciona a contratação. Se o valor depender do escopo, explique como ele é definido.",
      severity: "Alta",
      excerpt: sentences[1] || lines[1] || lines[0],
    },
    {
      title: hasGuarantee
        ? "As condições merecem mais visibilidade"
        : "Falta uma saída segura para o comprador",
      detail: hasGuarantee
        ? "A redução de risco funciona melhor quando aparece perto da ação principal."
        : "Não está evidente o que acontece se a solução não for adequada.",
      fix: "Torne visíveis as condições reais de cancelamento, devolução e suporte, próximas ao botão de ação.",
      severity: "Média",
      excerpt: lines[lines.length - 1] || sentences[sentences.length - 1],
    },
  ];
  const short = {
    saas: "Seu financeiro organizado, sem planilhas espalhadas.\n\nAcompanhe contas e fluxo de caixa em um só lugar, com [inserir prova ou número de clientes] e planos a partir de [informar preço].\n\nConhecer a plataforma · [informar condição de cancelamento]",
    commerce:
      "Uma rotina de cuidado mais simples.\n\nConheça os ingredientes, a indicação de cada fórmula ([inserir certificação ou teste dermatológico]) e o prazo de troca de [informar prazo de devolução].\n\nEncontrar meu produto",
    course:
      "Aprenda a aplicar IA no trabalho que você já faz.\n\nConheça a carga horária de [informar duração], veja uma aula aberta e confira a garantia de [informar prazo de reembolso] antes de se inscrever.\n\nVer o programa do curso",
    service:
      "Entenda o próximo passo do seu negócio.\n\nConheça o escopo, o prazo estimado de [informar prazo] e um caso real ([inserir resultado verificável]) antes de contratar.\n\nConversar sobre meu projeto",
    app: "Veja se esta ferramenta cabe na sua rotina.\n\nExplore os recursos, compare os planos ([informar preço mensal]) e cancele em [informar condição de saída] se não se adaptar.\n\nConhecer os recursos",
    other:
      "Conheça a solução antes de decidir.\n\nEntenda como funciona, veja [inserir prova real] e confira o investimento ([informar preço e garantia]) antes de avançar.\n\nVer como funciona",
  }[draft.segment];
  const values = [
    Math.min(85, 62 + Number(hasTime) * 12),
    54 + Number(hasProof) * 18,
    30 + Number(hasProof) * 32,
    32 + Number(hasPrice) * 40,
    28 + Number(hasGuarantee) * 44,
  ];
  const panel = personas.filter((p) => draft.selected.includes(p.id));
  const base: Omit<Report, "verdicts"> = {
    id: newReportId(),
    target: reportTarget({ ...draft, mode: "text" }),
    createdAt: new Date().toISOString(),
    source,
    sourceType: "text",
    segment: draft.segment,
    personas: panel,
    score,
    elapsed,
    summary:
      "Exemplo ilustrativo: a proposta é compreensível, mas faltam provas, condições e uma saída segura para quem ainda está avaliando.",
    consensus:
      "A banca entende rapidamente a promessa central, mas trava no momento do compromisso: perfis mais práticos aceitam explorar se virem um próximo passo simples, enquanto perfis financeiros e técnicos exigem prova verificável, escopo e condição de saída.",
    dimensions: DIMENSIONS.map((d, i) => ({ ...d, value: values[i] })),
    objections,
    rewrites: {
      short,
      full: `${short}\n\nAntes de contratar, confira o que está incluído, o suporte disponível e as condições de saída. Compare a proposta com a sua necessidade e só avance se fizer sentido.\n\nNota para publicação: inclua aqui as provas, os preços e as garantias reais de ${segment.toLowerCase()}.`,
    },
    meta: { engine: "example", sourceChars: source.length },
  };
  const fixes: Record<string, string> = {
    tech: "Mostre o processo de implantação, as integrações disponíveis e o suporte técnico real.",
    finance: objections[1].fix,
  };
  return {
    ...base,
    verdicts: panel.map((p) => ({
      personaId: p.id,
      quote: exampleVerdict(p, base.target),
      concern: p.fears || p.focus,
      fix: fixes[p.id] || objections[2].fix,
      decision: inferDecision(p, score),
      question: personaQuestion(p),
    })),
  };
}

function exampleVerdict(persona: Persona, target: string): string {
  const verdicts: Record<string, string> = {
    tech: "Eu entendo a proposta. Mas quanto trabalho isso vai dar para o meu time colocar de pé?",
    finance:
      "Antes de aprovar, preciso saber o custo completo e o que justifica esse investimento.",
    buyer:
      "Parece interessante. Só não entendi por que escolher esta opção em vez de continuar procurando.",
    operator: "O que acontece quando eu tiver uma dúvida? Não quero descobrir tudo sozinho.",
    compliance: "Se não funcionar para a nossa operação, como encerramos a contratação?",
  };
  if (verdicts[persona.id]) return verdicts[persona.id];
  const tone =
    persona.style === "Apressado e cético"
      ? "Vou direto ao ponto."
      : persona.style === "Impulsivo por valor"
        ? "O benefício chama atenção, mas ainda tenho uma dúvida."
        : persona.skepticism >= 8
          ? "Não avanço sem uma resposta clara."
          : "Estou aberto a conhecer, mas preciso entender melhor.";
  return `${tone} ${persona.fears || persona.focus} A oferta de ${target.slice(0, 35)} ainda deixa essa questão em aberto.`;
}

export function engineLabel(report: Pick<Report, "meta">) {
  if (report.meta.engine === "example") return "Exemplo ilustrativo";
  return `Gemini · ${report.meta.model?.includes("pro") ? "Pro" : "Flash"}`;
}

export function reportDisclaimer(report: Pick<Report, "meta">) {
  return report.meta.engine === "example"
    ? "Exemplo ilustrativo gerado por regras locais."
    : `Simulação gerada por IA (${report.meta.model}). Não substitui pesquisa com clientes reais.`;
}

export function reportMarkdown(report: Report): string {
  const verdicts = report.verdicts
    .map((v) => {
      const p = report.personas.find((x) => x.id === v.personaId);
      return `### ${p?.name || v.personaId}\n> “${v.quote}”\n\n**Preocupação:** ${v.concern}\n\n**Como responder:** ${v.fix}`;
    })
    .join("\n\n");
  return `# OLAB · Relatório de fricção\n\n> ${reportDisclaimer(report)}\n\n**Alvo:** ${report.target}\n**Índice indicativo:** ${report.score}/100\n**Personas:** ${report.personas.map((p) => p.name).join(", ")}\n\n${report.summary}\n\n## Dimensões\n\n${report.dimensions.map((d) => `- ${d.label}: ${d.value}/100`).join("\n")}\n\n## Principais objeções\n\n${report.objections.map((o, i) => `### ${i + 1}. ${o.title}\n${o.detail}\n\n**Como corrigir:** ${o.fix}`).join("\n\n")}\n\n## O que a banca disse\n\n${verdicts}\n\n## Texto original\n\n${report.source}\n\n## Sugestão de reescrita\n\n${report.rewrites.short}\n`;
}

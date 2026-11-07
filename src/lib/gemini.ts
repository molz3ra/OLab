import {
  DIMENSIONS,
  DIMENSION_LABELS,
  DECISIONS,
  SEGMENTS,
  inferDecision,
  newReportId,
  personaQuestion,
  reportTarget,
  type Decision,
  type Dimension,
  type Draft,
  type Objection,
  type Persona,
  type Report,
  type Verdict,
} from "./lab";
import { isAbort, withTimeout } from "./signal";

export const GEMINI_MODELS = [
  {
    id: "gemini-2.0-flash",
    label: "Flash (2.0)",
    description: "Rápido e preciso. Indicado para a maioria das análises.",
  },
  {
    id: "gemini-1.5-flash",
    label: "Flash (1.5)",
    description: "Versão estável e instantânea com alta disponibilidade.",
  },
  {
    id: "gemini-1.5-pro",
    label: "Pro",
    description: "Mais profundo e analítico. Maior reflexão de CRO.",
  },
] as const;
export type GeminiModel = (typeof GEMINI_MODELS)[number]["id"] | string;
export const DEFAULT_MODEL: GeminiModel = "gemini-2.0-flash";
export const MAX_SOURCE_CHARS = 24_000;
const API = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiErrorCode =
  | "invalid_key"
  | "model_unavailable"
  | "quota"
  | "overloaded"
  | "blocked"
  | "network"
  | "timeout"
  | "invalid_response";

export const GEMINI_MESSAGES: Record<GeminiErrorCode, string> = {
  invalid_key: "A chave foi recusada pelo Google. Confira se ela está ativa no Google AI Studio.",
  model_unavailable: "Este modelo não está disponível para a sua chave. Escolha outro modelo.",
  quota: "O limite de uso da sua chave foi atingido. Aguarde alguns instantes ou troque de modelo.",
  overloaded: "O modelo está sobrecarregado no momento. Tente novamente em instantes.",
  blocked: "O Gemini não respondeu a este conteúdo por causa dos filtros de segurança.",
  network: "Não foi possível conectar ao Google. Verifique sua conexão.",
  timeout: "O Gemini demorou demais para responder. Tente novamente.",
  invalid_response: "A resposta veio incompleta. Tente novamente.",
};

export class GeminiError extends Error {
  code: GeminiErrorCode;
  constructor(code: GeminiErrorCode, message = GEMINI_MESSAGES[code]) {
    super(message);
    this.name = "GeminiError";
    this.code = code;
  }
}

/** Maps an HTTP failure from the Gemini API to a user-facing error code. */
export function errorCodeFor(status: number, body: string): GeminiErrorCode {
  if (status === 401 || status === 403 || body.includes("API_KEY_INVALID")) return "invalid_key";
  if (status === 404) return "model_unavailable";
  if (status === 429) return "quota";
  if (status >= 500) return "overloaded";
  if (status === 400 && /api key/i.test(body)) return "invalid_key";
  return "invalid_response";
}

const SYSTEM_INSTRUCTION = `Você é o OLAB, uma banca sintética de compradores céticos que audita landing pages antes de um investimento em tráfego.

Regras obrigatórias:
- Responda somente em português do Brasil.
- Baseie cada observação no texto fornecido. Não invente dados, números, depoimentos, clientes, prazos, preços ou garantias.
- Nas reescritas, quando faltar uma prova ou condição, use um marcador entre colchetes, como [inserir depoimento real] ou [informar preço], em vez de inventar.
- O índice (score) é um sinal indicativo de clareza e confiança da oferta, de 0 a 100. Não é taxa de conversão.
- Avalie exatamente as cinco dimensões: Clareza, Valor, Confiança, Preço e Segurança.
- Liste de 3 a 5 objeções, da mais grave para a menos grave. Severidade "Alta" bloqueia a decisão; "Média" gera hesitação.
- Em cada objeção, preencha "excerpt" com uma citação curta e literal do texto original (1 frase ou trecho de até 140 caracteres) onde o problema aparece ou onde faltou a informação.
- Para cada persona, escreva um veredito em primeira pessoa (quote), no tom do estilo informado e coerente com o nível de ceticismo (1 = aberto, 10 = muito difícil de convencer). Use exatamente o "id" fornecido em personaId.
- Para cada persona, defina "decision" ("Avançaria", "Hesitaria" ou "Abandonaria") e "question" (a pergunta decisiva em primeira pessoa que ela precisa ver respondida).
- "summary" é um diagnóstico editorial de uma ou duas frases.
- "consensus" sintetiza em duas frases onde a banca concorda e onde os perfis divergem.
- "rewrites.short" é uma versão direta (título, apoio e chamada para ação). "rewrites.full" é uma versão argumentativa completa. Separe parágrafos com linha em branco.`;

const text = { type: "STRING" } as const;
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER" },
    summary: text,
    consensus: text,
    dimensions: {
      type: "ARRAY",
      minItems: 5,
      maxItems: 5,
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", enum: DIMENSION_LABELS },
          value: { type: "INTEGER" },
        },
        required: ["label", "value"],
      },
    },
    objections: {
      type: "ARRAY",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "OBJECT",
        properties: {
          title: text,
          detail: text,
          fix: text,
          severity: { type: "STRING", enum: ["Alta", "Média"] },
          excerpt: text,
        },
        required: ["title", "detail", "fix", "severity", "excerpt"],
        propertyOrdering: ["title", "detail", "fix", "severity", "excerpt"],
      },
    },
    verdicts: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          personaId: text,
          quote: text,
          concern: text,
          fix: text,
          decision: { type: "STRING", enum: DECISIONS },
          question: text,
        },
        required: ["personaId", "quote", "concern", "fix", "decision", "question"],
        propertyOrdering: ["personaId", "quote", "concern", "fix", "decision", "question"],
      },
    },
    rewrites: {
      type: "OBJECT",
      properties: { short: text, full: text },
      required: ["short", "full"],
    },
  },
  required: ["score", "summary", "consensus", "dimensions", "objections", "verdicts", "rewrites"],
  propertyOrdering: [
    "score",
    "summary",
    "consensus",
    "dimensions",
    "objections",
    "verdicts",
    "rewrites",
  ],
};

export type AnalysisInput = {
  draft: Draft;
  sourceText: string;
  personas: Persona[];
};

/** Builds the generateContent body. Pure, so the prompt and truncation can be tested. */
export function buildRequest({ draft, sourceText, personas }: AnalysisInput) {
  const clean = sourceText.trim();
  const truncated = clean.length > MAX_SOURCE_CHARS;
  const content = truncated ? clean.slice(0, MAX_SOURCE_CHARS) : clean;
  const segment = SEGMENTS.find((s) => s.value === draft.segment)?.label || "Outro segmento";
  const panel = personas.map(({ id, name, role, focus, fears, style, skepticism }) => ({
    id,
    name,
    role,
    focus,
    fears: fears || undefined,
    style: style || undefined,
    skepticism,
  }));
  const prompt = [
    `Segmento da oferta: ${segment}`,
    draft.mode === "url"
      ? `Origem: página pública em ${draft.url.trim()} (texto extraído automaticamente).`
      : "Origem: texto colado pela pessoa.",
    truncated ? `Atenção: o texto foi cortado nos primeiros ${MAX_SOURCE_CHARS} caracteres.` : "",
    `Banca de personas (JSON):\n${JSON.stringify(panel, null, 2)}`,
    `Texto da página:\n"""\n${content}\n"""`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    body: {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    },
    content,
    truncated,
  };
}

export type ParsedAnalysis = {
  score: number;
  summary: string;
  consensus: string;
  dimensions: Dimension[];
  objections: Objection[];
  verdicts: Verdict[];
  rewrites: { short: string; full: string };
};

const invalid = () => new GeminiError("invalid_response");
const str = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) throw invalid();
  return value.trim();
};
const optStr = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const pct = (value: unknown) => {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) throw invalid();
  return Math.round(Math.min(100, Math.max(0, n)));
};
const record = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const list = (value: unknown) => {
  if (!Array.isArray(value)) throw invalid();
  return value;
};

/** Validates and normalizes the model's JSON. Throws GeminiError("invalid_response"). */
export function parseAnalysis(raw: string, personas: Persona[]): ParsedAnalysis {
  let data: Record<string, unknown>;
  try {
    data = record(JSON.parse(raw));
  } catch {
    throw invalid();
  }
  const dims = list(data.dimensions).map(record);
  const score = pct(data.score);
  const dimensions = DIMENSIONS.map((d) => {
    const match = dims.find((x) => typeof x.label === "string" && x.label.trim() === d.label);
    if (!match) throw invalid();
    return { ...d, value: pct(match.value) };
  });
  const objections = list(data.objections)
    .map(record)
    .slice(0, 5)
    .map((o) => ({
      title: str(o.title).replace(/\.$/, ""),
      detail: str(o.detail),
      fix: str(o.fix),
      severity: (o.severity === "Média" ? "Média" : "Alta") as Objection["severity"],
      excerpt: optStr(o.excerpt)?.replace(/^[“"]|[”"]$/g, ""),
    }));
  if (objections.length < 3) throw invalid();
  const given = list(data.verdicts).map(record);
  const verdicts = personas.map((p) => {
    const v = given.find((x) => x.personaId === p.id);
    if (!v) throw invalid();
    const rawDecision = optStr(v.decision) as Decision | undefined;
    return {
      personaId: p.id,
      quote: str(v.quote).replace(/^[“"]|[”"]$/g, ""),
      concern: str(v.concern),
      fix: str(v.fix),
      decision: DECISIONS.includes(rawDecision as Decision)
        ? (rawDecision as Decision)
        : inferDecision(p, score),
      question: optStr(v.question) || personaQuestion(p),
    };
  });
  const rewrites = record(data.rewrites);
  const summary = str(data.summary);
  return {
    score,
    summary,
    consensus:
      optStr(data.consensus) ||
      "A banca compartilha dúvidas sobre a clareza de provas e condições, mas cada perfil prioriza um risco diferente antes de avançar.",
    dimensions,
    objections,
    verdicts,
    rewrites: { short: str(rewrites.short), full: str(rewrites.full) },
  };
}

type GenerateResponse = {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
};

async function request(
  url: string,
  init: RequestInit,
  signal: AbortSignal | undefined,
  ms: number,
) {
  const timeout = withTimeout(signal, ms);
  try {
    const response = await fetch(url, { ...init, signal: timeout.signal });
    const body = await response.text();
    return { response, body };
  } catch (error) {
    if (isAbort(error) && timeout.timedOut()) throw new GeminiError("timeout");
    if (isAbort(error)) throw error;
    throw new GeminiError("network");
  } finally {
    timeout.done();
  }
}

export async function analyze({
  draft,
  sourceText,
  sourceTitle,
  personas,
  apiKey,
  model,
  signal,
  baselineId,
  iteration,
}: AnalysisInput & {
  sourceTitle?: string;
  apiKey: string;
  model: GeminiModel;
  signal?: AbortSignal;
  baselineId?: string;
  iteration?: number;
}): Promise<Omit<Report, "elapsed">> {
  const started = performance.now();
  const { body, content, truncated } = buildRequest({ draft, sourceText, personas });
  let raw: string;
  let response: Response;

  if (apiKey) {
    const res = await request(
      `${API}/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
      },
      signal,
      90_000,
    );
    response = res.response;
    raw = res.body;
  } else {
    // Conexão com o backend quando o usuário não tiver chave própria (usa a chave corporativa/ambiente)
    const res = await request(
      "/api/analyze-v2",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, model }),
      },
      signal,
      90_000,
    );
    response = res.response;
    raw = res.body;
  }
  if (!response.ok) throw new GeminiError(errorCodeFor(response.status, raw));
  let data: GenerateResponse;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new GeminiError("invalid_response");
  }
  const candidate = data.candidates?.[0];
  if (data.promptFeedback?.blockReason || candidate?.finishReason === "SAFETY" || !candidate)
    throw new GeminiError("blocked");
  const output = (candidate.content?.parts || [])
    .filter((p) => !p.thought && p.text)
    .map((p) => p.text)
    .join("");
  const parsed = parseAnalysis(output, personas);
  return {
    id: newReportId(),
    target: reportTarget(draft, sourceTitle),
    createdAt: new Date().toISOString(),
    source: content,
    sourceType: draft.mode,
    segment: draft.segment,
    personas,
    ...parsed,
    baselineId,
    iteration,
    meta: {
      engine: "gemini",
      model,
      analysisMs: performance.now() - started,
      promptTokens: data.usageMetadata?.promptTokenCount,
      outputTokens: data.usageMetadata?.candidatesTokenCount,
      sourceChars: content.length,
      truncated,
    },
  };
}

/** Checks that the key can reach the selected model. Network failures surface as "network". */
export async function verifyKey(apiKey: string, model: GeminiModel, signal?: AbortSignal) {
  const { response, body } = await request(
    `${API}/${model}`,
    { headers: { "x-goog-api-key": apiKey } },
    signal,
    15_000,
  );
  if (!response.ok) throw new GeminiError(errorCodeFor(response.status, body));
}

import assert from "node:assert/strict";
import test from "node:test";
import {
  GeminiError,
  MAX_SOURCE_CHARS,
  buildRequest,
  errorCodeFor,
  parseAnalysis,
} from "./gemini.ts";
import { DIMENSION_LABELS, EMPTY_DRAFT, PERSONAS, type Persona } from "./lab.ts";
import { parseReaderOutput } from "./reader.ts";
import { resolveTheme } from "./theme.ts";

const panel = PERSONAS.slice(0, 3);
const valid = () => ({
  score: 64,
  summary: "Proposta clara, mas sem provas.",
  dimensions: DIMENSION_LABELS.map((label, i) => ({ label, value: 40 + i * 10 })),
  objections: [1, 2, 3].map((n) => ({
    title: `Objeção ${n}.`,
    detail: `Detalhe ${n}`,
    fix: `Correção ${n}`,
    severity: n === 3 ? "Média" : "Alta",
  })),
  verdicts: panel.map((p) => ({
    personaId: p.id,
    quote: `“Fala de ${p.name}”`,
    concern: "Preocupação",
    fix: "Resposta",
  })),
  rewrites: { short: "Curta", full: "Completa" },
});
const isInvalid = (e: unknown) => e instanceof GeminiError && e.code === "invalid_response";

test("parseAnalysis accepts a valid response and normalizes text", () => {
  const result = parseAnalysis(JSON.stringify(valid()), panel);
  assert.equal(result.score, 64);
  assert.deepEqual(
    result.dimensions.map((d) => d.label),
    DIMENSION_LABELS,
  );
  assert.ok(result.dimensions.every((d) => d.detail));
  assert.equal(result.objections[0].title, "Objeção 1");
  assert.equal(result.objections[2].severity, "Média");
  assert.equal(result.verdicts[0].quote, `Fala de ${panel[0].name}`);
});

test("parseAnalysis clamps values and reorders dimensions", () => {
  const data = valid();
  data.score = 140;
  data.dimensions = [...data.dimensions].reverse();
  data.dimensions[0].value = -8;
  const result = parseAnalysis(JSON.stringify(data), panel);
  assert.equal(result.score, 100);
  assert.deepEqual(
    result.dimensions.map((d) => d.label),
    DIMENSION_LABELS,
  );
  assert.equal(result.dimensions.at(-1)!.value, 0);
});

test("parseAnalysis rejects missing dimensions, missing verdicts, and broken JSON", () => {
  const noDim = valid();
  noDim.dimensions = noDim.dimensions.slice(1);
  assert.throws(() => parseAnalysis(JSON.stringify(noDim), panel), isInvalid);
  const noVerdict = valid();
  noVerdict.verdicts = noVerdict.verdicts.slice(1);
  assert.throws(() => parseAnalysis(JSON.stringify(noVerdict), panel), isInvalid);
  const fewObjections = valid();
  fewObjections.objections = fewObjections.objections.slice(0, 2);
  assert.throws(() => parseAnalysis(JSON.stringify(fewObjections), panel), isInvalid);
  const empty = valid();
  empty.summary = "   ";
  assert.throws(() => parseAnalysis(JSON.stringify(empty), panel), isInvalid);
  assert.throws(() => parseAnalysis("{not json", panel), isInvalid);
});

test("parseAnalysis drops verdicts for unknown personas and keeps the panel order", () => {
  const data = valid();
  data.verdicts = [
    { personaId: "ghost", quote: "x", concern: "x", fix: "x" },
    ...[...data.verdicts].reverse(),
  ];
  const result = parseAnalysis(JSON.stringify(data), panel);
  assert.deepEqual(
    result.verdicts.map((v) => v.personaId),
    panel.map((p) => p.id),
  );
});

test("HTTP failures map to specific error codes", () => {
  assert.equal(
    errorCodeFor(400, '{"error":{"details":[{"reason":"API_KEY_INVALID"}]}}'),
    "invalid_key",
  );
  assert.equal(errorCodeFor(403, ""), "invalid_key");
  assert.equal(errorCodeFor(404, ""), "model_unavailable");
  assert.equal(errorCodeFor(429, ""), "quota");
  assert.equal(errorCodeFor(503, ""), "overloaded");
  assert.equal(errorCodeFor(400, "bad"), "invalid_response");
});

test("buildRequest truncates long sources and includes custom persona details", () => {
  const custom: Persona = {
    id: "custom-1",
    name: "Diretor clínico",
    role: "Saúde",
    focus: "Privacidade",
    fears: "Vazamento de dados dos pacientes",
    style: "Conservador e cauteloso",
    skepticism: 9,
    icon: "people",
  };
  const long = "a".repeat(MAX_SOURCE_CHARS + 500);
  const { body, content, truncated } = buildRequest({
    draft: { ...EMPTY_DRAFT, mode: "text", text: long },
    sourceText: long,
    personas: [...panel, custom],
  });
  assert.equal(truncated, true);
  assert.equal(content.length, MAX_SOURCE_CHARS);
  const prompt = body.contents[0].parts[0].text;
  assert.match(prompt, /Vazamento de dados dos pacientes/);
  assert.match(prompt, /"id": "custom-1"/);
  assert.equal(body.generationConfig.responseMimeType, "application/json");
  const short = buildRequest({ draft: EMPTY_DRAFT, sourceText: "Texto curto", personas: panel });
  assert.equal(short.truncated, false);
});

test("reader output drops the Jina metadata header and keeps the title", () => {
  const parsed = parseReaderOutput(
    "Title: Fluxo — Financeiro\nURL Source: https://fluxo.com\n\nMarkdown Content:\n# Tudo em um lugar\n\n\n\n![logo](x.png)Texto",
  );
  assert.equal(parsed.title, "Fluxo — Financeiro");
  assert.equal(parsed.text, "# Tudo em um lugar\n\nTexto");
});

test("theme preference resolves against the system setting", () => {
  assert.equal(resolveTheme("system", true), "dark");
  assert.equal(resolveTheme("system", false), "light");
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

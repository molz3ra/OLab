import assert from "node:assert/strict";
import test from "node:test";
import {
  EMPTY_DRAFT,
  PERSONAS,
  PRESETS,
  makeExampleReport,
  reportMarkdown,
  validateDraft,
  type Draft,
  type Persona,
} from "./lab.ts";

const textDraft = (): Draft => ({
  ...EMPTY_DRAFT,
  mode: "text",
  text: PRESETS[0].text,
  selected: [...EMPTY_DRAFT.selected],
});

test("requires a real URL or enough copy, and a panel of 3–5 profiles", () => {
  assert.ok(validateDraft({ ...EMPTY_DRAFT, url: "" }));
  assert.ok(validateDraft({ ...EMPTY_DRAFT, url: "not-a-url" }));
  assert.equal(validateDraft({ ...EMPTY_DRAFT, url: "example.com/pricing" }), null);
  assert.equal(validateDraft({ ...EMPTY_DRAFT, url: "https://example.com" }), null);
  assert.ok(validateDraft({ ...textDraft(), text: "Muito curto" }));
  assert.ok(validateDraft({ ...textDraft(), selected: ["tech", "finance"] }));
  assert.ok(validateDraft({ ...textDraft(), selected: ["1", "2", "3", "4", "5", "6"] }));
  assert.equal(validateDraft(textDraft()), null);
});

test("the original copy and selected profiles reach the report unchanged", () => {
  const draft = textDraft();
  const report = makeExampleReport(draft, PERSONAS);
  assert.equal(report.source, draft.text);
  assert.deepEqual(
    report.personas.map((p) => p.id),
    draft.selected,
  );
  assert.equal(report.personas.length, 3);
  assert.equal(report.dimensions.length, 5);
});

test("the local heuristic responds to proof, price, timing, and guarantees", () => {
  const baseline = makeExampleReport(textDraft(), PERSONAS);
  const improved = makeExampleReport(
    {
      ...textDraft(),
      text: `${PRESETS[0].text}\nClientes relatam 20% de economia em 14 dias. Preço de R$ 100 por mês. Cancele quando quiser.`,
    },
    PERSONAS,
  );
  assert.ok(improved.score > baseline.score);
  assert.ok(
    improved.dimensions.find((d) => d.label === "Preço")!.value >
      baseline.dimensions.find((d) => d.label === "Preço")!.value,
  );
  assert.ok(improved.objections[0].title.includes("evidência"));
});

test("example reports carry one verdict per selected persona and the example engine", () => {
  const draft = textDraft();
  const report = makeExampleReport(draft, PERSONAS);
  assert.equal(report.meta.engine, "example");
  assert.deepEqual(
    report.verdicts.map((v) => v.personaId),
    draft.selected,
  );
  assert.ok(report.verdicts.every((v) => v.quote && v.concern && v.fix));
});

test("segments and writing styles produce distinct suggestions without fabricated claims", () => {
  const course = makeExampleReport({ ...textDraft(), segment: "course" }, PERSONAS);
  const commerce = makeExampleReport({ ...textDraft(), segment: "commerce" }, PERSONAS);
  assert.notEqual(course.rewrites.short, commerce.rewrites.short);
  assert.ok(course.rewrites.full.length > course.rewrites.short.length);
  assert.doesNotMatch(commerce.rewrites.short, /30 dias|100%|R\$/);
  assert.match(commerce.rewrites.short, /\[.+\]/);
});

test("custom persona data affects its verdict and is included in the report", () => {
  const custom: Persona = {
    id: "custom-1",
    name: "Diretor clínico",
    role: "Saúde",
    focus: "Privacidade dos pacientes",
    fears: "Não quero expor os dados dos pacientes.",
    icon: "people",
    skepticism: 9,
    style: "Analítico e objetivo",
  };
  const report = makeExampleReport({ ...textDraft(), selected: ["tech", "finance", custom.id] }, [
    ...PERSONAS,
    custom,
  ]);
  assert.equal(report.personas[2].name, custom.name);
  const verdict = report.verdicts.find((v) => v.personaId === custom.id)!;
  assert.match(verdict.quote, /dados dos pacientes/);
  assert.equal(verdict.concern, custom.fears);
});

test("Markdown export contains the original, findings, verdicts, and an engine-specific disclosure", () => {
  const report = makeExampleReport(textDraft(), PERSONAS);
  const markdown = reportMarkdown(report);
  assert.ok(markdown.includes(report.source));
  assert.ok(markdown.includes(report.rewrites.short));
  assert.ok(markdown.includes(report.objections[0].fix));
  assert.ok(markdown.includes(report.verdicts[0].quote));
  assert.match(markdown, /Exemplo ilustrativo/);
  const ai = reportMarkdown({
    ...report,
    summary: "Resumo da IA.",
    meta: { engine: "gemini", model: "gemini-2.5-flash", sourceChars: 10 },
  });
  assert.match(ai, /Simulação gerada por IA \(gemini-2\.5-flash\)/);
  assert.doesNotMatch(ai, /Exemplo ilustrativo|Demonstração local/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { annotateSource, diffWords, fillPlaceholder, parsePlaceholders } from "./diff.ts";

test("diffWords marks unchanged, removed, and inserted words accurately", () => {
  const { tokens, stats } = diffWords(
    "Automatize contas a pagar hoje",
    "Automatize suas contas com segurança hoje",
  );
  assert.ok(stats.added >= 2);
  assert.ok(stats.removed >= 2);
  assert.equal(
    tokens
      .filter((t) => t.type !== "del")
      .map((t) => t.text)
      .join(""),
    "Automatize suas contas com segurança hoje",
  );
  assert.equal(
    tokens
      .filter((t) => t.type !== "ins")
      .map((t) => t.text)
      .join(""),
    "Automatize contas a pagar hoje",
  );
});

test("parsePlaceholders and fillPlaceholder isolate and replace bracketed slots", () => {
  const copy = "Planos a partir de [informar preço] com [inserir prova real] e garantia.";
  const segments = parsePlaceholders(copy);
  const slots = segments.filter((s) => s.type === "slot");
  assert.equal(slots.length, 2);
  assert.equal(slots[0].label, "informar preço");
  const updated = fillPlaceholder(copy, 0, "R$ 149/mês");
  assert.equal(updated, "Planos a partir de R$ 149/mês com [inserir prova real] e garantia.");
});

test("annotateSource highlights non-overlapping excerpts case-insensitively", () => {
  const source =
    "Todo o financeiro da sua empresa, em um só lugar.\n\nComece agora e transforme sua gestão.";
  const segments = annotateSource(source, [
    {
      title: "Promessa vaga",
      detail: "x",
      fix: "y",
      severity: "Alta",
      excerpt: "Todo o financeiro da sua empresa",
    },
    {
      title: "CTA sem contexto",
      detail: "x",
      fix: "y",
      severity: "Média",
      excerpt: "Comece agora e transforme sua gestão.",
    },
  ]);
  const marked = segments.filter((s) => s.objectionIndex !== undefined);
  assert.equal(marked.length, 2);
  assert.equal(marked[0].objectionIndex, 0);
  assert.equal(marked[1].objectionIndex, 1);
  assert.equal(segments.map((s) => s.text).join(""), source);
});

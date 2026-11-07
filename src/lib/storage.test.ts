import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_DRAFT, PERSONAS, PRESETS, makeExampleReport } from "./lab.ts";
import {
  KEYS,
  MAX_REPORTS,
  load,
  parseDraft,
  parsePersonas,
  parseReports,
  save,
  serializeReports,
} from "./storage.ts";

class MemoryStorage {
  data = new Map<string, string>();
  fail = false;
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.fail) throw new Error("QuotaExceededError");
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
const memory = new MemoryStorage();
Object.defineProperty(globalThis, "localStorage", { value: memory, configurable: true });

const report = () =>
  makeExampleReport(
    { ...EMPTY_DRAFT, mode: "text", text: PRESETS[0].text, selected: [...EMPTY_DRAFT.selected] },
    PERSONAS,
  );

test("reports round-trip through storage", () => {
  const items = [report(), report()];
  assert.equal(save(KEYS.reports, serializeReports(items)), true);
  assert.deepEqual(load(KEYS.reports, parseReports, []), items);
});

test("corrupted or outdated data falls back safely", () => {
  memory.data.set(KEYS.reports, "{oops");
  assert.deepEqual(load(KEYS.reports, parseReports, []), []);
  memory.data.set(KEYS.reports, JSON.stringify([report()]));
  assert.deepEqual(load(KEYS.reports, parseReports, []), []);
  memory.data.set(KEYS.draft, JSON.stringify({ mode: "video" }));
  assert.equal(load(KEYS.draft, parseDraft, null), null);
});

test("invalid items are dropped one by one and history is capped", () => {
  const items = Array.from({ length: MAX_REPORTS + 5 }, report);
  const broken = { ...report(), dimensions: [] };
  const parsed = parseReports({ v: 1, items: [broken, ...items] });
  assert.equal(parsed.length, MAX_REPORTS);
  assert.ok(parsed.every((r) => r.dimensions.length === 5));
  assert.equal(serializeReports(items).items.length, MAX_REPORTS);
  assert.deepEqual(parsePersonas([PERSONAS[0], { id: 1 }, null]), [PERSONAS[0]]);
});

test("save reports failure instead of throwing", () => {
  memory.fail = true;
  assert.equal(save(KEYS.draft, EMPTY_DRAFT), false);
  memory.fail = false;
  assert.equal(save(KEYS.draft, EMPTY_DRAFT), true);
  assert.deepEqual(load(KEYS.draft, parseDraft, null), EMPTY_DRAFT);
});

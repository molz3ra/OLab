import { SEGMENTS, type Draft, type Persona, type Report } from "./lab";

export const KEYS = {
  apiKey: "olab_gemini_key",
  model: "olab_gemini_model",
  reports: "olab_reports_v1",
  personas: "olab_personas_v1",
  draft: "olab_draft_v1",
  theme: "olab_theme",
} as const;
export const MAX_REPORTS = 30;

const store = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

export function loadText(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function saveText(key: string, value: string | null): boolean {
  try {
    const s = store();
    if (!s) return false;
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function load<T>(key: string, parse: (value: unknown) => T, fallback: T): T {
  const raw = loadText(key);
  if (raw === null) return fallback;
  try {
    return parse(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): boolean {
  return saveText(key, JSON.stringify(value));
}

const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const ICONS = ["code", "chart", "bag", "user", "shield", "people"];

export function isPersona(v: unknown): v is Persona {
  return (
    obj(v) &&
    isStr(v.id) &&
    isStr(v.name) &&
    isStr(v.role) &&
    isStr(v.focus) &&
    isNum(v.skepticism) &&
    ICONS.includes(v.icon as string)
  );
}

export function isReport(v: unknown): v is Report {
  if (!obj(v) || !obj(v.meta) || !obj(v.rewrites)) return false;
  return (
    isStr(v.id) &&
    isStr(v.target) &&
    isStr(v.createdAt) &&
    isStr(v.source) &&
    (v.sourceType === "url" || v.sourceType === "text") &&
    isStr(v.summary) &&
    isNum(v.score) &&
    isNum(v.elapsed) &&
    (v.meta.engine === "gemini" || v.meta.engine === "example") &&
    Array.isArray(v.personas) &&
    v.personas.every(isPersona) &&
    Array.isArray(v.dimensions) &&
    v.dimensions.length === 5 &&
    v.dimensions.every((d) => obj(d) && isStr(d.label) && isNum(d.value)) &&
    Array.isArray(v.objections) &&
    v.objections.length >= 1 &&
    v.objections.every((o) => obj(o) && isStr(o.title) && isStr(o.detail) && isStr(o.fix)) &&
    Array.isArray(v.verdicts) &&
    v.verdicts.every((x) => obj(x) && isStr(x.personaId) && isStr(x.quote)) &&
    isStr(v.rewrites.short) &&
    isStr(v.rewrites.full)
  );
}

export function isDraft(v: unknown): v is Draft {
  return (
    obj(v) &&
    (v.mode === "url" || v.mode === "text") &&
    isStr(v.url) &&
    isStr(v.text) &&
    SEGMENTS.some((s) => s.value === v.segment) &&
    Array.isArray(v.selected) &&
    v.selected.every(isStr)
  );
}

/** Versioned envelope `{ v: 1, items }`; invalid items are dropped one by one. */
export const parseReports = (value: unknown): Report[] => {
  if (!obj(value) || value.v !== 1 || !Array.isArray(value.items)) return [];
  return value.items.filter(isReport).slice(0, MAX_REPORTS);
};
export const serializeReports = (items: Report[]) => ({ v: 1, items: items.slice(0, MAX_REPORTS) });

export const parsePersonas = (value: unknown): Persona[] =>
  Array.isArray(value) ? value.filter(isPersona) : [];

export const parseDraft = (value: unknown): Draft | null => (isDraft(value) ? value : null);

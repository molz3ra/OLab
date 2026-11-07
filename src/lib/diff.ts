import type { Objection } from "./lab";

export type DiffToken = { type: "same" | "del" | "ins"; text: string };
export type DiffStats = { added: number; removed: number };
export type CopySegment =
  | { type: "text"; value: string }
  | { type: "slot"; raw: string; label: string; slotIndex: number };
export type AnnotatedSegment = { text: string; objectionIndex?: number };

const tokenize = (input: string) => input.match(/\S+|\s+/g) || [];
const isWord = (token: string) => /\S/.test(token);

/** Word-level LCS diff with safe bounding for long landing page copy. */
export function diffWords(
  original: string,
  revised: string,
): {
  tokens: DiffToken[];
  stats: DiffStats;
} {
  const a = tokenize(original);
  const b = tokenize(revised);
  // Guard against quadratic blow-up on very large texts by falling back to paragraph tokens.
  const maxCells = 180_000;
  const left = a.length * b.length > maxCells ? original.split(/(\n+)/) : a;
  const right = a.length * b.length > maxCells ? revised.split(/(\n+)/) : b;
  const n = left.length;
  const m = right.length;
  const dp = new Uint16Array((n + 1) * (m + 1));
  const width = m + 1;
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * width + j] =
        left[i] === right[j]
          ? dp[(i + 1) * width + j + 1] + 1
          : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    }
  }
  const raw: DiffToken[] = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;
  while (i < n && j < m) {
    if (left[i] === right[j]) {
      raw.push({ type: "same", text: left[i++] });
      j++;
    } else if (dp[(i + 1) * width + j] >= dp[i * width + j + 1]) {
      if (isWord(left[i])) removed++;
      raw.push({ type: "del", text: left[i++] });
    } else {
      if (isWord(right[j])) added++;
      raw.push({ type: "ins", text: right[j++] });
    }
  }
  while (i < n) {
    if (isWord(left[i])) removed++;
    raw.push({ type: "del", text: left[i++] });
  }
  while (j < m) {
    if (isWord(right[j])) added++;
    raw.push({ type: "ins", text: right[j++] });
  }
  const tokens: DiffToken[] = [];
  for (const item of raw) {
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === item.type) prev.text += item.text;
    else tokens.push({ ...item });
  }
  return { tokens, stats: { added, removed } };
}

/** Splits rewrite text into plain segments and interactive `[placeholder]` slots. */
export function parsePlaceholders(input: string): CopySegment[] {
  const pattern = /\[([^[\]\n]{2,90})\]/g;
  const segments: CopySegment[] = [];
  let last = 0;
  let slotIndex = 0;
  for (const match of input.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) segments.push({ type: "text", value: input.slice(last, start) });
    segments.push({
      type: "slot",
      raw: match[0],
      label: match[1].trim(),
      slotIndex: slotIndex++,
    });
    last = start + match[0].length;
  }
  if (last < input.length || segments.length === 0)
    segments.push({ type: "text", value: input.slice(last) });
  return segments;
}

/** Replaces a single `[placeholder]` by its 0-based slot occurrence index. */
export function fillPlaceholder(input: string, slotIndex: number, replacement: string): string {
  const clean = replacement.trim();
  if (!clean) return input;
  return parsePlaceholders(input)
    .map((seg) =>
      seg.type === "slot" ? (seg.slotIndex === slotIndex ? clean : seg.raw) : seg.value,
    )
    .join("");
}

function findExcerptRange(source: string, excerpt?: string): [number, number] | null {
  const clean = excerpt?.replace(/^[“"«']+|[”"»']+$/g, "").trim();
  if (!clean || clean.length < 6) return null;
  const lowerSource = source.toLowerCase();
  const lowerExcerpt = clean.toLowerCase();
  const direct = lowerSource.indexOf(lowerExcerpt);
  if (direct >= 0) return [direct, direct + clean.length];
  // Fallback: match with flexible whitespace.
  const escaped = clean
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  if (!escaped) return null;
  const match = new RegExp(escaped, "i").exec(source);
  return match && match.index !== undefined ? [match.index, match.index + match[0].length] : null;
}

/** Locates objection excerpts in the original source text and returns non-overlapping segments. */
export function annotateSource(source: string, objections: Objection[]): AnnotatedSegment[] {
  const ranges: { start: number; end: number; objectionIndex: number }[] = [];
  objections.forEach((o, objectionIndex) => {
    const found = findExcerptRange(source, o.excerpt);
    if (!found) return;
    const [start, end] = found;
    if (ranges.some((r) => start < r.end && end > r.start)) return;
    ranges.push({ start, end, objectionIndex });
  });
  ranges.sort((a, b) => a.start - b.start);
  if (!ranges.length) return [{ text: source }];
  const segments: AnnotatedSegment[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) segments.push({ text: source.slice(cursor, r.start) });
    segments.push({ text: source.slice(r.start, r.end), objectionIndex: r.objectionIndex });
    cursor = r.end;
  }
  if (cursor < source.length) segments.push({ text: source.slice(cursor) });
  return segments;
}

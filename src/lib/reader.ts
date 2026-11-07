import { normalizeUrl } from "./lab";
import { isAbort, withTimeout } from "./signal";

export type ReaderErrorCode = "blocked" | "rate_limited" | "network" | "timeout";

export class ReaderError extends Error {
  code: ReaderErrorCode;
  constructor(code: ReaderErrorCode, message: string) {
    super(message);
    this.name = "ReaderError";
    this.code = code;
  }
}

export const READER_MESSAGES: Record<ReaderErrorCode, string> = {
  blocked:
    "Não conseguimos ler esta página. Ela pode exigir login ou bloquear leitores. Cole o texto na aba Texto da página.",
  rate_limited:
    "O leitor de páginas atingiu o limite de uso. Aguarde um minuto ou cole o texto da página.",
  network: "Não foi possível alcançar o leitor de páginas. Verifique sua conexão.",
  timeout: "A página demorou demais para responder. Tente de novo ou cole o texto.",
};

const MIN_CONTENT = 200;

/** Removes the metadata header that Jina Reader prepends to the page content. */
export function parseReaderOutput(raw: string): { text: string; title?: string } {
  const title = raw.match(/^Title:\s*(.+)$/m)?.[1]?.trim();
  const marker = raw.indexOf("Markdown Content:");
  const body = marker >= 0 ? raw.slice(marker + "Markdown Content:".length) : raw;
  const text = body
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text, title: title || undefined };
}

export async function readPage(
  url: string,
  signal?: AbortSignal,
): Promise<{ text: string; title?: string; ms: number }> {
  const started = performance.now();
  const timeout = withTimeout(signal, 25_000);
  let response: Response;
  try {
    response = await fetch(`https://r.jina.ai/${normalizeUrl(url)}`, {
      headers: { Accept: "text/plain" },
      signal: timeout.signal,
    });
  } catch (error) {
    // Fallback gracioso para o backend caso r.jina.ai seja bloqueado por CORS ou adblocker no cliente
    try {
      const fallbackRes = await fetch(`/api/scrape?url=${encodeURIComponent(normalizeUrl(url))}`, {
        signal: timeout.signal,
      });
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData.text && fallbackData.text.length >= MIN_CONTENT) {
          timeout.done();
          return { text: fallbackData.text, title: fallbackData.title, ms: performance.now() - started };
        }
      }
    } catch {}

    timeout.done();
    if (isAbort(error) && timeout.timedOut())
      throw new ReaderError("timeout", READER_MESSAGES.timeout);
    if (isAbort(error)) throw error;
    throw new ReaderError("network", READER_MESSAGES.network);
  }
  try {
    if (response.status === 429)
      throw new ReaderError("rate_limited", READER_MESSAGES.rate_limited);
    if (!response.ok) throw new ReaderError("blocked", READER_MESSAGES.blocked);
    const parsed = parseReaderOutput(await response.text());
    if (parsed.text.length < MIN_CONTENT) throw new ReaderError("blocked", READER_MESSAGES.blocked);
    return { ...parsed, ms: performance.now() - started };
  } catch (error) {
    if (isAbort(error) && timeout.timedOut())
      throw new ReaderError("timeout", READER_MESSAGES.timeout);
    throw error;
  } finally {
    timeout.done();
  }
}

import * as cheerio from 'cheerio';

export interface ScrapeResult {
  markdown: string;
  title?: string;
  charCount: number;
  estimatedTokens: number;
  durationMs: number;
  source: 'jina' | 'cheerio' | 'raw-text';
  error?: string;
}

const MAX_CHAR_BUDGET = 15000;

/**
 * Higieniza o texto bruto e remove sequências repetidas de quebras de linha e espaços.
 */
function sanitizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Trunca o texto respeitando o teto de tokens, garantindo que o Hero e CTAs sejam preservados.
 */
function truncateToTokenBudget(text: string, maxChars: number = MAX_CHAR_BUDGET): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n\n[...conteúdo adicional da página truncado para otimização de contexto...]';
}

/**
 * Fallback semântico com Cheerio para extração direta de landing pages
 */
async function scrapeWithCheerio(url: string): Promise<{ markdown: string; title?: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Cheerio fetch falhou com status ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove elementos desnecessários que poluem a análise
  $('script, style, noscript, iframe, svg, nav, footer, header').remove();

  const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
  const metaDesc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

  const headings: string[] = [];
  $('h1, h2, h3').each((_, el) => {
    const tag = el.tagName.toUpperCase();
    const text = $(el).text().trim();
    if (text) headings.push(`### ${tag}: ${text}`);
  });

  const ctas: string[] = [];
  $('a, button').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2 && text.length < 50) {
      if (/comprar|assinar|teste|grátis|começar|adquirir|inscreva|quero|acessar|demo/i.test(text)) {
        ctas.push(`- Botão CTA detectado: "${text}"`);
      }
    }
  });

  // Parágrafos principais
  const paragraphs: string[] = [];
  $('p, li').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 25) {
      paragraphs.push(text);
    }
  });

  let markdown = title ? `# ${title}\n\n` : '';
  if (metaDesc) markdown += `> Resumo/Meta: ${metaDesc}\n\n`;

  if (headings.length > 0) {
    markdown += `## Estrutura de Títulos da Página:\n${headings.join('\n')}\n\n`;
  }

  if (ctas.length > 0) {
    markdown += `## Chamadas para Ação (CTAs):\n${Array.from(new Set(ctas)).slice(0, 8).join('\n')}\n\n`;
  }

  if (paragraphs.length > 0) {
    markdown += `## Conteúdo Textual Principal:\n${paragraphs.slice(0, 30).join('\n\n')}\n`;
  }

  return { markdown, title: title || undefined };
}

/**
 * Função principal de extração de conteúdo
 */
export async function scrapeLandingPage(input: string): Promise<ScrapeResult> {
  const startTime = performance.now();

  // Se o input não começar com http/https, tratamos como texto de copy colado diretamente pelo usuário
  if (!input.trim().startsWith('http://') && !input.trim().startsWith('https://')) {
    const sanitized = sanitizeText(input);
    const truncated = truncateToTokenBudget(sanitized);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      markdown: truncated,
      charCount: truncated.length,
      estimatedTokens: Math.round(truncated.length / 4),
      durationMs,
      source: 'raw-text',
    };
  }

  const url = input.trim();

  // Tentativa 1: Jina Reader API (r.jina.ai)
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const jinaRes = await fetch(jinaUrl, {
      headers: {
        Accept: 'text/markdown, text/plain',
        'X-Timeout': '8',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (jinaRes.ok) {
      const rawMarkdown = await jinaRes.text();
      if (rawMarkdown && rawMarkdown.trim().length > 100) {
        const titleMatch = rawMarkdown.match(/^Title:\s*(.+)$/m)?.[1]?.trim();
        const sanitized = sanitizeText(rawMarkdown);
        const truncated = truncateToTokenBudget(sanitized);
        const durationMs = Math.round(performance.now() - startTime);

        return {
          markdown: truncated,
          title: titleMatch || undefined,
          charCount: truncated.length,
          estimatedTokens: Math.round(truncated.length / 4),
          durationMs,
          source: 'jina',
        };
      }
    }
  } catch (jinaErr) {
    console.warn('[Scraper] Jina Reader API falhou ou expirou, acionando fallback Cheerio...', jinaErr);
  }

  // Tentativa 2: Fallback direto com Cheerio
  try {
    const cheerioResult = await scrapeWithCheerio(url);
    const sanitized = sanitizeText(cheerioResult.markdown);
    const truncated = truncateToTokenBudget(sanitized);
    const durationMs = Math.round(performance.now() - startTime);

    return {
      markdown: truncated,
      title: cheerioResult.title,
      charCount: truncated.length,
      estimatedTokens: Math.round(truncated.length / 4),
      durationMs,
      source: 'cheerio',
    };
  } catch (cheerioErr) {
    const durationMs = Math.round(performance.now() - startTime);
    const errorMsg = cheerioErr instanceof Error ? cheerioErr.message : String(cheerioErr);

    return {
      markdown: `Não foi possível extrair a página automaticamente da URL: ${url}. Erro: ${errorMsg}`,
      charCount: 0,
      estimatedTokens: 0,
      durationMs,
      source: 'cheerio',
      error: errorMsg,
    };
  }
}


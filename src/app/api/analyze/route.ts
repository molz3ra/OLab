import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scrapeLandingPage } from '@/lib/scraper';
import { getPersonasByIds, buildCustomPersona, PersonaArchetype } from '@/lib/personas';
import { runSyntheticFocusGroup } from '@/lib/analyzer';
import { AnalysisResponse } from '@/types/analysis';

const RequestSchema = z.object({
  input: z.string().min(3, 'A URL ou texto da página é obrigatório.'),
  niche: z.string().default('SaaS B2B'),
  personaIds: z.array(z.string()).min(1).default(['cfo-skeptic', 'dev-senior', 'busy-smb']),
  apiKey: z.string().optional(),
  customPersona: z
    .object({
      name: z.string(),
      role: z.string(),
      skepticismLevel: z.number().min(1).max(10),
      mainPain: z.string(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const overallStart = performance.now();

  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos na requisição', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { input, niche, personaIds, customPersona, apiKey: bodyApiKey } = parsed.data;

    // Resolução da chave do Gemini: cabeçalho HTTP > corpo JSON > variáveis de ambiente
    const headerApiKey = req.headers.get('x-gemini-api-key');
    const effectiveApiKey =
      headerApiKey?.trim() ||
      bodyApiKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
      undefined;

    // Etapa 1: Scraping e sanitização
    const scrapeResult = await scrapeLandingPage(input);

    // Etapa 2: Resolução das personas
    const selectedPersonas: PersonaArchetype[] = getPersonasByIds(personaIds);
    if (customPersona) {
      selectedPersonas.push(
        buildCustomPersona({
          id: `custom-${Date.now()}`,
          name: customPersona.name,
          role: customPersona.role,
          skepticismLevel: customPersona.skepticismLevel,
          mainPain: customPersona.mainPain,
        })
      );
    }

    // Etapa 3: Execução paralela dos agentes e consolidação
    const isUrl = input.trim().startsWith('http://') || input.trim().startsWith('https://');
    const { report, parallelDurationMs, consolidationDurationMs, modelUsed } = await runSyntheticFocusGroup({
      pageContent: scrapeResult.markdown,
      personas: selectedPersonas,
      niche,
      url: isUrl ? input.trim() : undefined,
      apiKey: effectiveApiKey,
    });

    const totalExecutionTimeMs = Math.round(performance.now() - overallStart);

    const responsePayload: AnalysisResponse = {
      report,
      telemetry: {
        scrapeTimeMs: scrapeResult.durationMs,
        parallelPersonasTimeMs: parallelDurationMs,
        consolidationTimeMs: consolidationDurationMs,
        totalExecutionTimeMs,
        rawCharCount: scrapeResult.charCount,
        estimatedTokensUsed: scrapeResult.estimatedTokens,
        modelUsed,
        scrapedMarkdownPreview: scrapeResult.markdown.substring(0, 1500) + '...',
      },
    };

    return NextResponse.json(responsePayload);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API /analyze] Erro capturado no pipeline:', errorMsg);

    // Se o erro for de autenticação ou cota da API da Google
    const isAuthError =
      /api key|permission|unauthorized|quota|resource exhausted/i.test(errorMsg);

    return NextResponse.json(
      {
        error: isAuthError
          ? 'Erro de autenticação ou cota no Google Gemini'
          : 'Falha ao processar a auditoria do Focus Group.',
        message: errorMsg,
      },
      { status: isAuthError ? 401 : 500 }
    );
  }
}

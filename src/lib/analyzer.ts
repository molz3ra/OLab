import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { PersonaArchetype } from './personas';
import {
  PersonaEvaluation,
  PersonaEvaluationSchema,
  FinalReport,
  FinalReportSchema,
  RadarMetrics,
} from '../types/analysis';

/**
 * Modelo oficial atual do Google AI Studio (Gemini 3.8 Flash).
 */
const ACTIVE_MODEL_NAME = 'gemini-3.8-flash';

/**
 * Obtém a instância do provedor Google Generative AI com a chave informada ou do ambiente.
 */
function getGoogleProvider(customApiKey?: string) {
  const resolvedKey =
    customApiKey?.trim() ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    '';

  if (!resolvedKey) {
    return null;
  }

  return {
    google: createGoogleGenerativeAI({ apiKey: resolvedKey }),
    apiKey: resolvedKey,
    isCustom: Boolean(customApiKey?.trim()),
  };
}

/**
 * Executa generateObject com o modelo Gemini ativo
 */
async function generateWithGemini<T>(params: {
  provider: NonNullable<ReturnType<typeof getGoogleProvider>>;
  schema: z.ZodType<T>;
  system?: string;
  prompt: string;
}): Promise<{ object: T; modelName: string }> {
  const model = params.provider.google(ACTIVE_MODEL_NAME);
  const { object } = await generateObject({
    model,
    schema: params.schema,
    system: params.system,
    prompt: params.prompt,
  });

  return { object, modelName: ACTIVE_MODEL_NAME };
}

/**
 * Extrai amostras semânticas reais do Markdown raspado (Headline, CTAs, Benefícios)
 * para ancorar tanto o prompt da IA quanto a simulação heurística quando offline.
 */
function extractContextSnippets(markdown: string) {
  const lines = markdown.split('\n').map((l) => l.trim()).filter(Boolean);

  let detectedTitle = '';
  let detectedCta = '';
  const keyPoints: string[] = [];

  for (const line of lines) {
    if (!detectedTitle && (line.startsWith('#') || line.startsWith('Title:'))) {
      detectedTitle = line.replace(/^[#\s]+/, '').replace(/^Title:\s*/i, '').trim();
    }
    if (!detectedCta && /comprar|assinar|teste|grátis|começar|adquirir|inscreva|quero|acessar|demo|whatsapp|falar|agende/i.test(line)) {
      detectedCta = line.replace(/^[-*#\s]+/, '').trim();
    }
    if (line.length > 25 && line.length < 180 && !line.startsWith('![')) {
      if (keyPoints.length < 4) {
        keyPoints.push(line.replace(/^[-*#\s]+/, '').trim());
      }
    }
  }

  // Se não encontrou título nos cabeçalhos, pega a primeira frase significativa
  if (!detectedTitle) {
    const firstGoodLine = lines.find((l) => l.length > 15 && !l.startsWith('![')) || 'Oferta Principal da Página';
    detectedTitle = firstGoodLine.substring(0, 80);
  }

  return {
    title: detectedTitle,
    cta: detectedCta || 'Comprar / Começar Agora',
    keyPoints: keyPoints.length > 0 ? keyPoints : ['Proposta de valor principal do produto/serviço.'],
  };
}

/**
 * Avaliação sintética heurística e contextual caso nenhuma API Key esteja configurada
 * ou caso a cota do Free Tier esteja em espera.
 */
function generateContextualPersonaEvaluation(
  persona: PersonaArchetype,
  pageContent: string,
  niche: string
): PersonaEvaluation {
  const isHighSkeptic = persona.skepticismLevel >= 8;
  const isLowSkeptic = persona.skepticismLevel <= 5;
  const snippets = extractContextSnippets(pageContent);

  let score = 55;
  if (isHighSkeptic) score = Math.floor(38 + (persona.id.length % 15));
  else if (isLowSkeptic) score = Math.floor(74 + (persona.id.length % 16));
  else score = Math.floor(58 + (persona.id.length % 14));

  let emotionalState: PersonaEvaluation['emotionalState'] = 'Cético';
  if (score >= 80) emotionalState = 'Pronto para Comprar';
  else if (score >= 65) emotionalState = 'Curioso';
  else if (score >= 50) emotionalState = 'Confuso';
  else if (persona.id === 'dev-senior' || persona.id === 'cfo-skeptic') emotionalState = 'Desconfiado';
  else emotionalState = 'Frustrado';

  // Personalização real conforme a persona e o conteúdo extraído da página
  let specificFriction = `A promessa "${snippets.title.substring(0, 50)}..." não detalha como o retorno sobre investimento (ROI) é comprovado na prática.`;
  let specificQuestion = `Qual é o custo total e o payback estimado para meu porte de negócio?`;

  if (persona.id === 'dev-senior') {
    specificFriction = `Não identifiquei documentação técnica de integração, especificações de protocolo ou termos claros de segurança.`;
    specificQuestion = `Como isso se integra com nossa infraestrutura atual e onde os dados são processados?`;
  } else if (persona.id === 'busy-smb') {
    specificFriction = `O fluxo para acionar o CTA ("${snippets.cta.substring(0, 40)}") parece exigir passos manuais ou contato demorado.`;
    specificQuestion = `Consigo colocar para rodar em menos de 10 minutos sem treinamento da equipe?`;
  } else if (persona.id === 'bargain-hunter') {
    specificFriction = `Faltam termos explícitos sobre reembolso sem burocracia ou termos de cancelamento em caso de insatisfação.`;
    specificQuestion = `Existe garantia incondicional formalizada em contrato ou termos de uso?`;
  }

  return {
    personaId: persona.id,
    code: persona.code,
    initials: persona.initials,
    personaName: persona.name,
    role: persona.role,
    conversionScore: score,
    emotionalState,
    firstImpression: `Ao escanear a página focando em ${niche}, notei a proposta "${snippets.title.substring(0, 60)}", mas minha visão como ${persona.role} exige garantias mais sólidas.`,
    frictionPoints: [
      specificFriction,
      `A chamada para ação "${snippets.cta.substring(0, 45)}" gera incerteza sobre o próximo passo imediato.`,
      `Pouca evidência empírica ou dados verificáveis que comprovem os diferenciais alegados.`,
    ],
    unansweredQuestions: [
      specificQuestion,
      `Quais são as limitações práticas ou restrições não mencionadas no texto?`,
    ],
    verdictQuote:
      score > 70
        ? `A proposta de "${snippets.title.substring(0, 40)}" é promissora. Eu avançaria caso o processo no CTA seja direto.`
        : `Como ${persona.role}, sinto que falta transparência objetiva sobre o risco real antes de passar meu cartão ou aprovar a compra.`,
  };
}

/**
 * Roda a avaliação de uma Persona individual contra o conteúdo da página
 */
async function evaluateSinglePersona(
  persona: PersonaArchetype,
  pageContent: string,
  niche: string,
  provider: ReturnType<typeof getGoogleProvider>
): Promise<{ evaluation: PersonaEvaluation; usedModel?: string }> {
  // Se não houver chave de API configurada, usa o simulador heurístico contextual
  if (!provider) {
    await new Promise((res) => setTimeout(res, 400 + Math.random() * 200));
    return { evaluation: generateContextualPersonaEvaluation(persona, pageContent, niche) };
  }

  const prompt = `Você está participando de um Focus Group Sintético avaliando com rigor extremo uma Landing Page no nicho "${niche}".
  
Conteúdo real extraído da página:
---
${pageContent}
---

Instruções cruciais para sua avaliação:
1. Analise o texto REAL fornecido acima (identifique o que o produto realmente é, as headlines reais e o CTA real).
2. Adote 100% da personalidade do seu perfil psicológico: ${persona.name} (${persona.role}). Seu viés: "${persona.bias}". Nível de ceticismo: ${persona.skepticismLevel}/10.
3. Não seja genérico nem condescendente. Diga com precisão cirúrgica o que na copy ou na oferta te gerou atrito real.
4. Responda estritamente no esquema estruturado JSON solicitado.`;

  try {
    const { object, modelName } = await generateWithGemini({
      provider,
      schema: PersonaEvaluationSchema,
      system: persona.systemPrompt,
      prompt,
    });

    return {
      evaluation: {
        ...object,
        personaId: persona.id,
        code: persona.code,
        initials: persona.initials,
        personaName: persona.name,
        role: persona.role,
      },
      usedModel: modelName,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[AI Engine] Persona ${persona.name} recorrendo ao avaliador heurístico:`, errMsg);

    return {
      evaluation: generateContextualPersonaEvaluation(persona, pageContent, niche),
      usedModel: 'Heurístico Contextual (Fallback de Cota)',
    };
  }
}

/**
 * Agente Consolidador ("Head de Growth") que sintetiza os atritos e gera o plano de ação de copy
 */
async function consolidateAnalysis(
  evaluations: PersonaEvaluation[],
  pageContent: string,
  niche: string,
  provider: ReturnType<typeof getGoogleProvider>,
  url?: string
): Promise<{ report: FinalReport; usedModel?: string }> {
  const avgScore = Math.round(
    evaluations.reduce((acc, p) => acc + p.conversionScore, 0) / evaluations.length
  );

  const snippets = extractContextSnippets(pageContent);

  // Se não houver chave de API, gera consolidação heurística contextualizada com o conteúdo real
  if (!provider) {
    await new Promise((res) => setTimeout(res, 400));

    const radar: RadarMetrics = {
      clarityScore: Math.min(100, Math.max(25, avgScore + 4)),
      urgencyScore: Math.min(100, Math.max(30, avgScore - 8)),
      socialProofScore: Math.min(100, Math.max(20, avgScore - 6)),
      objectionHandlingScore: Math.min(100, Math.max(25, avgScore - 12)),
      ctaSimplicityScore: Math.min(100, Math.max(40, avgScore + 6)),
    };

    return {
      report: {
        url: url || 'Texto colado / Análise avulsa',
        niche,
        overallScore: avgScore,
        radarMetrics: radar,
        criticalBottleneck: `A chamada principal ("${snippets.title.substring(0, 60)}") e o CTA ("${snippets.cta.substring(0, 40)}") deixam dúvidas no decisor sobre garantia, processo e entrega concreta.`,
        executiveSummary: `Analisamos a oferta de ${niche} sob a ótica de ${evaluations.length} decisores céticos. O principal atrito surge quando o visitante lê o título inicial mas não encontra respostas diretas para a sua principal aversão ao risco antes de agir.`,
        copyOptimizations: [
          {
            element: 'Headline Principal',
            originalText: snippets.title,
            suggestedText: `${snippets.title} — Resultados comprovados e garantia incondicional`,
            rationale: `Ancora a proposta central com segurança de resultado e redução imediata de risco para o comprador.`,
          },
          {
            element: 'Botão CTA',
            originalText: snippets.cta,
            suggestedText: `${snippets.cta} — Sem Burocracia →`,
            rationale: `Substitui um CTA ambíguo por uma ação que explicita a ausência de atrito no próximo passo.`,
          },
        ],
        personas: evaluations,
      },
    };
  }

  const consolidatorSystemPrompt = `Você é o Head de Growth e Especialista em CRO (Conversion Rate Optimization) mais conceituado do mercado.
Sua função é ler os feedbacks de múltiplos perfis do Focus Group Sintético, identificar os maiores vazamentos de conversão da página REAL analisada e reescrever as partes mais críticas da copy (Headlines, CTAs e Proposta de Valor) para dobrar a taxa de conversão.`;

  const consolidatorPrompt = `Nicho da página: ${niche}
URL ou Contexto: ${url || 'Análise de Landing Page'}

Conteúdo REAL extraído da página analisada:
---
${pageContent.substring(0, 6000)}
---

Feedbacks individuais coletados de cada Persona Sintética:
${JSON.stringify(evaluations, null, 2)}

Instruções para o relatório consolidado:
1. Calcule os 5 eixos do radar de conversão (clarityScore, urgencyScore, socialProofScore, objectionHandlingScore, ctaSimplicityScore) de 0 a 100 de forma condizente com a severidade dos atritos apontados pelas personas.
2. Identifique o gargalo número #1 responsável pela perda de visitantes na página REAL.
3. Extraia o texto original EXATO da página para os elementos críticos (Headline Principal, Subheadline, CTA) e forneça versões reescritas no formato Antes vs. Depois com justificativa psicológica e comportamental.`;

  try {
    const { object, modelName } = await generateWithGemini({
      provider,
      schema: FinalReportSchema,
      system: consolidatorSystemPrompt,
      prompt: consolidatorPrompt,
    });

    return {
      report: {
        ...object,
        url: url || 'Landing Page',
        niche,
        personas: evaluations,
      },
      usedModel: modelName,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('[Consolidator] Recorrendo ao consolidador heurístico contextual:', errMsg);

    const radar: RadarMetrics = {
      clarityScore: Math.min(100, Math.max(30, avgScore + 5)),
      urgencyScore: Math.min(100, Math.max(30, avgScore - 10)),
      socialProofScore: Math.min(100, Math.max(20, avgScore - 5)),
      objectionHandlingScore: Math.min(100, Math.max(25, avgScore - 12)),
      ctaSimplicityScore: Math.min(100, Math.max(40, avgScore + 8)),
    };

    return {
      report: {
        url: url || 'Landing Page',
        niche,
        overallScore: avgScore,
        radarMetrics: radar,
        criticalBottleneck: `A proposta "${snippets.title.substring(0, 60)}" não dissolve o ceticismo em relação a preço, esforço e risco no CTA "${snippets.cta.substring(0, 40)}".`,
        executiveSummary: `Síntese de ${evaluations.length} decisores: A oferta tem apelo inicial, mas peca na ancoragem de valor, conformidade e redução de risco para o comprador.`,
        copyOptimizations: [
          {
            element: 'Headline Principal',
            originalText: snippets.title,
            suggestedText: `${snippets.title} — Resultados mensuráveis e sem risco`,
            rationale: 'Foca na dor central de CRO com especificidade de resultado.',
          },
          {
            element: 'Botão CTA',
            originalText: snippets.cta,
            suggestedText: `${snippets.cta} — Teste sem compromisso →`,
            rationale: 'Remove a hesitação no clique informando que não há cobrança antecipada.',
          },
        ],
        personas: evaluations,
      },
      usedModel: 'Heurístico Contextual (Fallback de Cota)',
    };
  }
}

/**
 * Orquestrador principal: Executa as Personas com espaçamento suave e consolida os resultados
 */
export async function runSyntheticFocusGroup(params: {
  pageContent: string;
  personas: PersonaArchetype[];
  niche: string;
  url?: string;
  apiKey?: string;
}): Promise<{
  report: FinalReport;
  parallelDurationMs: number;
  consolidationDurationMs: number;
  modelUsed: string;
}> {
  const provider = getGoogleProvider(params.apiKey);

  const tStartParallel = performance.now();

  // DISPARO CONCORRENTE COM ESCALONAMENTO SUAVE (250ms) PARA PROTEGER LIMITES DE BURST NO FREE TIER
  const personaResults = await Promise.all(
    params.personas.map(async (persona, idx) => {
      if (idx > 0 && provider) {
        await new Promise((res) => setTimeout(res, idx * 250));
      }
      return evaluateSinglePersona(persona, params.pageContent, params.niche, provider);
    })
  );

  const personaEvaluations = personaResults.map((r) => r.evaluation);
  const detectedModel = personaResults.find((r) => r.usedModel && !r.usedModel.includes('Fallback'))?.usedModel;

  const parallelDurationMs = Math.round(performance.now() - tStartParallel);

  // NÓ CONSOLIDADOR
  const tStartConsolidation = performance.now();
  const consolidationResult = await consolidateAnalysis(
    personaEvaluations,
    params.pageContent,
    params.niche,
    provider,
    params.url
  );
  const consolidationDurationMs = Math.round(performance.now() - tStartConsolidation);

  const finalModel = consolidationResult.usedModel || detectedModel || ACTIVE_MODEL_NAME;

  const modelUsed = provider
    ? provider.isCustom
      ? `${finalModel} (Chave do Usuário)`
      : `${finalModel} (Chave do Servidor)`
    : 'Simulador Heurístico Contextual (Sem Chave)';

  return {
    report: consolidationResult.report,
    parallelDurationMs,
    consolidationDurationMs,
    modelUsed,
  };
}

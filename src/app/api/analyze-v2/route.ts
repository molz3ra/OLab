import { NextRequest, NextResponse } from 'next/server';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';

const ALLOWED_GEMINI_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]);

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido.', code: 'invalid_payload' },
        { status: 400 }
      );
    }

    const { body, model = 'gemini-2.0-flash' } = payload;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Parâmetro body é obrigatório e deve ser um objeto estruturado.', code: 'missing_body' },
        { status: 400 }
      );
    }

    if (typeof model !== 'string' || !ALLOWED_GEMINI_MODELS.has(model)) {
      return NextResponse.json(
        {
          error: `Modelo de IA não suportado ou inválido. Modelos aceitos: ${Array.from(ALLOWED_GEMINI_MODELS).join(', ')}`,
          code: 'invalid_model',
        },
        { status: 400 }
      );
    }

    // Resolução da chave: cabeçalho do cliente (BYOK) > variáveis de ambiente do servidor
    const headerKey =
      req.headers.get('x-goog-api-key') || req.headers.get('x-gemini-api-key');
    const apiKey =
      headerKey?.trim() ||
      process.env.GEMINI_API_KEY?.trim() ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Nenhuma chave do Google Gemini foi fornecida. Por favor, adicione sua chave pessoal no diálogo "Traga sua própria chave" ou configure GEMINI_API_KEY no servidor.',
          code: 'invalid_key',
        },
        { status: 401 }
      );
    }

    // Regra 12: Timeout rígido em APIs externas para evitar que a requisição fique travada indefinidamente
    const response = await fetch(`${API}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45000),
    });

    const responseText = await response.text();

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[/api/analyze-v2] Erro ao comunicar com o Google Gemini:', error);
    return NextResponse.json(
      {
        error: 'Falha ao processar análise no servidor.',
        code: 'network',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


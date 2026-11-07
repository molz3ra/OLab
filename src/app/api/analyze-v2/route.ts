import { NextRequest, NextResponse } from 'next/server';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { body, model = 'gemini-2.0-flash' } = payload;

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

    const response = await fetch(`${API}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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


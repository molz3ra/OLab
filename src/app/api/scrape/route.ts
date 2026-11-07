import { NextRequest, NextResponse } from 'next/server';
import { scrapeLandingPage } from '@/lib/scraper';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Parâmetro url é obrigatório' }, { status: 400 });
  }

  try {
    const result = await scrapeLandingPage(url);
    return NextResponse.json({
      text: result.markdown,
      title: result.title,
      ms: result.durationMs,
    });
  } catch (error) {
    console.error('[/api/scrape] Erro:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao raspar a página',
      },
      { status: 500 }
    );
  }
}


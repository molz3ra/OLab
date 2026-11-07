import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveUserReport, saveUserPersona, getUserReports, getUserPersonas } from "@/lib/db";
import type { Report, Persona } from "@/lib/lab";

const MAX_REPORTS_PER_SYNC = 100;
const MAX_PERSONAS_PER_SYNC = 50;
const MAX_ITEM_SIZE_BYTES = 500 * 1024; // 500 KB

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = (await req.json()) as { reports?: Report[]; personas?: Persona[] };

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    if (Array.isArray(body.reports) && body.reports.length > MAX_REPORTS_PER_SYNC) {
      return NextResponse.json(
        { error: `Limite excedido: máximo de ${MAX_REPORTS_PER_SYNC} relatórios por sincronização.` },
        { status: 400 }
      );
    }

    if (Array.isArray(body.personas) && body.personas.length > MAX_PERSONAS_PER_SYNC) {
      return NextResponse.json(
        { error: `Limite excedido: máximo de ${MAX_PERSONAS_PER_SYNC} personas por sincronização.` },
        { status: 400 }
      );
    }

    let syncedReports = 0;
    let syncedPersonas = 0;

    if (Array.isArray(body.reports)) {
      for (const report of body.reports) {
        if (report && report.id && report.summary) {
          if (JSON.stringify(report).length <= MAX_ITEM_SIZE_BYTES) {
            saveUserReport(userId, report);
            syncedReports++;
          }
        }
      }
    }

    if (Array.isArray(body.personas)) {
      for (const persona of body.personas) {
        if (persona && persona.id && persona.name) {
          if (JSON.stringify(persona).length <= MAX_ITEM_SIZE_BYTES) {
            saveUserPersona(userId, persona);
            syncedPersonas++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedReports,
      syncedPersonas,
      allReports: getUserReports(userId),
      allPersonas: getUserPersonas(userId),
    });
  } catch (error) {
    console.error("[/api/user/sync] Erro ao sincronizar dados:", error);
    return NextResponse.json(
      { error: "Falha na sincronização", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const reports = getUserReports(userId);
    const personas = getUserPersonas(userId);

    return NextResponse.json({
      reports,
      personas,
    });
  } catch (error) {
    console.error("[/api/user/sync GET] Erro ao carregar dados:", error);
    return NextResponse.json(
      { error: "Falha ao buscar dados", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


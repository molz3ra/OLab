import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveUserReport, saveUserPersona, getUserReports, getUserPersonas } from "@/lib/db";
import type { Report, Persona } from "@/lib/lab";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = (await req.json()) as { reports?: Report[]; personas?: Persona[] };

    let syncedReports = 0;
    let syncedPersonas = 0;

    if (Array.isArray(body.reports)) {
      for (const report of body.reports) {
        if (report && report.id && report.summary) {
          saveUserReport(userId, report);
          syncedReports++;
        }
      }
    }

    if (Array.isArray(body.personas)) {
      for (const persona of body.personas) {
        if (persona && persona.id && persona.name) {
          saveUserPersona(userId, persona);
          syncedPersonas++;
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

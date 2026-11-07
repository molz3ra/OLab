import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteEntireUserAccount } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    await deleteEntireUserAccount(userId);

    const res = NextResponse.json({
      success: true,
      message: "Conta e dados excluídos definitivamente em conformidade com o Art. 18, VI da LGPD.",
    });

    // Remove cookie de autenticação
    res.cookies.delete("better-auth.session_token");

    return res;
  } catch (error) {
    console.error("[/api/user/delete] Erro ao excluir conta:", error);
    return NextResponse.json(
      { error: "Falha ao excluir a conta", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}


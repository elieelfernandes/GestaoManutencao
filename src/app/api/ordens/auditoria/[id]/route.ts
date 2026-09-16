import { NextResponse } from 'next/server';
import sql from '../../../../../utils/db';
import { ensureAuthAndAuditTablesExist } from '../../../../../utils/auth';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ timeline: [] });
  }

  try {
    await ensureAuthAndAuditTablesExist();
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID da ordem é obrigatório.' }, { status: 400 });
    }

    const timeline = await sql`
      SELECT 
        id, 
        ordem_id AS "ordemId", 
        usuario_id AS "usuarioId", 
        usuario_nome AS "usuarioNome", 
        usuario_login AS "usuarioLogin", 
        tipo_acao AS "tipoAcao", 
        descricao_acao AS "descricaoAcao", 
        detalhes_alteracao AS "detalhesAlteracao", 
        TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') AS "dataHoraFormatada",
        created_at AS "createdAt"
      FROM ordens_auditoria
      WHERE ordem_id = ${id}::uuid
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ timeline });
  } catch (err: any) {
    console.error('API GET /api/ordens/auditoria/[id] Error:', err);
    return NextResponse.json({ error: err.message || 'Falha ao buscar histórico de auditoria.' }, { status: 500 });
  }
}

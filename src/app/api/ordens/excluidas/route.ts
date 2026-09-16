import { NextResponse } from 'next/server';
import sql from '../../../../utils/db';
import { mapDbStatusToUi } from '../../../../utils/helpers';
import { ensureAuthAndAuditTablesExist } from '../../../../utils/auth';

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ records: [] });
  }

  try {
    await ensureAuthAndAuditTablesExist();

    const recordsResult = await sql`
      SELECT 
        o.id, 
        TO_CHAR(o.data_solicitacao, 'YYYY-MM-DD') AS "dataSolicitacaoStr", 
        o.hora_solicitacao AS "horaSolicitacao", 
        o.setor, 
        o.descricao, 
        o.tipo_manutencao AS "tipoManutencao", 
        o.responsavel, 
        o.area_tecnica AS "areaTecnica", 
        o.prioridade, 
        o.status AS "statusDbOriginal",
        o.motivo_exclusao AS "motivoExclusao",
        TO_CHAR(o.excluido_em, 'DD/MM/YYYY HH24:MI') AS "excluidoEmFormatado",
        o.excluido_em AS "excluidoEm",
        u.nome AS "excluidoPorNome",
        u.login AS "excluidoPorLogin"
      FROM ordens_servico o
      LEFT JOIN usuarios_sistema u ON o.excluido_por_id = u.id
      WHERE o.excluido_em IS NOT NULL
      ORDER BY o.excluido_em DESC
    `;

    const mappedRecords = recordsResult.map((r: any) => ({
      ...r,
      statusOriginal: mapDbStatusToUi(r.statusDbOriginal)
    }));

    return NextResponse.json({ records: mappedRecords });
  } catch (err: any) {
    console.error('API GET /api/ordens/excluidas Error:', err);
    return NextResponse.json({ error: err.message || 'Falha ao buscar ordens excluídas.' }, { status: 500 });
  }
}

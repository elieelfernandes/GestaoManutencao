import { NextResponse } from 'next/server';
import sql from '../../../utils/db';
import { MaintenanceRecord } from '../../../types';
import { mapUiStatusToDb, mapDbStatusToUi } from '../../../utils/helpers';
import { getCurrentUser, logOrdemAuditoria, ensureAuthAndAuditTablesExist } from '../../../utils/auth';

// GET: Fetch all active Service Orders (Excludes soft-deleted ones)
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
        o.responsavel_id AS "responsavelId",
        u.nome AS "responsavelNome",
        o.area_tecnica AS "areaTecnica", 
        o.prioridade, 
        TO_CHAR(o.prazo_execucao, 'YYYY-MM-DD') AS "prazoExecucaoStr", 
        TO_CHAR(o.data_execucao, 'YYYY-MM-DD') AS "dataExecucaoStr", 
        o.horario_inicio AS "horarioInicio", 
        o.horario_termino AS "horarioTermino", 
        o.observacao,
        CASE 
          WHEN o.status != 'CONCLUIDO' AND o.prazo_execucao IS NOT NULL AND o.prazo_execucao < CURRENT_DATE THEN 'ATRASADO'
          ELSE o.status
        END AS status,
        o.created_at AS "createdAt"
      FROM ordens_servico o
      LEFT JOIN usuarios_sistema u ON o.responsavel_id = u.id
      WHERE o.excluido_em IS NULL
      ORDER BY o.data_solicitacao DESC, o.created_at DESC
    `;

    // Map database enums to UI labels
    const mappedRecords = recordsResult.map((r: any) => ({
      ...r,
      status: mapDbStatusToUi(r.status)
    }));

    return NextResponse.json({ records: mappedRecords });
  } catch (err: any) {
    console.error('API GET /api/ordens Error:', err);
    return NextResponse.json({ error: err.message || 'Falha ao buscar Ordens de Serviço' }, { status: 500 });
  }
}

// POST: Open a new Service Order with audit logging
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    await ensureAuthAndAuditTablesExist();
    const user = await getCurrentUser();

    const body = await request.json();
    const dataSolicitacao = body.dataSolicitacaoStr || body.dataStr;
    const { 
      horaSolicitacao, setor, descricao, tipoManutencao, 
      responsavel, responsavelId, areaTecnica, prioridade, prazoExecucaoStr, observacao 
    } = body;

    if (!dataSolicitacao || !setor || !descricao || !tipoManutencao || !responsavel || !areaTecnica || !prioridade) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Data, Setor, Descrição, Tipo, Responsável, Área Técnica e Prioridade são exigidos.' },
        { status: 400 }
      );
    }

    const dataSolDate = dataSolicitacao ? dataSolicitacao : new Date().toISOString().split('T')[0];
    const prazoExecDate = prazoExecucaoStr && prazoExecucaoStr.trim() !== '' ? prazoExecucaoStr : null;

    // Resolve responsavel_id if passed or lookup from usuarios_sistema by name
    let finalResponsavelId = responsavelId || null;
    let finalResponsavelNome = responsavel;

    if (!finalResponsavelId && responsavel) {
      const foundUser = await sql`
        SELECT id, nome FROM usuarios_sistema 
        WHERE LOWER(nome) = LOWER(${responsavel}) OR LOWER(login) = LOWER(${responsavel})
        LIMIT 1
      `;
      if (foundUser.length > 0) {
        finalResponsavelId = foundUser[0].id;
        finalResponsavelNome = foundUser[0].nome;
      }
    }

    const result = await sql`
      INSERT INTO ordens_servico (
        data_solicitacao, hora_solicitacao, setor, descricao, tipo_manutencao, 
        responsavel, responsavel_id, area_tecnica, prioridade, prazo_execucao, observacao, status
      ) VALUES (
        ${dataSolDate}, ${horaSolicitacao || ''}, ${setor}, ${descricao}, ${tipoManutencao},
        ${finalResponsavelNome}, ${finalResponsavelId}, ${areaTecnica}, ${prioridade}, ${prazoExecDate}, ${observacao || ''}, 'NAO_INICIADO'
      )
      RETURNING id
    `;

    const newId = result[0]?.id;

    // Record creation audit log
    if (newId) {
      await logOrdemAuditoria({
        ordemId: newId,
        user,
        tipoAcao: 'CRIACAO',
        descricaoAcao: `Ordem de Serviço criada para o setor "${setor}" sob responsabilidade de "${finalResponsavelNome}".`,
        detalhesAlteracao: {
          descricao,
          setor,
          tipoManutencao,
          responsavel: finalResponsavelNome,
          prioridade,
          prazoExecucao: prazoExecDate
        }
      });
    }

    return NextResponse.json({ success: true, id: newId });
  } catch (err: any) {
    console.error('API POST /api/ordens Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar Ordem de Serviço.' }, { status: 500 });
  }
}

// PUT: Edit / Dar Baixa in a Service Order with audit logging
export async function PUT(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    await ensureAuthAndAuditTablesExist();
    const user = await getCurrentUser();

    const body: MaintenanceRecord = await request.json();
    const { id, dataExecucaoStr, horarioInicio, horarioTermino, observacao, status, responsavel } = body;

    if (!id) {
      return NextResponse.json({ error: 'O ID da Ordem de Serviço é obrigatório para atualização.' }, { status: 400 });
    }

    // Fetch previous order state for audit comparison
    const previous = await sql`
      SELECT status, responsavel, data_execucao, observacao, setor, descricao 
      FROM ordens_servico 
      WHERE id = ${id}::uuid AND excluido_em IS NULL
    `;

    if (previous.length === 0) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada ou já excluída.' }, { status: 404 });
    }

    const prevOrder = previous[0];
    const dataExecDate = dataExecucaoStr && dataExecucaoStr.trim() !== '' ? dataExecucaoStr : null;
    const dbStatus = mapUiStatusToDb(status);

    // Resolve responsavel_id
    let finalResponsavelId = null;
    let finalResponsavelNome = responsavel || prevOrder.responsavel;
    if (responsavel) {
      const foundUser = await sql`
        SELECT id, nome FROM usuarios_sistema 
        WHERE LOWER(nome) = LOWER(${responsavel}) OR LOWER(login) = LOWER(${responsavel})
        LIMIT 1
      `;
      if (foundUser.length > 0) {
        finalResponsavelId = foundUser[0].id;
        finalResponsavelNome = foundUser[0].nome;
      }
    }

    await sql`
      UPDATE ordens_servico SET
        status = ${dbStatus},
        responsavel = ${finalResponsavelNome},
        responsavel_id = ${finalResponsavelId || sql`responsavel_id`},
        data_execucao = ${dataExecDate},
        horario_inicio = ${horarioInicio || ''},
        horario_termino = ${horarioTermino || ''},
        observacao = ${observacao || ''}
      WHERE id = ${id}::uuid
    `;

    // Determine audit action type & description
    let tipoAcao: 'BAIXA' | 'ALTERACAO_STATUS' | 'EDICAO' = 'EDICAO';
    let descricaoAcao = `Ordem de Serviço atualizada.`;

    const prevUiStatus = mapDbStatusToUi(prevOrder.status);
    const newUiStatus = status;

    if (newUiStatus === 'Concluído' && prevUiStatus !== 'Concluído') {
      tipoAcao = 'BAIXA';
      descricaoAcao = `Serviço concluído e baixa realizada por ${user?.nome || 'usuário'} em ${dataExecDate || 'hoje'}.`;
    } else if (prevUiStatus !== newUiStatus) {
      tipoAcao = 'ALTERACAO_STATUS';
      descricaoAcao = `Status alterado de "${prevUiStatus}" para "${newUiStatus}".`;
    }

    await logOrdemAuditoria({
      ordemId: id,
      user,
      tipoAcao,
      descricaoAcao,
      detalhesAlteracao: {
        statusAnterior: prevUiStatus,
        statusNovo: newUiStatus,
        responsavelAnterior: prevOrder.responsavel,
        responsavelNovo: finalResponsavelNome,
        dataExecucao: dataExecDate,
        observacao: observacao || ''
      }
    });

    return NextResponse.json({ success: true, updatedId: id });
  } catch (err: any) {
    console.error('API PUT /api/ordens Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao atualizar Ordem de Serviço.' }, { status: 500 });
  }
}

// DELETE: Soft-delete a Service Order preserving original status with mandatory reason
export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    await ensureAuthAndAuditTablesExist();
    const user = await getCurrentUser();

    const body = await request.json();
    const { id, motivoExclusao } = body;

    if (!id) {
      return NextResponse.json({ error: 'O ID da Ordem de Serviço é obrigatório.' }, { status: 400 });
    }

    if (!motivoExclusao || String(motivoExclusao).trim().length < 3) {
      return NextResponse.json({ error: 'O Motivo da Exclusão é obrigatório para registrar o histórico.' }, { status: 400 });
    }

    // Fetch existing order to preserve its original status in audit
    const existing = await sql`
      SELECT id, status, setor, descricao, responsavel 
      FROM ordens_servico 
      WHERE id = ${id}::uuid AND excluido_em IS NULL
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada ou já excluída.' }, { status: 404 });
    }

    const order = existing[0];
    const cleanMotivo = String(motivoExclusao).trim();

    // Soft delete: SET excluido_em, excluido_por_id, motivo_exclusao (DO NOT OVERWRITE status!)
    await sql`
      UPDATE ordens_servico SET
        excluido_em = NOW(),
        excluido_por_id = ${user?.id || null},
        motivo_exclusao = ${cleanMotivo}
      WHERE id = ${id}::uuid
    `;

    // Record deletion in audit log
    await logOrdemAuditoria({
      ordemId: id,
      user,
      tipoAcao: 'EXCLUSAO',
      descricaoAcao: `Ordem excluída por ${user?.nome || 'usuário'}. Motivo: "${cleanMotivo}".`,
      detalhesAlteracao: {
        statusOriginal: mapDbStatusToUi(order.status),
        motivoExclusao: cleanMotivo,
        setor: order.setor,
        descricao: order.descricao
      }
    });

    return NextResponse.json({ success: true, deletedId: id, message: 'Ordem de Serviço excluída com sucesso.' });
  } catch (err: any) {
    console.error('API DELETE /api/ordens Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir Ordem de Serviço.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import sql from '../../../utils/db';
import { MaintenanceRecord } from '../../../types';
import { mapUiStatusToDb, mapDbStatusToUi } from '../../../utils/helpers';

// Self-healing database table creation for OS
async function ensureOrdersTableExists() {
  if (!process.env.DATABASE_URL) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS ordens_servico (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        data_solicitacao DATE NOT NULL,
        hora_solicitacao VARCHAR(50),
        setor VARCHAR(255) NOT NULL,
        descricao TEXT NOT NULL,
        tipo_manutencao VARCHAR(100) NOT NULL,
        responsavel VARCHAR(255) NOT NULL,
        area_tecnica VARCHAR(255) NOT NULL,
        prioridade VARCHAR(50) NOT NULL,
        prazo_execucao DATE,
        data_execucao DATE,
        horario_inicio VARCHAR(50),
        horario_termino VARCHAR(50),
        observacao TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'NAO_INICIADO',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (err) {
    console.error('Error creating ordens_servico table:', err);
  }
}

// GET: Fetch all Service Orders (Sorted newest first with dynamic SQL late status override)
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ records: [] });
  }

  try {
    await ensureOrdersTableExists();

    const recordsResult = await sql`
      SELECT 
        id, 
        TO_CHAR(data_solicitacao, 'YYYY-MM-DD') AS "dataSolicitacaoStr", 
        hora_solicitacao AS "horaSolicitacao", 
        setor, 
        descricao, 
        tipo_manutencao AS "tipoManutencao", 
        responsavel, 
        area_tecnica AS "areaTecnica", 
        prioridade, 
        TO_CHAR(prazo_execucao, 'YYYY-MM-DD') AS "prazoExecucaoStr", 
        TO_CHAR(data_execucao, 'YYYY-MM-DD') AS "dataExecucaoStr", 
        horario_inicio AS "horarioInicio", 
        horario_termino AS "horarioTermino", 
        observacao,
        CASE 
          WHEN status != 'CONCLUIDO' AND prazo_execucao IS NOT NULL AND prazo_execucao < CURRENT_DATE THEN 'ATRASADO'
          ELSE status
        END AS status,
        created_at AS "createdAt"
      FROM ordens_servico
      ORDER BY data_solicitacao DESC, created_at DESC
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

// POST: Open a new Service Order with mandatory field validation
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const dataSolicitacao = body.dataSolicitacaoStr || body.dataStr;
    const { 
      horaSolicitacao, setor, descricao, tipoManutencao, 
      responsavel, areaTecnica, prioridade, prazoExecucaoStr, observacao 
    } = body;

    // RULE 2: Mandatory fields backend validation
    if (!dataSolicitacao || !setor || !descricao || !tipoManutencao || !responsavel || !areaTecnica || !prioridade) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Data, Setor, Descrição, Tipo, Responsável, Área Técnica e Prioridade são exigidos.' },
        { status: 400 }
      );
    }

    // Validate request date is not in the future
    const selectedDate = new Date(dataSolicitacao + 'T00:00:00');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (selectedDate > todayDate) {
      return NextResponse.json(
        { error: 'A data de solicitação não pode ser no futuro. Selecione o dia de hoje ou uma data passada.' },
        { status: 400 }
      );
    }

    await ensureOrdersTableExists();

    const dataSolDate = dataSolicitacao ? dataSolicitacao : new Date().toISOString().split('T')[0];
    const prazoExecDate = prazoExecucaoStr && prazoExecucaoStr.trim() !== '' ? prazoExecucaoStr : null;

    const result = await sql`
      INSERT INTO ordens_servico (
        data_solicitacao, hora_solicitacao, setor, descricao, tipo_manutencao, 
        responsavel, area_tecnica, prioridade, prazo_execucao, observacao, status
      ) VALUES (
        ${dataSolDate}, ${horaSolicitacao || ''}, ${setor}, ${descricao}, ${tipoManutencao},
        ${responsavel}, ${areaTecnica}, ${prioridade}, ${prazoExecDate}, ${observacao || ''}, 'NAO_INICIADO'
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0]?.id });
  } catch (err: any) {
    console.error('API POST /api/ordens Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao criar Ordem de Serviço.' }, { status: 500 });
  }
}

// PUT: Edit / Dar Baixa in a Service Order
export async function PUT(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    const body: MaintenanceRecord = await request.json();
    const { id, dataExecucaoStr, horarioInicio, horarioTermino, observacao, status, responsavel } = body;

    if (!id) {
      return NextResponse.json({ error: 'O ID da Ordem de Serviço é obrigatório para atualização.' }, { status: 400 });
    }

    await ensureOrdersTableExists();

    const dataExecDate = dataExecucaoStr && dataExecucaoStr.trim() !== '' ? dataExecucaoStr : null;

    const dbStatus = mapUiStatusToDb(status);

    await sql`
      UPDATE ordens_servico SET
        status = ${dbStatus},
        responsavel = ${responsavel},
        data_execucao = ${dataExecDate},
        horario_inicio = ${horarioInicio || ''},
        horario_termino = ${horarioTermino || ''},
        observacao = ${observacao || ''}
      WHERE id = ${id}::uuid
    `;

    return NextResponse.json({ success: true, updatedId: id });
  } catch (err: any) {
    console.error('API PUT /api/ordens Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao atualizar Ordem de Serviço.' }, { status: 500 });
  }
}

// DELETE: Remove a Service Order by UUID
export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'O ID da Ordem de Serviço é obrigatório para exclusão.' }, { status: 400 });
    }

    await ensureOrdersTableExists();

    await sql`DELETE FROM ordens_servico WHERE id = ${id}::uuid`;

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('API DELETE /api/ordens Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir Ordem de Serviço.' }, { status: 500 });
  }
}

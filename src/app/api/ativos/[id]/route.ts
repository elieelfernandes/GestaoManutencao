import { NextResponse } from 'next/server';
import sql from '../../../../utils/db';

// GET: Fetch a single asset by ID with joins and depreciation calculations
export async function GET(
  request: Request,
  { params }: { params: any }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'ID inválido ou ausente.' }, { status: 400 });
    }

    const result = await sql`
      SELECT 
        a.id,
        a.numero_patrimonio AS "numeroPatrimonio",
        a.descricao,
        a.categoria,
        a.setor_id AS "setorId",
        s.nome AS "setorNome",
        a.responsavel_id AS "responsavelId",
        t.nome AS "responsavelNome",
        a.marca_fabricante AS "marcaFabricante",
        a.modelo_referencia AS "modeloReferencia",
        TO_CHAR(a.data_aquisicao, 'YYYY-MM-DD') AS "dataAquisicaoStr",
        a.valor_aquisicao::float AS "valorAquisicao",
        a.estado_conservacao AS "estadoConservacao",
        a.situacao,
        a.numero_nota_fiscal AS "numeroNotaFiscal",
        a.fornecedor,
        a.vida_util_anos::float AS "vidaUtilAnos",
        a.depreciacao_anual_pct::float AS "depreciacaoAnualPct",
        a.observacoes,
        a.created_at AS "createdAt",
        a.updated_at AS "updatedAt",
        COALESCE((a.valor_aquisicao * (a.depreciacao_anual_pct / 100.0) * EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_aquisicao)))::float, 0.0) AS "depreciacaoAcumulada",
        GREATEST((COALESCE(a.valor_aquisicao, 0.0) - COALESCE(a.valor_aquisicao * (a.depreciacao_anual_pct / 100.0) * EXTRACT(YEAR FROM AGE(CURRENT_DATE, a.data_aquisicao)), 0.0))::float, 0.0) AS "valorResidual"
      FROM ativos_patrimoniais a
      LEFT JOIN cadastros_setores s ON a.setor_id = s.id
      LEFT JOIN cadastros_tecnicos t ON a.responsavel_id = t.id
      WHERE a.id = ${id}
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Ativo patrimonial não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ record: result[0] });
  } catch (err: any) {
    console.error('API GET /api/ativos/[id] Error:', err);
    return NextResponse.json({ error: err.message || 'Falha ao buscar ativo patrimonial.' }, { status: 500 });
  }
}

// PUT: Update an asset by ID
export async function PUT(
  request: Request,
  { params }: { params: any }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'ID inválido ou ausente.' }, { status: 400 });
    }

    const body = await request.json();
    const {
      descricao, categoria, setorId, responsavelId, marcaFabricante,
      modeloReferencia, dataAquisicaoStr, valorAquisicao, estadoConservacao,
      situacao, numeroNotaFiscal, fornecedor, vidaUtilAnos, depreciacaoAnualPct,
      observacoes
    } = body;

    if (!descricao || !categoria || !situacao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Descrição, Categoria e Situação são exigidos.' },
        { status: 400 }
      );
    }

    // Check if asset exists
    const checkExist = await sql`SELECT id FROM ativos_patrimoniais WHERE id = ${id}`;
    if (checkExist.length === 0) {
      return NextResponse.json({ error: 'Ativo patrimonial não encontrado.' }, { status: 404 });
    }

    // Update DB
    await sql`
      UPDATE ativos_patrimoniais
      SET
        descricao = ${descricao},
        categoria = ${categoria},
        setor_id = ${setorId || null},
        responsavel_id = ${responsavelId || null},
        marca_fabricante = ${marcaFabricante || null},
        modelo_referencia = ${modeloReferencia || null},
        data_aquisicao = ${dataAquisicaoStr || null},
        valor_aquisicao = ${valorAquisicao || null},
        estado_conservacao = ${estadoConservacao || null},
        situacao = ${situacao},
        numero_nota_fiscal = ${numeroNotaFiscal || null},
        fornecedor = ${fornecedor || null},
        vida_util_anos = ${vidaUtilAnos || null},
        depreciacao_anual_pct = ${depreciacaoAnualPct || null},
        observacoes = ${observacoes || null},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API PUT /api/ativos/[id] Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao atualizar ativo patrimonial.' }, { status: 500 });
  }
}

// DELETE: Delete an asset by ID
export async function DELETE(
  request: Request,
  { params }: { params: any }
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json({ error: 'ID inválido ou ausente.' }, { status: 400 });
    }

    const checkExist = await sql`SELECT id FROM ativos_patrimoniais WHERE id = ${id}`;
    if (checkExist.length === 0) {
      return NextResponse.json({ error: 'Ativo patrimonial não encontrado.' }, { status: 404 });
    }

    await sql`DELETE FROM ativos_patrimoniais WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API DELETE /api/ativos/[id] Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir ativo patrimonial.' }, { status: 500 });
  }
}

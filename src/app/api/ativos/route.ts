import { NextResponse } from 'next/server';
import sql from '../../../utils/db';

async function ensureAtivosTableExist() {
  if (!process.env.DATABASE_URL) return;

  try {
    // 1. Create table
    await sql`
      CREATE TABLE IF NOT EXISTS ativos_patrimoniais (
        id                     SERIAL PRIMARY KEY,
        numero_patrimonio      TEXT UNIQUE NOT NULL,
        descricao              TEXT NOT NULL,
        categoria              TEXT NOT NULL CHECK (categoria IN (
                                  'Máquinas e Equipamentos','Veículos',
                                  'Tecnologia da Informação','Móveis e Utensílios',
                                  'Instrumentos de Medição','Segurança',
                                  'Infraestrutura','Outros')),
        setor_id               INTEGER REFERENCES cadastros_setores(id),
        responsavel_id         INTEGER REFERENCES cadastros_tecnicos(id),
        marca_fabricante       TEXT,
        modelo_referencia      TEXT,
        data_aquisicao         DATE,
        valor_aquisicao        NUMERIC(12,2),
        estado_conservacao     TEXT CHECK (estado_conservacao IN (
                                  'Ótimo','Bom','Regular','Ruim','Inservível')),
        situacao               TEXT NOT NULL DEFAULT 'Ativo' CHECK (situacao IN (
                                  'Ativo','Em Manutenção','Baixado',
                                  'Alienado','Extraviado')),
        numero_nota_fiscal     TEXT,
        fornecedor             TEXT,
        vida_util_anos         NUMERIC(4,1),
        depreciacao_anual_pct  NUMERIC(5,2),
        observacoes            TEXT,
        created_at             TIMESTAMPTZ DEFAULT now(),
        updated_at             TIMESTAMPTZ DEFAULT now()
      )
    `;

    // 2. Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_ativos_setor ON ativos_patrimoniais(setor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ativos_situacao ON ativos_patrimoniais(situacao)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ativos_categoria ON ativos_patrimoniais(categoria)`;
  } catch (err) {
    console.error('Error creating ativos_patrimoniais table:', err);
  }
}

// GET: Fetch all assets with joins and dynamic depreciation calculations
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ records: [] });
  }

  try {
    await ensureAtivosTableExist();

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
      ORDER BY a.numero_patrimonio DESC
    `;

    return NextResponse.json({ records: result });
  } catch (err: any) {
    console.error('API GET /api/ativos Error:', err);
    return NextResponse.json({ error: err.message || 'Falha ao buscar ativos patrimoniais.' }, { status: 500 });
  }
}

// POST: Add a new asset with auto-sequence generation and validation
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    await ensureAtivosTableExist();

    const body = await request.json();
    const {
      descricao, categoria, setorId, responsavelId, marcaFabricante,
      modeloReferencia, dataAquisicaoStr, valorAquisicao, estadoConservacao,
      situacao, numeroNotaFiscal, fornecedor, vidaUtilAnos, depreciacaoAnualPct,
      observacoes
    } = body;

    // Strict validation of required fields
    if (!descricao || !categoria || !situacao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Descrição, Categoria e Situação são exigidos.' },
        { status: 400 }
      );
    }

    // 1. Generate sequential number using regex extraction over existing records
    const maxPatrimonioResult = await sql`
      SELECT MAX(CAST(SUBSTRING(numero_patrimonio FROM 'MAR-([0-9]+)') AS INTEGER)) AS max_num 
      FROM ativos_patrimoniais 
      WHERE numero_patrimonio LIKE 'MAR-%'
    `;
    const maxNum = maxPatrimonioResult[0]?.max_num;
    const nextNum = (maxNum !== null && maxNum !== undefined) ? (maxNum + 1) : 1;
    const numeroPatrimonio = `MAR-${String(nextNum).padStart(3, '0')}`;

    // 2. Insert into table
    const result = await sql`
      INSERT INTO ativos_patrimoniais (
        numero_patrimonio, descricao, categoria, setor_id, responsavel_id,
        marca_fabricante, modelo_referencia, data_aquisicao, valor_aquisicao,
        estado_conservacao, situacao, numero_nota_fiscal, fornecedor,
        vida_util_anos, depreciacao_anual_pct, observacoes
      ) VALUES (
        ${numeroPatrimonio}, ${descricao}, ${categoria}, ${setorId || null}, ${responsavelId || null},
        ${marcaFabricante || null}, ${modeloReferencia || null}, ${dataAquisicaoStr || null}, ${valorAquisicao || null},
        ${estadoConservacao || null}, ${situacao}, ${numeroNotaFiscal || null}, ${fornecedor || null},
        ${vidaUtilAnos || null}, ${depreciacaoAnualPct || null}, ${observacoes || null}
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: result[0]?.id, numeroPatrimonio });
  } catch (err: any) {
    console.error('API POST /api/ativos Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao cadastrar ativo patrimonial.' }, { status: 500 });
  }
}

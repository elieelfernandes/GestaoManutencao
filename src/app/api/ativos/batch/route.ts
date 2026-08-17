import { NextResponse } from 'next/server';
import sql from '../../../../utils/db';
import { AssetCategory, AssetConservation, AssetSituation } from '@/types';

/**
 * TABELA OFICIAL DE DEPRECIAÇÃO DA RECEITA FEDERAL DO BRASIL (RFB)
 * Fonte: Instrução Normativa RFB nº 1700/2017, Anexo III
 * Base Legal: Lei nº 9.249/1995 e Regulamento do Imposto de Renda (RIR/2018 - Decreto nº 9.580/2018, Art. 320)
 */
const RFB_DEPRECIATION_MAP: Record<AssetCategory, { vidaUtil: number; taxaAnual: number; embasamento: string }> = {
  'Máquinas e Equipamentos': {
    vidaUtil: 10,
    taxaAnual: 10,
    embasamento: 'IN RFB 1700/2017, Anexo III - NCM Cap. 84 (Máquinas, aparelhos e instrumentos mecânicos)'
  },
  'Veículos': {
    vidaUtil: 5,
    taxaAnual: 20,
    embasamento: 'IN RFB 1700/2017, Anexo III - NCM Cap. 87 (Veículos automóveis, tratores e outros veículos terrestres)'
  },
  'Tecnologia da Informação': {
    vidaUtil: 5,
    taxaAnual: 20,
    embasamento: 'IN RFB 1700/2017, Anexo III - NCM Cap. 84.71 e 85 (Máquinas automáticas de processamento de dados e periféricos)'
  },
  'Móveis e Utensílios': {
    vidaUtil: 10,
    taxaAnual: 10,
    embasamento: 'IN RFB 1700/2017, Anexo III - NCM Cap. 94 (Móveis e mobiliários em geral)'
  },
  'Instrumentos de Medição': {
    vidaUtil: 10,
    taxaAnual: 10,
    embasamento: 'IN RFB 1700/2017, Anexo III - NCM Cap. 90 (Instrumentos e aparelhos de óptica, medida ou controle)'
  },
  'Segurança': {
    vidaUtil: 10,
    taxaAnual: 10,
    embasamento: 'IN RFB 1700/2017, Anexo III - NCM Cap. 85.31 (Aparelhos de sinalização acústica ou visual / segurança patrimonial)'
  },
  'Infraestrutura': {
    vidaUtil: 25,
    taxaAnual: 4,
    embasamento: 'IN RFB 1700/2017, Anexo III - Edificações, instalações físicas e benfeitorias em imóveis'
  },
  'Outros': {
    vidaUtil: 10,
    taxaAnual: 10,
    embasamento: 'IN RFB 1700/2017, Anexo III - Regra geral residual para bens móveis corporativos'
  }
};

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum ativo fornecido para importação.' }, { status: 400 });
    }

    // 1. Fetch current max sequence number to increment from
    const maxPatrimonioResult = await sql`
      SELECT MAX(CAST(SUBSTRING(numero_patrimonio FROM 'MAR-([0-9]+)') AS INTEGER)) AS max_num 
      FROM ativos_patrimoniais 
      WHERE numero_patrimonio LIKE 'MAR-%'
    `;
    let currentMax = maxPatrimonioResult[0]?.max_num || 0;

    // 2. Validate sectors and technicians lookups in DB
    const existingSectors = await sql`SELECT id, nome FROM cadastros_setores`;
    const existingTecnicos = await sql`SELECT id, nome FROM cadastros_tecnicos`;

    const sectorIdSet = new Set(existingSectors.map((s: any) => s.id));
    const tecnicoIdSet = new Set(existingTecnicos.map((t: any) => t.id));

    const insertedIds: number[] = [];

    // 3. Process insertion of each item with fallback to RFB depreciation
    for (const item of items) {
      const descricao = item.descricao?.trim();
      const categoria = item.categoria as AssetCategory;
      const situacao = (item.situacao as AssetSituation) || 'Ativo';
      const estadoConservacao = (item.estadoConservacao as AssetConservation) || 'Bom';

      if (!descricao || !categoria) {
        throw new Error(`Item inválido na linha: Descrição e Categoria são obrigatórias.`);
      }

      // Check sector/technician ID existence if supplied
      if (item.setorId !== null && item.setorId !== undefined && !sectorIdSet.has(item.setorId)) {
        throw new Error(`Setor de ID ${item.setorId} não existe no banco de dados.`);
      }
      if (item.responsavelId !== null && item.responsavelId !== undefined && !tecnicoIdSet.has(item.responsavelId)) {
        throw new Error(`Técnico de ID ${item.responsavelId} não existe no banco de dados.`);
      }

      // Generate sequence code if not provided
      let numeroPatrimonio = item.numeroPatrimonio?.trim();
      if (!numeroPatrimonio) {
        currentMax += 1;
        numeroPatrimonio = `MAR-${String(currentMax).padStart(3, '0')}`;
      }

      // Auto-apply RFB depreciation if missing
      const rfbDefaults = RFB_DEPRECIATION_MAP[categoria] || RFB_DEPRECIATION_MAP['Outros'];
      const vidaUtilAnos = (item.vidaUtilAnos !== null && item.vidaUtilAnos !== undefined && !isNaN(Number(item.vidaUtilAnos)))
        ? Number(item.vidaUtilAnos)
        : rfbDefaults.vidaUtil;

      const depreciacaoAnualPct = (item.depreciacaoAnualPct !== null && item.depreciacaoAnualPct !== undefined && !isNaN(Number(item.depreciacaoAnualPct)))
        ? Number(item.depreciacaoAnualPct)
        : rfbDefaults.taxaAnual;

      const valorAquisicao = (item.valorAquisicao !== null && item.valorAquisicao !== undefined && !isNaN(Number(item.valorAquisicao)))
        ? Number(item.valorAquisicao)
        : null;

      const result = await sql`
        INSERT INTO ativos_patrimoniais (
          numero_patrimonio, descricao, categoria, setor_id, responsavel_id,
          marca_fabricante, modelo_referencia, data_aquisicao, valor_aquisicao,
          estado_conservacao, situacao, numero_nota_fiscal, fornecedor,
          vida_util_anos, depreciacao_anual_pct, observacoes
        ) VALUES (
          ${numeroPatrimonio}, ${descricao}, ${categoria}, ${item.setorId || null}, ${item.responsavelId || null},
          ${item.marcaFabricante || null}, ${item.modeloReferencia || null}, ${item.dataAquisicaoStr || null}, ${valorAquisicao},
          ${estadoConservacao}, ${situacao}, ${item.numeroNotaFiscal || null}, ${item.fornecedor || null},
          ${vidaUtilAnos}, ${depreciacaoAnualPct}, ${item.observacoes || null}
        )
        RETURNING id
      `;

      if (result[0]?.id) {
        insertedIds.push(result[0].id);
      }
    }

    return NextResponse.json({
      success: true,
      importedCount: insertedIds.length,
      message: `${insertedIds.length} ativos foram importados com sucesso.`
    });
  } catch (err: any) {
    console.error('API POST /api/ativos/batch Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao importar lote de ativos.' }, { status: 400 });
  }
}

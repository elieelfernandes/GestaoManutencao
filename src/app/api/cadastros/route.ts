import { NextResponse } from 'next/server';
import sql from '../../../utils/db';

// Auto-create master tables and seed Marilux initial data if empty
async function ensureMasterTablesExist() {
  if (!process.env.DATABASE_URL) return;

  try {
    // 1. Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS cadastros_tecnicos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        area_atuacao VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cadastros_setores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cadastros_areas_tecnicas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS cadastros_tipos_manutencao (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // 2. Initial Seeding if empty
    const countTecnicos = await sql`SELECT COUNT(*)::int as count FROM cadastros_tecnicos`;
    if (countTecnicos[0]?.count === 0) {
      const defaultTecnicos = [
        { nome: 'Cristian', area: 'Mecânica / Elétrica' },
        { nome: 'JR', area: 'Manutenção Geral' },
        { nome: 'Segundo', area: 'Elétrica / Automação' },
        { nome: 'Cícero', area: 'Manutenção Geral' }
      ];
      for (const t of defaultTecnicos) {
        await sql`INSERT INTO cadastros_tecnicos (nome, area_atuacao) VALUES (${t.nome}, ${t.area}) ON CONFLICT DO NOTHING`;
      }
    }

    const countSetores = await sql`SELECT COUNT(*)::int as count FROM cadastros_setores`;
    if (countSetores[0]?.count === 0) {
      const defaultSetores = [
        'Produção', 'Linha B', 'Linha D', 'Linha E', 'Linha F', 'Linha G', 
        'Linha I', 'Linha J', 'Depósito', 'Administrativo', 'Projeto Novo', 'Manutenção Predial'
      ];
      for (const s of defaultSetores) {
        await sql`INSERT INTO cadastros_setores (nome) VALUES (${s}) ON CONFLICT DO NOTHING`;
      }
    }

    const countAreas = await sql`SELECT COUNT(*)::int as count FROM cadastros_areas_tecnicas`;
    if (countAreas[0]?.count === 0) {
      const defaultAreas = ['Mecânica', 'Elétrica', 'Automação', 'Predial'];
      for (const a of defaultAreas) {
        await sql`INSERT INTO cadastros_areas_tecnicas (nome) VALUES (${a}) ON CONFLICT DO NOTHING`;
      }
    }

    const countTipos = await sql`SELECT COUNT(*)::int as count FROM cadastros_tipos_manutencao`;
    if (countTipos[0]?.count === 0) {
      const defaultTipos = ['Corretiva', 'Preventiva', 'Melhoria', 'Expansão', 'Apoio Técnico'];
      for (const tm of defaultTipos) {
        await sql`INSERT INTO cadastros_tipos_manutencao (nome) VALUES (${tm}) ON CONFLICT DO NOTHING`;
      }
    }

  } catch (err) {
    console.error('Error creating master lookup tables:', err);
  }
}

// GET: Fetch all master lookup categories ordered alphabetically by name
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      tecnicos: [
        { id: 1, nome: 'Cristian', areaAtuacao: 'Mecânica / Elétrica' },
        { id: 2, nome: 'JR', areaAtuacao: 'Manutenção Geral' },
        { id: 3, nome: 'Segundo', areaAtuacao: 'Elétrica / Automação' },
        { id: 4, nome: 'Cícero', areaAtuacao: 'Manutenção Geral' }
      ],
      setores: [
        'Administrativo', 'Depósito', 'Linha B', 'Linha D', 'Linha E', 'Linha F', 
        'Linha G', 'Linha I', 'Linha J', 'Manutenção Predial', 'Produção', 'Projeto Novo'
      ].map((nome, i) => ({ id: i + 1, nome })),
      areasTecnicas: ['Automação', 'Elétrica', 'Mecânica', 'Predial'].map((nome, i) => ({ id: i + 1, nome })),
      tiposManutencao: ['Apoio Técnico', 'Corretiva', 'Expansão', 'Melhoria', 'Preventiva'].map((nome, i) => ({ id: i + 1, nome }))
    });
  }

  try {
    await ensureMasterTablesExist();

    const tecnicos = await sql`SELECT id, nome, area_atuacao AS "areaAtuacao" FROM cadastros_tecnicos ORDER BY nome ASC`;
    const setores = await sql`SELECT id, nome FROM cadastros_setores ORDER BY nome ASC`;
    const areasTecnicas = await sql`SELECT id, nome FROM cadastros_areas_tecnicas ORDER BY nome ASC`;
    const tiposManutencao = await sql`SELECT id, nome FROM cadastros_tipos_manutencao ORDER BY nome ASC`;

    return NextResponse.json({
      tecnicos,
      setores,
      areasTecnicas,
      tiposManutencao
    });
  } catch (err: any) {
    console.error('API GET /api/cadastros Error:', err);
    return NextResponse.json({ error: err.message || 'Falha ao buscar cadastros' }, { status: 500 });
  }
}

// POST: Add a new item to one of the master tables
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { type, nome, areaAtuacao } = body;

    if (!type || !nome || String(nome).trim() === '') {
      return NextResponse.json({ error: 'O nome do cadastro é obrigatório.' }, { status: 400 });
    }

    const cleanNome = String(nome).trim();
    await ensureMasterTablesExist();

    if (type === 'tecnico') {
      await sql`INSERT INTO cadastros_tecnicos (nome, area_atuacao) VALUES (${cleanNome}, ${areaAtuacao || ''})`;
    } else if (type === 'setor') {
      await sql`INSERT INTO cadastros_setores (nome) VALUES (${cleanNome})`;
    } else if (type === 'area_tecnica') {
      await sql`INSERT INTO cadastros_areas_tecnicas (nome) VALUES (${cleanNome})`;
    } else if (type === 'tipo_manutencao') {
      await sql`INSERT INTO cadastros_tipos_manutencao (nome) VALUES (${cleanNome})`;
    } else {
      return NextResponse.json({ error: 'Tipo de cadastro inválido.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Cadastro de "${cleanNome}" adicionado com sucesso.` });
  } catch (err: any) {
    console.error('API POST /api/cadastros Error:', err);
    if (err.message && err.message.includes('unique constraint')) {
      return NextResponse.json({ error: 'Este nome já está cadastrado no sistema.' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || 'Erro ao adicionar cadastro.' }, { status: 500 });
  }
}

// DELETE: Delete a master lookup item with in-use protection (Rule 6)
export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Banco de dados não configurado (DATABASE_URL ausente).' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const nome = searchParams.get('nome');

    if (!type || (!id && !nome)) {
      return NextResponse.json({ error: 'Parâmetros tipo e ID/nome são obrigatórios para exclusão.' }, { status: 400 });
    }

    await ensureMasterTablesExist();

    // Find item name if not provided directly
    let targetName = nome || '';
    if (!targetName && id) {
      let queryResult: any[] = [];
      if (type === 'tecnico') queryResult = await sql`SELECT nome FROM cadastros_tecnicos WHERE id = ${parseInt(id, 10)}`;
      if (type === 'setor') queryResult = await sql`SELECT nome FROM cadastros_setores WHERE id = ${parseInt(id, 10)}`;
      if (type === 'area_tecnica') queryResult = await sql`SELECT nome FROM cadastros_areas_tecnicas WHERE id = ${parseInt(id, 10)}`;
      if (type === 'tipo_manutencao') queryResult = await sql`SELECT nome FROM cadastros_tipos_manutencao WHERE id = ${parseInt(id, 10)}`;
      if (queryResult.length > 0) {
        targetName = queryResult[0].nome;
      }
    }

    // RULE 6: Protection check against OS foreign usage
    if (targetName) {
      // Check if ordens_servico table exists and has records
      const checkTable = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ordens_servico')`;
      if (checkTable[0]?.exists) {
        const usageCheck = await sql`
          SELECT COUNT(*)::int AS count FROM ordens_servico 
          WHERE setor = ${targetName} 
             OR responsavel = ${targetName} 
             OR area_tecnica = ${targetName} 
             OR tipo_manutencao = ${targetName}
        `;
        const count = usageCheck[0]?.count || 0;
        if (count > 0) {
          return NextResponse.json(
            { error: `Não é possível excluir o cadastro "${targetName}" pois existem ${count} Ordem(ns) de Serviço vinculada(s) a ele.` },
            { status: 409 }
          );
        }
      }
    }

    // Execute deletion
    if (type === 'tecnico') {
      await sql`DELETE FROM cadastros_tecnicos WHERE id = ${parseInt(id!, 10)} OR nome = ${targetName}`;
    } else if (type === 'setor') {
      await sql`DELETE FROM cadastros_setores WHERE id = ${parseInt(id!, 10)} OR nome = ${targetName}`;
    } else if (type === 'area_tecnica') {
      await sql`DELETE FROM cadastros_areas_tecnicas WHERE id = ${parseInt(id!, 10)} OR nome = ${targetName}`;
    } else if (type === 'tipo_manutencao') {
      await sql`DELETE FROM cadastros_tipos_manutencao WHERE id = ${parseInt(id!, 10)} OR nome = ${targetName}`;
    } else {
      return NextResponse.json({ error: 'Tipo de cadastro inválido.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Cadastro "${targetName}" excluído com sucesso.` });
  } catch (err: any) {
    console.error('API DELETE /api/cadastros Error:', err);
    return NextResponse.json({ error: err.message || 'Erro ao excluir cadastro.' }, { status: 500 });
  }
}

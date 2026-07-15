import { NextResponse } from 'next/server';
import sql from '../../../utils/db';
import { MaintenanceRecord, MasterLookupData } from '../../../types';

// Self-healing database tables creation
async function ensureTablesExist() {
  if (!process.env.DATABASE_URL) return;

  try {
    // 1. Create master_lookups table
    await sql`
      CREATE TABLE IF NOT EXISTS master_lookups (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        value VARCHAR(255) NOT NULL
      )
    `;

    // 2. Create maintenance_records table
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id VARCHAR(255) PRIMARY KEY,
        data_os DATE,
        hora_solicitacao VARCHAR(50),
        setor VARCHAR(255),
        descricao TEXT,
        tipo_manutencao VARCHAR(100),
        responsavel VARCHAR(255),
        prioridade VARCHAR(50),
        data_execucao DATE,
        horario_inicio VARCHAR(50),
        horario_termino VARCHAR(50),
        observacao TEXT,
        status VARCHAR(50),
        pct_status NUMERIC(5,2),
        mes_raw VARCHAR(50),
        mes_str VARCHAR(50),
        setor_manutencao VARCHAR(255),
        prazo_execucao DATE,
        prazo VARCHAR(50),
        is_calculated_atrasado BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;
  } catch (err) {
    console.error('Error creating database tables:', err);
  }
}

// GET: Fetch all records and lookups
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Connection string DATABASE_URL is missing' },
      { status: 500 }
    );
  }

  try {
    await ensureTablesExist();

    // Fetch records
    const recordsResult = await sql`
      SELECT * FROM maintenance_records 
      ORDER BY data_os DESC NULLS LAST, created_at DESC
    `;

    // Fetch master lookups
    const lookupsResult = await sql`
      SELECT category, value FROM master_lookups
      ORDER BY id ASC
    `;

    // Map records from Postgres naming to TS camelCase naming
    const records: MaintenanceRecord[] = recordsResult.map((r: any) => ({
      id: r.id,
      data: r.data_os ? new Date(r.data_os) : null,
      dataStr: r.data_os ? new Date(r.data_os).toISOString().split('T')[0] : '',
      horaSolicitacao: r.hora_solicitacao || '',
      setor: r.setor || '',
      descricao: r.descricao || '',
      tipoManutencao: r.tipo_manutencao || '',
      responsavel: r.responsavel || '',
      prioridade: r.prioridade || 'Média',
      dataExecucao: r.data_execucao ? new Date(r.data_execucao) : null,
      dataExecucaoStr: r.data_execucao ? new Date(r.data_execucao).toISOString().split('T')[0] : '',
      horarioInicio: r.horario_inicio || '',
      horarioTermino: r.horario_termino || '',
      observacao: r.observacao || '',
      status: r.status || 'Não iniciado',
      pctStatus: r.pct_status ? parseFloat(r.pct_status) : 0,
      mesRaw: r.mes_raw || '',
      mesStr: r.mes_str || 'Outro',
      setorManutencao: r.setor_manutencao || '',
      prazoExecucao: r.prazo_execucao ? new Date(r.prazo_execucao) : null,
      prazoExecucaoStr: r.prazo_execucao ? new Date(r.prazo_execucao).toISOString().split('T')[0] : '',
      prazo: r.prazo || '',
      isCalculatedAtrasado: !!r.is_calculated_atrasado
    }));

    // Group lookups
    const masterLookups: MasterLookupData = {
      responsibles: [],
      sectors: [],
      priorities: [],
      maintenanceSectors: []
    };

    lookupsResult.forEach((l: any) => {
      if (l.category === 'responsible') masterLookups.responsibles.push(l.value);
      if (l.category === 'sector') masterLookups.sectors.push(l.value);
      if (l.category === 'priority') masterLookups.priorities.push(l.value);
      if (l.category === 'maintSector') masterLookups.maintenanceSectors.push(l.value);
    });

    return NextResponse.json({
      records,
      masterLookups,
      originalFileName: records.length > 0 ? 'Neon Postgres Connected' : 'Sem planilhas carregadas'
    });
  } catch (err: any) {
    console.error('API GET Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Overwrite database with a newly uploaded parsed Excel spreadsheet
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'Connection string DATABASE_URL is missing' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const records: MaintenanceRecord[] = body.records || [];
    const lookups: MasterLookupData = body.masterLookups || {
      responsibles: [],
      sectors: [],
      priorities: [],
      maintenanceSectors: []
    };

    await ensureTablesExist();

    // 1. Wipe old data
    await sql`TRUNCATE TABLE maintenance_records`;
    await sql`TRUNCATE TABLE master_lookups`;

    // 2. Bulk insert master lookups
    if (lookups.responsibles.length > 0 || lookups.sectors.length > 0 || lookups.maintenanceSectors.length > 0) {
      // Loop inserts for lookups (small volume, safe to run in a loop)
      for (const val of lookups.responsibles) {
        await sql`INSERT INTO master_lookups (category, value) VALUES ('responsible', ${val})`;
      }
      for (const val of lookups.sectors) {
        await sql`INSERT INTO master_lookups (category, value) VALUES ('sector', ${val})`;
      }
      for (const val of lookups.priorities) {
        await sql`INSERT INTO master_lookups (category, value) VALUES ('priority', ${val})`;
      }
      for (const val of lookups.maintenanceSectors) {
        await sql`INSERT INTO master_lookups (category, value) VALUES ('maintSector', ${val})`;
      }
    }

    // 3. Batch insert maintenance records to avoid stack limits and speed up
    // We insert in batches of 100 rows
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Execute inserts for each row in the batch in parallel
      await Promise.all(
        batch.map(r => {
          // Format dates for SQL Postgres DATE format (YYYY-MM-DD or null)
          const dataOs = r.dataStr || null;
          const dataExec = r.dataExecucaoStr || null;
          const prazoExec = r.prazoExecucaoStr || null;

          return sql`
            INSERT INTO maintenance_records (
              id, data_os, hora_solicitacao, setor, descricao, tipo_manutencao, 
              responsavel, prioridade, data_execucao, horario_inicio, horario_termino, 
              observacao, status, pct_status, mes_raw, mes_str, setor_manutencao, 
              prazo_execucao, prazo, is_calculated_atrasado
            ) VALUES (
              ${r.id}, ${dataOs}, ${r.horaSolicitacao}, ${r.setor}, ${r.descricao}, ${r.tipoManutencao},
              ${r.responsavel}, ${r.prioridade}, ${dataExec}, ${r.horarioInicio}, ${r.horarioTermino},
              ${r.observacao}, ${r.status}, ${r.pctStatus}, ${r.mesRaw}, ${r.mesStr}, ${r.setorManutencao},
              ${prazoExec}, ${r.prazo}, ${r.isCalculatedAtrasado}
            )
          `;
        })
      );
    }

    return NextResponse.json({ success: true, count: records.length });
  } catch (err: any) {
    console.error('API POST Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. String Normalizer Helper (Remove accents, lowercase, trim)
function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// 2. Read DATABASE_URL from .env.local
let dbUrl = process.env.DATABASE_URL;
const envPath = path.join(__dirname, '..', '..', '.env.local');
if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=(.*)/);
  if (match) dbUrl = match[1].trim();
}

if (!dbUrl) {
  console.error('ERRO: DATABASE_URL não encontrada no ambiente ou em .env.local!');
  process.exit(1);
}

// Parse args
const isWriteMode = process.argv.includes('--write');
const isBackupConfirmed = process.argv.includes('--backup-confirmado');

console.log('=== MARILUX CMMS - SCRIPT DE LIMPEZA E MIGRAÇÃO ===');
console.log(`Modo de execução: ${isWriteMode ? 'ESCRITA (GRAVAÇÃO)' : 'DRY-RUN (SIMULAÇÃO)'}`);
if (isWriteMode && !isBackupConfirmed) {
  console.error('\nERRO CRÍTICO: Execução em modo de escrita exige a flag --backup-confirmado!');
  console.error('Certifique-se de fazer um backup do banco Supabase antes de prosseguir.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    // Fetch current data
    const tecnicos = await client.query('SELECT id, nome FROM cadastros_tecnicos');
    const setores = await client.query('SELECT id, nome FROM cadastros_setores');
    const ordens = await client.query('SELECT id, responsavel, setor, status FROM ordens_servico');

    console.log(`\nLidos do Banco: ${tecnicos.rows.length} Técnicos, ${setores.rows.length} Setores, ${ordens.rows.length} Ordens de Serviço.`);

    // Find duplicates function
    function findDuplicates(items, keyName) {
      const groups = {};
      items.forEach(item => {
        const norm = normalizeText(item[keyName]);
        if (!groups[norm]) groups[norm] = [];
        groups[norm].push(item);
      });

      const duplicatesReport = [];
      Object.keys(groups).forEach(norm => {
        if (groups[norm].length > 1) {
          // Choose Canonical (preferably acentuado, proper case - e.g. "Cícero" over "Cicero" / "Cicero" over "cicero")
          const groupList = groups[norm];
          let canonical = groupList[0];
          
          for (let i = 1; i < groupList.length; i++) {
            const current = groupList[i].nome;
            const chosen = canonical.nome;
            // Prefer acentuado (more character variance/NFD length difference)
            if (current.normalize("NFD").length > chosen.normalize("NFD").length) {
              canonical = groupList[i];
            } else if (current !== current.toLowerCase() && chosen === chosen.toLowerCase()) {
              // Prefer capitalized over purely lowercase
              canonical = groupList[i];
            }
          }

          const discards = groupList.filter(item => item.id !== canonical.id);
          duplicatesReport.push({
            canonical,
            discards,
            norm
          });
        }
      });
      return duplicatesReport;
    }

    const dupTecnicos = findDuplicates(tecnicos.rows, 'nome');
    const dupSetores = findDuplicates(setores.rows, 'nome');

    // Create Report
    const report = {
      timestamp: Date.now(),
      mode: isWriteMode ? 'write' : 'dry-run',
      backupConfirmed: isBackupConfirmed,
      tecnicos: [],
      setores: [],
      statusMigratedCount: 0
    };

    console.log('\n--- DETECÇÃO DE DUPLICADOS (TÉCNICOS) ---');
    dupTecnicos.forEach(grp => {
      let impactCount = 0;
      const discardNames = grp.discards.map(d => d.nome);
      ordens.rows.forEach(os => {
        if (discardNames.includes(os.responsavel)) impactCount++;
      });
      console.log(`[Técnico Canônico] "${grp.canonical.nome}" (ID: ${grp.canonical.id})`);
      console.log(`  -> Descartar duplicados: ${JSON.stringify(discardNames)}`);
      console.log(`  -> OSs a serem reapontadas: ${impactCount}`);
      
      report.tecnicos.push({
        canonical: grp.canonical,
        discards: grp.discards,
        impactedOrders: impactCount
      });
    });

    console.log('\n--- DETECÇÃO DE DUPLICADOS (SETORES) ---');
    dupSetores.forEach(grp => {
      let impactCount = 0;
      const discardNames = grp.discards.map(d => d.nome);
      ordens.rows.forEach(os => {
        if (discardNames.includes(os.setor)) impactCount++;
      });
      console.log(`[Setor Canônico] "${grp.canonical.nome}" (ID: ${grp.canonical.id})`);
      console.log(`  -> Descartar duplicados: ${JSON.stringify(discardNames)}`);
      console.log(`  -> OSs a serem reapontadas: ${impactCount}`);

      report.setores.push({
        canonical: grp.canonical,
        discards: grp.discards,
        impactedOrders: impactCount
      });
    });

    // Count Status conversions
    let statusConversions = 0;
    const statusMap = {
      'Concluído': 'CONCLUIDO',
      'Concluido': 'CONCLUIDO',
      'Feito': 'CONCLUIDO',
      'feito': 'CONCLUIDO',
      'encerrado': 'CONCLUIDO',
      'Em andamento': 'EM_ANDAMENTO',
      'Andamento': 'EM_ANDAMENTO',
      'Não iniciado': 'NAO_INICIADO',
      'Nao iniciado': 'NAO_INICIADO',
    };
    ordens.rows.forEach(os => {
      const current = os.status;
      if (current !== 'CONCLUIDO' && current !== 'EM_ANDAMENTO' && current !== 'NAO_INICIADO') {
        statusConversions++;
      }
    });
    console.log(`\n--- STATUS MIGRATION ---`);
    console.log(`OSs com status despadronizado a serem convertidas: ${statusConversions}`);
    report.statusMigratedCount = statusConversions;

    // Save report to JSON file
    const reportFileName = `migration-report-${report.timestamp}.json`;
    const reportPath = path.join(__dirname, '..', '..', reportFileName);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n[Relatório Salvo] Auditoria gravada em: ${reportPath}`);

    if (!isWriteMode) {
      console.log('\n[Modo Dry-Run] Nenhuma alteração foi gravada no banco de dados Supabase.');
      console.log('Revise o relatório acima. Para executar as alterações reais, rode com:');
      console.log('  node src/scripts/cleanup-and-migrate.js --write --backup-confirmado');
      return;
    }

    // --- WRITE MODE EXECUTION (SINGLE TRANSACTION) ---
    console.log('\n[ESCRITA] Iniciando gravação de dados sob transação SQL...');
    await client.query('BEGIN');

    // 1. Deduplicar Técnicos
    for (const grp of report.tecnicos) {
      const canonicalName = grp.canonical.nome;
      const discardNames = grp.discards.map(d => d.nome);
      const discardIds = grp.discards.map(d => d.id);

      // Reapontar OSs
      await client.query(
        'UPDATE ordens_servico SET responsavel = $1 WHERE responsavel = ANY($2::varchar[])',
        [canonicalName, discardNames]
      );
      // Deletar duplicados da tabela mestre
      await client.query(
        'DELETE FROM cadastros_tecnicos WHERE id = ANY($1::int[])',
        [discardIds]
      );
    }

    // 2. Deduplicar Setores
    for (const grp of report.setores) {
      const canonicalName = grp.canonical.nome;
      const discardNames = grp.discards.map(d => d.nome);
      const discardIds = grp.discards.map(d => d.id);

      // Reapontar OSs
      await client.query(
        'UPDATE ordens_servico SET setor = $1 WHERE setor = ANY($2::varchar[])',
        [canonicalName, discardNames]
      );
      // Deletar duplicados da tabela mestre
      await client.query(
        'DELETE FROM cadastros_setores WHERE id = ANY($1::int[])',
        [discardIds]
      );
    }

    // 3. Normalizar e padronizar status na tabela
    for (const os of ordens.rows) {
      const current = os.status;
      let mapped = statusMap[current] || 'NAO_INICIADO';
      
      // If already mapped or matches uppercase, keep it
      if (['CONCLUIDO', 'EM_ANDAMENTO', 'NAO_INICIADO'].includes(current)) {
        mapped = current;
      }
      
      await client.query(
        'UPDATE ordens_servico SET status = $1 WHERE id = $2',
        [mapped, os.id]
      );
    }

    // 4. Habilitar Check Constraint
    console.log('Aplicando restrição CHECK CONSTRAINT para coluna status...');
    await client.query('ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS chk_status');
    await client.query("ALTER TABLE ordens_servico ADD CONSTRAINT chk_status CHECK (status IN ('NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO'))");

    await client.query('COMMIT');
    console.log('\n[CONCLUÍDO] Gravação e migração finalizadas com sucesso! Transação efetivada.');

  } catch (err) {
    if (isWriteMode) {
      console.error('\n[ERRO] Ocorreu uma exceção no modo de gravação. Executando ROLLBACK da transação.');
      await client.query('ROLLBACK');
    }
    console.error('Detalhes do erro:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();

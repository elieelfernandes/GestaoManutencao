const XLSX = require('xlsx');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from env or .env.local
let dbUrl = process.env.DATABASE_URL;
const envPath = path.join(__dirname, '..', '..', '.env.local');
if (!dbUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=(.*)/);
  if (match) dbUrl = match[1].trim();
}

if (!dbUrl) {
  console.error('ERRO: DATABASE_URL não encontrada!');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

const excelPath = 'g:/Meu Drive/1. Consultoria/1. Consultoria Ativas/1. Marilux/9. Manutenção/Marilux - Gestão de Manutenção (2).xlsx';
console.log('=== LENDO NOVA PLANILHA DE 2026 ===');
console.log('Caminho:', excelPath);

if (!fs.existsSync(excelPath)) {
  console.error(`ERRO: Arquivo não encontrado no caminho especificado: ${excelPath}`);
  process.exit(1);
}

const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('gerenciador')) || workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total de linhas brutas na aba:', rawRows.length);

function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'number') {
    if (val < 1) return null;
    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + Math.floor(val));
    const iso = date.toISOString().split('T')[0];
    const parts = iso.split('-');
    let year = parseInt(parts[0], 10);
    if (year > 2099) year = 2026;
    return `${year}-${parts[1]}-${parts[2]}`;
  }
  if (typeof val === 'string') {
    const trimmed = val.replace(/['"\s]/g, '').trim();
    if (!trimmed || trimmed === '0') return null;
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      let p1 = parseInt(parts[0], 10);
      let p2 = parseInt(parts[1], 10);
      let yStr = parts[2].trim();
      if (yStr.length > 4) yStr = yStr.slice(0, 4);
      let year = parseInt(yStr, 10);
      if (isNaN(year) || year > 2099) year = 2026;

      let day = p1;
      let month = p2;

      if (month > 12 && day <= 12) {
        let temp = day;
        day = month;
        month = temp;
      }
      if (month < 1 || month > 12) month = 1;
      if (day < 1 || day > 31) day = 1;

      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    const p = Date.parse(trimmed);
    if (!isNaN(p)) {
      const d = new Date(p);
      const iso = d.toISOString().split('T')[0];
      const pIso = iso.split('-');
      let year = parseInt(pIso[0], 10);
      if (year > 2099) year = 2026;
      return `${year}-${pIso[1]}-${pIso[2]}`;
    }
  }
  return null;
}

function parseTime(val) {
  if (!val) return '';
  if (typeof val === 'number') {
    const totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const trimmed = val.replace(/['"\s]/g, '').trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const parts = trimmed.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1]}`;
    }
    return trimmed;
  }
  return String(val);
}

// Map spreadsheet status directly to strict DB enums
function cleanStatusToDb(val) {
  if (!val) return 'NAO_INICIADO';
  const str = String(val).trim().toLowerCase();
  if (['feito', 'feit', 'fito', 'encerrado', 'encerrada', 'concluido', 'concluído', 'concluido'].some(s => str.includes(s))) {
    return 'CONCLUIDO';
  }
  if (['em andamento', 'andamento'].some(s => str.includes(s))) {
    return 'EM_ANDAMENTO';
  }
  return 'NAO_INICIADO';
}

function cleanPriority(val) {
  if (!val) return 'Média';
  const str = String(val).trim().toLowerCase();
  if (str === '1' || str.includes('alta')) return 'Alta';
  if (str === '3' || str.includes('baixa')) return 'Baixa';
  return 'Média';
}

function cleanResponsible(val) {
  if (!val || String(val).trim() === '' || String(val).trim().toUpperCase() === 'X') return 'Não informado';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  if (['JR', 'JUNIOR', 'JÚNIOR'].includes(upper)) return 'Junior';
  if (upper === 'CRISTIAN/JR') return 'Cristian / Junior';
  if (['SEGUNDIM', 'SEGUNDO'].includes(upper)) return 'Segundo';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function cleanSector(val) {
  if (!val || String(val).trim() === '') return 'Outro';
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (lower.includes('produção') || lower.includes('producao')) return 'Produção';
  if (lower.includes('depósito') || lower.includes('deposito')) return 'Depósito';
  if (lower.includes('administrativo')) return 'Administrativo';
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function cleanArea(val) {
  if (!val || String(val).trim() === '') return 'Mecânica';
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (lower.includes('elétrica') || lower.includes('eletrica')) return 'Elétrica';
  if (lower.includes('mecânica') || lower.includes('mecanica')) return 'Mecânica';
  if (lower.includes('predial')) return 'Predial';
  if (lower.includes('automação') || lower.includes('automacao')) return 'Automação';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function cleanType(val) {
  if (!val || String(val).trim() === '') return 'Corretiva';
  const str = String(val).trim().toUpperCase();
  if (str.includes('CORRETIVA')) return 'Corretiva';
  if (str.includes('PREVENTIVA')) return 'Preventiva';
  if (str.includes('MELHORIA')) return 'Melhoria';
  if (str.includes('EXPANSÃO') || str.includes('EXPANSAO')) return 'Expansão';
  if (str.includes('APOIO')) return 'Apoio Técnico';
  return 'Corretiva';
}

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Iniciando transação única no banco de dados Supabase...');
    await client.query('BEGIN');

    // Parse valid rows
    const records = [];
    const sectorsSet = new Set();
    const respSet = new Set();
    const areasSet = new Set();
    const typesSet = new Set();

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;
      const hasContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      if (!hasContent) continue;

      const rawData = row[0];
      const rawDesc = row[3];
      if (rawData === 'Data' || rawDesc === 'Descrição do Serviço') continue;

      const dataSol = parseDate(rawData);
      if (!dataSol) continue;
      
      const year = parseInt(dataSol.split('-')[0], 10);
      if (year !== 2026) continue; // Somente registros de 2026

      const horaSol = parseTime(row[1]);
      const setor = cleanSector(row[2]);
      const descricao = row[3] ? String(row[3]).trim() : '';
      if (!descricao) continue;

      const tipoManutencao = cleanType(row[4] || row[18]);
      const responsavel = cleanResponsible(row[5]);
      const prioridade = cleanPriority(row[6]);
      const dataExec = parseDate(row[7]);
      const horaInicio = parseTime(row[8]);
      const horaTermino = parseTime(row[9]);
      const observacao = row[10] ? String(row[10]).trim() : '';
      const status = cleanStatusToDb(row[11]);
      const areaTecnica = cleanArea(row[14]);
      const prazoExec = parseDate(row[15]);

      sectorsSet.add(setor);
      if (responsavel !== 'Não informado') respSet.add(responsavel);
      areasSet.add(areaTecnica);
      typesSet.add(tipoManutencao);

      records.push({
        dataSol, horaSol, setor, descricao, tipoManutencao, responsavel,
        prioridade, dataExec, horaInicio, horaTermino, observacao, status,
        areaTecnica, prazoExec
      });
    }

    console.log(`\nLinhas válidas encontradas exclusivamente para 2026: ${records.length}`);

    if (records.length === 0) {
      throw new Error('Nenhuma ordem de serviço válida de 2026 foi encontrada na planilha!');
    }

    // Insert Master Lookups to prevent missing records
    console.log('Inserindo cadastros mestre nas tabelas de lookups...');
    for (const s of sectorsSet) {
      await client.query(`INSERT INTO cadastros_setores (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome`, [s]);
    }
    for (const r of respSet) {
      await client.query(`INSERT INTO cadastros_tecnicos (nome, area_atuacao) VALUES ($1, 'Manutenção Geral') ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome`, [r]);
    }
    for (const a of areasSet) {
      await client.query(`INSERT INTO cadastros_areas_tecnicas (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome`, [a]);
    }
    for (const t of typesSet) {
      await client.query(`INSERT INTO cadastros_tipos_manutencao (nome) VALUES ($1) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome`, [t]);
    }

    // Truncate existing OS
    console.log('Limpando tabela ordens_servico no Supabase...');
    await client.query(`TRUNCATE TABLE ordens_servico RESTART IDENTITY CASCADE`);

    // Insert new clean records
    console.log(`Inserindo ${records.length} novas ordens de serviço no banco Supabase...`);
    for (const rec of records) {
      await client.query(`
        INSERT INTO ordens_servico (
          data_solicitacao, hora_solicitacao, setor, descricao, tipo_manutencao,
          responsavel, area_tecnica, prioridade, prazo_execucao, data_execucao,
          horario_inicio, horario_termino, observacao, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        rec.dataSol, rec.horaSol, rec.setor, rec.descricao, rec.tipoManutencao,
        rec.responsavel, rec.areaTecnica, rec.prioridade, rec.prazoExec, rec.dataExec,
        rec.horaInicio, rec.horaTermino, rec.observacao, rec.status
      ]);
    }

    await client.query('COMMIT');
    console.log('\n[SUCESSO] Atualização concluída! Transação salva.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n[ERRO] A transação falhou e todos os passos foram revertidos:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

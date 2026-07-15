import * as XLSX from 'xlsx';
import { MaintenanceRecord, MasterLookupData, ExcelParserResult, PriorityType, StatusType } from '../types';

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Converts Excel serial dates to a JavaScript Date object in UTC to avoid timezone shifts
export function parseExcelDate(val: any): Date | null {
  if (val === undefined || val === null || val === '') return null;
  
  if (typeof val === 'number') {
    if (val < 1) return null; // Time-only serial
    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + Math.floor(val));
    
    // Add fractional time
    const frac = val - Math.floor(val);
    if (frac > 0) {
      const totalSeconds = Math.round(frac * 86400);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      date.setUTCHours(hours, minutes, seconds);
    }
    return date;
  }
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === '0') return null;
    
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) return new Date(parsed);
    
    // Check for DD/MM/YYYY format
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(Date.UTC(year, month, day));
      }
    }
  }
  
  return null;
}

// Converts Excel serial time or string to HH:MM format
export function parseExcelTime(val: any): string {
  if (val === undefined || val === null || val === '') return '';
  
  if (typeof val === 'number') {
    // e.g. 0.2916666666666667 -> 07:00
    const totalSeconds = Math.round(val * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '' || trimmed === '0') return '';
    // If it's already HH:MM or HH:MM:SS
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const parts = trimmed.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1]}`;
    }
    return trimmed;
  }
  
  return String(val);
}

// Standardizes status based on requested rules
export function cleanStatus(val: any): StatusType {
  if (val === undefined || val === null) return 'Não iniciado';
  const str = String(val).trim().toLowerCase();
  
  if (str === '' || str === '0') return 'Não iniciado';
  
  if (['feito', 'feito ', 'feito  ', 'feito   ', 'feit', 'encerrado', 'encerrada'].includes(str)) {
    return 'Concluído';
  }
  if (['em andamento', 'em andamento ', 'andamento', 'em Andamento'].includes(str)) {
    return 'Em andamento';
  }
  if (str === 'atrasado') {
    return 'Atrasado';
  }
  
  return 'Não iniciado';
}

// Standardizes priority based on requested rules
export function cleanPriority(val: any): PriorityType {
  if (val === undefined || val === null) return 'Média';
  const str = String(val).trim().toLowerCase();
  
  if (str === '1' || str === 'alta') return 'Alta';
  if (str === '2' || str === 'média' || str === 'media') return 'Média';
  if (str === '3' || str === 'baixa') return 'Baixa';
  
  return 'Média';
}

// Standardizes maintenance type based on requested rules
export function cleanMaintenanceType(val: any): string {
  if (val === undefined || val === null) return 'Outro';
  const str = String(val).trim().toUpperCase();
  
  if (str.includes('CORRETIVA')) return 'Corretiva';
  if (str.includes('PREVENTIVA')) return 'Preventiva';
  if (str.includes('MELHORIA')) return 'Melhoria';
  if (str.includes('EXPANSÃO') || str.includes('EXPANSAO')) return 'Expansão';
  if (str.includes('APOIO TÉCNICO') || str.includes('APOIO TECNICO')) return 'Apoio técnico';
  
  if (str.length === 0) return 'Outro';
  
  // Format as Capitalized
  return str.charAt(0) + str.slice(1).toLowerCase();
}

// Standardizes sector names based on requested rules
export function cleanSector(val: any): string {
  if (val === undefined || val === null) return 'Outro';
  const str = String(val).trim();
  const lower = str.toLowerCase();
  
  if (lower === 'produção' || lower === 'produção ' || lower === 'produção  ' || lower === 'producao' || lower === 'producao ') {
    return 'Produção';
  }
  if (lower === 'depósito' || lower === 'deposito' || lower === 'deposito ') {
    return 'Depósito';
  }
  if (lower === 'administrativo' || lower === 'admnistrativo') {
    return 'Administrativo';
  }
  
  if (str.length === 0) return 'Outro';
  
  // Capitalize properly
  return str.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Standardizes maintenance area technical sector
export function cleanMaintenanceSector(val: any): string {
  if (val === undefined || val === null) return 'Outro';
  const str = String(val).trim();
  const lower = str.toLowerCase();
  
  if (lower === 'elétrica' || lower === 'eletrica') return 'Elétrica';
  if (lower === 'mecânica' || lower === 'mecanica' || lower === 'mecanica ' || lower === 'mecânica ') return 'Mecânica';
  if (lower === 'predial') return 'Predial';
  if (lower === 'automação' || lower === 'automacao') return 'Automação';
  
  if (str.length === 0) return 'Outro';
  
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Clean technician names
export function cleanResponsible(val: any): string {
  if (val === undefined || val === null || String(val).trim() === '') return 'Não informado';
  const str = String(val).trim();
  const upper = str.toUpperCase();
  
  if (upper === 'X') return 'Não informado';
  if (['JR', 'JUNIOR', 'JÚNIOR'].includes(upper)) return 'Junior';
  if (upper === 'CRISTIAN/JR') return 'Cristian / Junior';
  if (['SEGUNDIM', 'SEGUNDO'].includes(upper)) return 'Segundo';
  
  return str.split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Formats month string
export function getMonthStr(date: Date | null, rawMes?: string): string {
  if (date) {
    const m = date.getUTCMonth();
    const y = date.getUTCFullYear();
    // Exclude outliers (e.g. year 1900 placeholders)
    if (y > 2020 && y < 2035) {
      return `${MONTHS_PT[m]}/${y}`;
    }
  }
  
  if (rawMes) {
    const rawStr = String(rawMes).trim();
    // Handle formats like "42025" or "122025" or "12026"
    const match = rawStr.match(/^(\d{1,2})(\d{4})$/);
    if (match) {
      const m = parseInt(match[1], 10) - 1;
      const y = parseInt(match[2], 10);
      if (m >= 0 && m < 12 && y > 2020 && y < 2035) {
        return `${MONTHS_PT[m]}/${y}`;
      }
    }
  }
  
  return 'Outro';
}

// Formats date to YYYY-MM-DD
export function formatDateStr(date: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

// Parses workbook array buffer
export function parseMaintenanceWorkbook(arrayBuffer: ArrayBuffer, fileName: string): ExcelParserResult {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  // 1. Parse 'Responsáveis' Sheet for Master Lookups
  const masterLookups: MasterLookupData = {
    responsibles: [],
    sectors: [],
    priorities: [],
    maintenanceSectors: []
  };
  
  const respSheet = workbook.Sheets['Responsáveis'];
  if (respSheet) {
    const rawRows = XLSX.utils.sheet_to_json<any[]>(respSheet, { header: 1 });
    
    // We start from index 2 (Row 3 in Excel) since headers are in Row 2
    for (let r = 2; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row) continue;
      
      // Col 0: Responsáveis
      if (row[0] && typeof row[0] === 'string' && row[0].trim() !== '') {
        const cleaned = cleanResponsible(row[0]);
        if (!masterLookups.responsibles.includes(cleaned) && cleaned !== 'Não informado') {
          masterLookups.responsibles.push(cleaned);
        }
      }
      
      // Col 1: Setor
      if (row[1] && typeof row[1] === 'string' && row[1].trim() !== '') {
        const cleaned = cleanSector(row[1]);
        if (!masterLookups.sectors.includes(cleaned) && cleaned !== 'Outro') {
          masterLookups.sectors.push(cleaned);
        }
      }
      
      // Col 3: Prioridades
      if (row[3] && typeof row[3] === 'string' && row[3].trim() !== '') {
        const cleaned = cleanPriority(row[3]);
        if (!masterLookups.priorities.includes(cleaned)) {
          masterLookups.priorities.push(cleaned);
        }
      }
      
      // Col 6: Setor da Manutenção
      if (row[6] && typeof row[6] === 'string' && row[6].trim() !== '') {
        const cleaned = cleanMaintenanceSector(row[6]);
        if (!masterLookups.maintenanceSectors.includes(cleaned) && cleaned !== 'Outro') {
          masterLookups.maintenanceSectors.push(cleaned);
        }
      }
    }
  }

  // Fallbacks if Responsáveis sheet was empty or missing
  if (masterLookups.priorities.length === 0) masterLookups.priorities = ['Alta', 'Média', 'Baixa'];
  if (masterLookups.sectors.length === 0) {
    masterLookups.sectors = ['Depósito', 'Administrativo', 'Qualidade', 'Projeto Novo', 'Manutenção Predial', 'Produção'];
  }
  if (masterLookups.maintenanceSectors.length === 0) {
    masterLookups.maintenanceSectors = ['Elétrica', 'Mecânica', 'Automação', 'Predial'];
  }

  // 2. Parse 'Gerenciador de Atividades' Sheet for OS
  const records: MaintenanceRecord[] = [];
  const activitySheet = workbook.Sheets['Gerenciador de Atividades'];
  
  if (activitySheet) {
    const rawRows = XLSX.utils.sheet_to_json<any[]>(activitySheet, { header: 1 });
    const today = new Date();
    
    // Header is row 0. Data starts at row 1.
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      // Skip empty rows or rows that do not have description or date
      if (!row || row.length === 0) continue;
      
      // If the row is completely empty of significant fields, skip
      const hasContent = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
      if (!hasContent) continue;
      
      const rawDataVal = row[0];
      const rawDescVal = row[3];
      
      // We skip header repeat rows or rows with no content
      if (rawDataVal === 'Data' || rawDescVal === 'Descrição do Serviço') continue;
      
      const data = parseExcelDate(rawDataVal);
      const horaSolicitacao = parseExcelTime(row[1]);
      const sector = cleanSector(row[2]);
      const descricao = row[3] ? String(row[3]).trim() : '';
      
      // Skip if there's no description and no date (empty buffer rows in Excel)
      if (!descricao && !data) continue;
      
      const tipoManutencao = cleanMaintenanceType(row[4] || row[18]);
      const responsavel = cleanResponsible(row[5]);
      const prioridade = cleanPriority(row[6]);
      const dataExecucao = parseExcelDate(row[7]);
      const horarioInicio = parseExcelTime(row[8]);
      const horarioTermino = parseExcelTime(row[9]);
      const observacao = row[10] ? String(row[10]).trim() : '';
      
      // Raw percentage status
      let pctStatus = 0;
      if (typeof row[12] === 'number') {
        pctStatus = row[12];
      } else if (row[12] !== undefined && row[12] !== null) {
        const parsedPct = parseFloat(String(row[12]).replace('%', '').trim());
        if (!isNaN(parsedPct)) {
          pctStatus = parsedPct > 1 ? parsedPct / 100 : parsedPct;
        }
      }
      
      // Clean Status
      let status = cleanStatus(row[11]);
      
      // Date handling for deadlines
      const prazoExecucao = parseExcelDate(row[15]);
      const prazo = row[17] ? String(row[17]).trim() : '';
      
      // Calculate Atrasado: 
      // If the ticket is not Concluído (Não iniciado or Em andamento)
      // and has a prazoExecucao date in the past relative to Today
      let isCalculatedAtrasado = false;
      if (status !== 'Concluído') {
        if (prazoExecucao && prazoExecucao < today) {
          isCalculatedAtrasado = true;
          status = 'Atrasado'; // override status to Atrasado
        } else if (status === 'Atrasado') {
          isCalculatedAtrasado = true;
        }
      }

      // If the Excel explicitly has status "Atrasado", override too
      if (row[11] && String(row[11]).trim().toLowerCase() === 'atrasado') {
        status = 'Atrasado';
        isCalculatedAtrasado = true;
      }
      
      const mesRaw = row[13] ? String(row[13]).trim() : '';
      const mesStr = getMonthStr(data, mesRaw);
      const setorManutencao = cleanMaintenanceSector(row[14]);

      // Standardize the technician list into our lookup
      if (responsavel !== 'Não informado' && !masterLookups.responsibles.includes(responsavel)) {
        masterLookups.responsibles.push(responsavel);
      }

      records.push({
        id: `os-${r}-${data ? data.getTime() : 'raw'}`,
        data,
        dataStr: formatDateStr(data),
        horaSolicitacao,
        setor: sector,
        descricao,
        tipoManutencao,
        responsavel,
        prioridade,
        dataExecucao,
        dataExecucaoStr: formatDateStr(dataExecucao),
        horarioInicio,
        horarioTermino,
        observacao,
        status,
        pctStatus,
        mesRaw,
        mesStr,
        setorManutencao,
        prazoExecucao,
        prazoExecucaoStr: formatDateStr(prazoExecucao),
        prazo,
        isCalculatedAtrasado
      });
    }
  }

  // Sort records chronologically by date (newest first, or null dates at the end)
  records.sort((a, b) => {
    if (!a.data) return 1;
    if (!b.data) return -1;
    return b.data.getTime() - a.data.getTime();
  });

  return {
    records,
    masterLookups,
    originalFileName: fileName
  };
}

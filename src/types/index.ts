export type PriorityType = 'Alta' | 'Média' | 'Baixa';

export type StatusType = 'Concluído' | 'Em andamento' | 'Não iniciado' | 'Atrasado';

export interface MaintenanceRecord {
  id: string; // Unique ID (e.g. index or generated uuid)
  data: Date | null; // Parse date object
  dataStr: string; // YYYY-MM-DD
  horaSolicitacao: string; // HH:MM
  setor: string; // Standardized Sector
  descricao: string; // Service description
  tipoManutencao: string; // Standardized maintenance type
  responsavel: string; // Standardized technician/executor
  prioridade: PriorityType; // Standardized priority
  dataExecucao: Date | null; // Date of execution OS
  dataExecucaoStr: string;
  horarioInicio: string;
  horarioTermino: string;
  observacao: string;
  status: StatusType; // Standardized status
  pctStatus: number; // raw value e.g. 1 (100%), 0.5 (50%), 0 (0%)
  mesRaw: string; // raw month key from excel e.g. "42025"
  mesStr: string; // Standardized month e.g. "Abr/2025"
  setorManutencao: string; // Standardized maintenance technical sector
  prazoExecucao: Date | null;
  prazoExecucaoStr: string;
  prazo: string;
  isCalculatedAtrasado: boolean;
}

export interface MasterLookupData {
  responsibles: string[];
  sectors: string[];
  priorities: string[];
  maintenanceSectors: string[];
}

export interface ExcelParserResult {
  records: MaintenanceRecord[];
  masterLookups: MasterLookupData;
  originalFileName: string;
}

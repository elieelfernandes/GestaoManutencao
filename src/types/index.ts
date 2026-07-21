export type PriorityType = 'Alta' | 'Média' | 'Baixa';

export type StatusType = 'Concluído' | 'Em andamento' | 'Não iniciado' | 'Atrasado';

export interface MaintenanceRecord {
  id: string; // UUID primary key
  dataSolicitacaoStr: string; // YYYY-MM-DD
  horaSolicitacao: string; // HH:MM
  setor: string; // Requester Sector
  descricao: string; // Service description
  tipoManutencao: string; // Maintenance type
  responsavel: string; // Technician name
  areaTecnica: string; // Technical area (Mecânica, Elétrica, etc.)
  prioridade: PriorityType; // Priority
  prazoExecucaoStr: string; // YYYY-MM-DD
  dataExecucaoStr: string; // YYYY-MM-DD
  horarioInicio: string; // HH:MM
  horarioTermino: string; // HH:MM
  observacao: string; // Notes
  status: StatusType; // Status
  createdAt?: string;
  
  // Optional helpers for date calculations
  data?: Date | null;
  dataExecucao?: Date | null;
  prazoExecucao?: Date | null;
  mesStr?: string;
  setorManutencao?: string;
  prazo?: string;
}

export interface MasterLookupItem {
  id: number;
  nome: string;
  areaAtuacao?: string;
  category: 'tecnico' | 'setor' | 'area_tecnica' | 'tipo_manutencao';
}

export interface MasterLookupData {
  responsibles: string[];
  sectors: string[];
  maintenanceSectors: string[];
  types: string[];
  priorities: string[];
}

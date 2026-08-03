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

export type AssetCategory = 
  | 'Máquinas e Equipamentos'
  | 'Veículos'
  | 'Tecnologia da Informação'
  | 'Móveis e Utensílios'
  | 'Instrumentos de Medição'
  | 'Segurança'
  | 'Infraestrutura'
  | 'Outros';

export type AssetConservation = 'Ótimo' | 'Bom' | 'Regular' | 'Ruim' | 'Inservível';

export type AssetSituation = 'Ativo' | 'Em Manutenção' | 'Baixado' | 'Alienado' | 'Extraviado';

export interface AssetRecord {
  id: number;
  numeroPatrimonio: string;
  descricao: string;
  categoria: AssetCategory;
  setorId: number | null;
  setorNome?: string;
  responsavelId: number | null;
  responsavelNome?: string;
  marcaFabricante: string | null;
  modeloReferencia: string | null;
  dataAquisicaoStr: string | null; // YYYY-MM-DD
  valorAquisicao: number | null;
  estadoConservacao: AssetConservation | null;
  situacao: AssetSituation;
  numeroNotaFiscal: string | null;
  fornecedor: string | null;
  vidaUtilAnos: number | null;
  depreciacaoAnualPct: number | null;
  observacoes: string | null;
  createdAt?: string;
  updatedAt?: string;
  depreciacaoAcumulada?: number;
  valorResidual?: number;
}

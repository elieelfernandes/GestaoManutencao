'use client';

import React from 'react';
import { Filter, RotateCcw, Calendar, Search } from 'lucide-react';
import { MasterLookupData, MaintenanceRecord } from '../types';
import MultiSelectFilter from './MultiSelectFilter';

export interface FilterState {
  startDate: string;
  endDate: string;
  months: string[];
  sectors: string[];
  statuses: string[];
  types: string[];
  priorities: string[];
  responsibles: string[];
  maintSectors: string[];
  search: string;
}

interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  lookups: MasterLookupData;
  records: MaintenanceRecord[];
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function getMonthStr(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${MONTH_NAMES[monthIdx]} ${year}`;
    }
  }
  return '';
}

export default function FilterPanel({ filters, setFilters, lookups, records }: FilterPanelProps) {
  
  const getUniqueValues = (key: keyof MaintenanceRecord) => {
    const vals = records.map(r => {
      const val = r[key];
      if (val instanceof Date) return val.toISOString().split('T')[0];
      return String(val);
    }).filter(v => v && v.trim() !== '' && v !== 'null' && v !== 'undefined' && v !== 'Não informado' && v !== 'Outro');
    return Array.from(new Set(vals)).sort();
  };

  const sectors = lookups.sectors.length > 0 ? lookups.sectors : getUniqueValues('setor');
  const responsibles = lookups.responsibles.length > 0 ? lookups.responsibles : getUniqueValues('responsavel');
  const priorities = ['Alta', 'Média', 'Baixa'];
  const statuses = ['Concluído', 'Em andamento', 'Não iniciado', 'Atrasado'];
  const maintSectors = lookups.maintenanceSectors.length > 0 ? lookups.maintenanceSectors : getUniqueValues('areaTecnica');
  const types = lookups.types.length > 0 ? lookups.types : getUniqueValues('tipoManutencao');

  // Dynamically extract and format available months from records
  const months = React.useMemo(() => {
    const vals = records
      .map(r => r.mesStr || getMonthStr(r.dataSolicitacaoStr))
      .filter((v): v is string => !!v && v.trim() !== '');
    
    return Array.from(new Set(vals)).sort((a, b) => {
      const parseMonth = (s: string) => {
        const parts = s.split(' ');
        const mName = parts[0];
        const yStr = parts[1];
        const mIdx = MONTH_NAMES.indexOf(mName);
        const y = parseInt(yStr, 10);
        return new Date(y || 2026, mIdx >= 0 ? mIdx : 0, 1).getTime();
      };
      return parseMonth(b) - parseMonth(a);
    });
  }, [records]);

  const handleTextChange = (name: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (name: keyof FilterState, value: string[]) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      months: [],
      sectors: [],
      statuses: [],
      types: [],
      priorities: [],
      responsibles: [],
      maintSectors: [],
      search: ''
    });
  };

  const activeFiltersCount = 
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    filters.months.length +
    filters.sectors.length +
    filters.statuses.length +
    filters.types.length +
    filters.priorities.length +
    filters.responsibles.length +
    filters.maintSectors.length +
    (filters.search ? 1 : 0);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
        <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>Filtros de Pesquisa</span>
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              {activeFiltersCount} ativos
            </span>
          )}
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          Limpar Filtros
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* Search Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Buscar na Descrição</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-550" />
            <input 
              type="text"
              placeholder="Digite termos para busca..."
              value={filters.search}
              onChange={(e) => handleTextChange('search', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Date Period - Start */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Início</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
            <input 
              type="date" 
              value={filters.startDate}
              onChange={(e) => handleTextChange('startDate', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all"
            />
          </div>
        </div>

        {/* Date Period - End */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Fim</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-550 pointer-events-none" />
            <input 
              type="date" 
              value={filters.endDate}
              onChange={(e) => handleTextChange('endDate', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all"
            />
          </div>
        </div>

        {/* Multi-select: Month */}
        <MultiSelectFilter
          label="Mês de Referência"
          allLabel="Todos os Meses"
          options={months}
          selected={filters.months}
          onChange={(vals) => handleArrayChange('months', vals)}
        />

        {/* Multi-select: Sector */}
        <MultiSelectFilter
          label="Setor Requisitante"
          allLabel="Todos os Setores"
          options={sectors}
          selected={filters.sectors}
          onChange={(vals) => handleArrayChange('sectors', vals)}
        />

        {/* Multi-select: Status */}
        <MultiSelectFilter
          label="Status Atividade"
          allLabel="Todos os Status"
          options={statuses}
          selected={filters.statuses}
          onChange={(vals) => handleArrayChange('statuses', vals)}
        />

        {/* Multi-select: Type */}
        <MultiSelectFilter
          label="Tipo Manutenção"
          allLabel="Todos os Tipos"
          options={types}
          selected={filters.types}
          onChange={(vals) => handleArrayChange('types', vals)}
        />

        {/* Multi-select: Priority */}
        <MultiSelectFilter
          label="Prioridade"
          allLabel="Todas as Prioridades"
          options={priorities}
          selected={filters.priorities}
          onChange={(vals) => handleArrayChange('priorities', vals)}
        />

        {/* Multi-select: Responsible */}
        <MultiSelectFilter
          label="Responsável Técnico"
          allLabel="Todos os Técnicos"
          options={responsibles}
          selected={filters.responsibles}
          onChange={(vals) => handleArrayChange('responsibles', vals)}
        />

        {/* Multi-select: Maintenance Technical Area */}
        <div className="sm:col-span-2 md:col-span-1">
          <MultiSelectFilter
            label="Setor da Manutenção (Área)"
            allLabel="Todas as Áreas Técnicas"
            options={maintSectors}
            selected={filters.maintSectors}
            onChange={(vals) => handleArrayChange('maintSectors', vals)}
          />
        </div>

      </div>

    </div>
  );
}

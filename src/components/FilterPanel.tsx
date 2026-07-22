'use client';

import React from 'react';
import { Filter, RotateCcw, Calendar, Search } from 'lucide-react';
import { MasterLookupData, MaintenanceRecord } from '../types';

export interface FilterState {
  startDate: string;
  endDate: string;
  month: string;
  sector: string;
  status: string;
  type: string;
  priority: string;
  responsible: string;
  maintSector: string;
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
  
  // Extract unique values from records as a fallback/complement
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
  
  // Gather dynamic maintenance types from records
  const types = lookups.types.length > 0 ? lookups.types : getUniqueValues('tipoManutencao');

  // Dynamically extract and format available months from records (e.g., "Janeiro 2026", "Fevereiro 2026")
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
      return parseMonth(b) - parseMonth(a); // Most recent month first
    });
  }, [records]);

  const handleSelectChange = (name: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      month: '',
      sector: '',
      status: '',
      type: '',
      priority: '',
      responsible: '',
      maintSector: '',
      search: ''
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-500" />
          Filtros de Pesquisa
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-700/50"
        >
          <RotateCcw className="w-3 h-3" />
          Limpar Filtros
        </button>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* Search Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buscar na Descrição</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Digite termos para busca..."
              value={filters.search}
              onChange={(e) => handleSelectChange('search', e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Date Period - Start */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Início</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
            <input 
              type="date"
              value={filters.startDate}
              onChange={(e) => handleSelectChange('startDate', e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all"
            />
          </div>
        </div>

        {/* Date Period - End */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Fim</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
            <input 
              type="date"
              value={filters.endDate}
              onChange={(e) => handleSelectChange('endDate', e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all"
            />
          </div>
        </div>

        {/* Month Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mês de Referência</label>
          <select
            value={filters.month}
            onChange={(e) => handleSelectChange('month', e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
          >
            <option value="">Todos os Meses</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Sector Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setor Requisitante</label>
          <select
            value={filters.sector}
            onChange={(e) => handleSelectChange('sector', e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
          >
            <option value="">Todos os Setores</option>
            {sectors.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Atividade</label>
          <select
            value={filters.status}
            onChange={(e) => handleSelectChange('status', e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
          >
            <option value="">Todos os Status</option>
            {statuses.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        {/* Maintenance Type Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo Manutenção</label>
          <select
            value={filters.type}
            onChange={(e) => handleSelectChange('type', e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
          >
            <option value="">Todos os Tipos</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prioridade</label>
          <select
            value={filters.priority}
            onChange={(e) => handleSelectChange('priority', e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
          >
            <option value="">Todas as Prioridades</option>
            {priorities.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Responsible Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Responsável Técnico</label>
          <select
            value={filters.responsible}
            onChange={(e) => handleSelectChange('responsible', e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
          >
            <option value="">Todos os Técnicos</option>
            {responsibles.map(resp => (
              <option key={resp} value={resp}>{resp}</option>
            ))}
          </select>
        </div>

        {/* Maintenance Sector Filter */}
        <div className="flex flex-col gap-1.5 sm:col-span-2 md:col-span-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Setor da Manutenção (Área)</label>
          <select
            value={filters.maintSector}
            onChange={(e) => handleSelectChange('maintSector', e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
          >
            <option value="">Todas as Áreas Técnicas</option>
            {maintSectors.map(ms => (
              <option key={ms} value={ms}>{ms}</option>
            ))}
          </select>
        </div>

      </div>

    </div>
  );
}

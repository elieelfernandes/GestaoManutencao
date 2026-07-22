'use client';

import React from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  Hourglass, 
  FileWarning, 
  AlertTriangle, 
  Percent, 
  Building2, 
  Settings, 
  User, 
  ShieldAlert 
} from 'lucide-react';
import { MaintenanceRecord } from '../types';

interface KPISectionProps {
  records: MaintenanceRecord[];
}

export default function KPISection({ records }: KPISectionProps) {
  const total = records.length;
  
  // Counts by status
  const completed = records.filter(r => r.status === 'Concluído').length;
  const inProgress = records.filter(r => r.status === 'Em andamento').length;
  const notStarted = records.filter(r => r.status === 'Não iniciado').length;
  const delayed = records.filter(r => r.status === 'Atrasado').length;

  // Percentage calculations
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  const inProgressRate = total > 0 ? (inProgress / total) * 100 : 0;
  const notStartedRate = total > 0 ? (notStarted / total) * 100 : 0;
  const delayedRate = total > 0 ? (delayed / total) * 100 : 0;

  // Helpers to get top values from distributions
  const getTopOccurrence = (list: string[]) => {
    if (list.length === 0) return { key: 'N/A', count: 0 };
    const counts: { [key: string]: number } = {};
    list.forEach(item => {
      if (item && item !== 'Não informado' && item !== 'Outro') {
        counts[item] = (counts[item] || 0) + 1;
      }
    });
    const keys = Object.keys(counts);
    if (keys.length === 0) return { key: 'N/A', count: 0 };
    return keys.reduce(
      (max, key) => (counts[key] > max.count ? { key, count: counts[key] } : max),
      { key: '', count: 0 }
    );
  };

  const topSector = getTopOccurrence(records.map(r => r.setor));
  const topType = getTopOccurrence(records.map(r => r.tipoManutencao));
  const topResponsible = getTopOccurrence(records.map(r => r.responsavel));
  const topMaintSector = getTopOccurrence(records.map(r => r.areaTecnica || r.setorManutencao || 'Outro'));

  return (
    <section className="space-y-6">
      
      {/* Primary KPI Grid (Numerical) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Requests */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Solicitações</span>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{total}</span>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">Ordens Totais</div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Concluído</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{completed}</span>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {completionRate.toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Em Andamento</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{inProgress}</span>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
              {inProgressRate.toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* Not Started */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-slate-400 dark:border-l-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Não Iniciado</span>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
              <FileWarning className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{notStarted}</span>
            <div className="text-[10px] text-slate-500 font-semibold mt-1">
              {notStartedRate.toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* Delayed */}
        <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 ${
          delayed > 0 ? 'border-l-red-500 bg-red-50/20 dark:bg-red-950/10' : 'border-l-slate-200 dark:border-l-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Atrasados</span>
            <div className={`p-1.5 rounded-lg ${delayed > 0 ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-3xl font-extrabold ${delayed > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{delayed}</span>
            <div className={`text-[10px] font-semibold mt-1 ${delayed > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
              {delayedRate.toFixed(1)}% do total
            </div>
          </div>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">Taxa Atendimento</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-white">{completionRate.toFixed(0)}%</span>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">Serviços Concluídos</div>
          </div>
        </div>

      </div>

      {/* Secondary Insight Cards (Demand Leaders) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Top Sector */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all shadow-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Setor Crítico (Chamados)</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{topSector.key}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{topSector.count} ordens de serviço</div>
          </div>
        </div>

        {/* Top Type */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all shadow-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <Settings className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Tipo mais Recorrente</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{topType.key}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{topType.count} solicitações</div>
          </div>
        </div>

        {/* Top Responsible */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all shadow-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Técnico mais Acionado</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{topResponsible.key}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{topResponsible.count} atividades</div>
          </div>
        </div>

        {/* Top Maintenance Sector */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-4 hover:border-slate-350 dark:hover:border-slate-700 transition-all shadow-sm">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Área Técnica Requisitada</div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">{topMaintSector.key}</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{topMaintSector.count} intervenções</div>
          </div>
        </div>

      </div>

    </section>
  );
}

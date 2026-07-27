'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, RefreshCw, AlertCircle } from 'lucide-react';
import { MaintenanceRecord, MasterLookupData } from '../types';
import FilterPanel, { FilterState, getMonthStr } from './FilterPanel';
import KPISection from './KPISection';
import DiagnosticPanel from './DiagnosticPanel';
import MaintenanceCharts from './MaintenanceCharts';
import AnalyticalTable from './AnalyticalTable';

export default function DashboardView() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [lookups, setLookups] = useState<MasterLookupData>({
    responsibles: [],
    sectors: [],
    maintenanceSectors: [],
    types: [],
    priorities: ['Alta', 'Média', 'Baixa']
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter States
  const [filters, setFilters] = useState<FilterState>({
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

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Fetch both in parallel
      const [resCad, resOrd] = await Promise.all([
        fetch('/api/cadastros'),
        fetch('/api/ordens')
      ]);

      const [jsonCad, jsonOrd] = await Promise.all([
        resCad.json(),
        resOrd.json()
      ]);

      if (resCad.ok) {
        setLookups({
          responsibles: (jsonCad.tecnicos || []).map((t: any) => t.nome),
          sectors: (jsonCad.setores || []).map((s: any) => s.nome),
          maintenanceSectors: (jsonCad.areasTecnicas || []).map((at: any) => at.nome),
          types: (jsonCad.tiposManutencao || []).map((tm: any) => tm.nome),
          priorities: ['Alta', 'Média', 'Baixa']
        });
      }

      if (!resOrd.ok) throw new Error(jsonOrd.error || 'Falha ao buscar dados do Dashboard');
      setRecords(jsonOrd.records || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão com o banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Filter records dynamically based on FilterState
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Period Date range filter (start Date)
      if (filters.startDate && r.dataSolicitacaoStr) {
        if (r.dataSolicitacaoStr < filters.startDate) return false;
      }
      
      // 2. Period Date range filter (end Date)
      if (filters.endDate && r.dataSolicitacaoStr) {
        if (r.dataSolicitacaoStr > filters.endDate) return false;
      }

      // Month filter
      if (filters.month) {
        const recordMonth = r.mesStr || getMonthStr(r.dataSolicitacaoStr);
        if (recordMonth !== filters.month) return false;
      }
      
      // 3. Sector filter
      if (filters.sector && r.setor !== filters.sector) return false;
      
      // 4. Status filter
      if (filters.status && r.status !== filters.status) return false;
      
      // 5. Maintenance Type filter
      if (filters.type && r.tipoManutencao !== filters.type) return false;
      
      // 6. Priority filter
      if (filters.priority && r.prioridade !== filters.priority) return false;
      
      // 7. Responsible filter
      if (filters.responsible && r.responsavel !== filters.responsible) return false;
      
      // 8. Maintenance Sector filter
      if (filters.maintSector && r.areaTecnica !== filters.maintSector) return false;
      
      // 9. Global Text Search
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const descMatch = r.descricao ? r.descricao.toLowerCase().includes(query) : false;
        const secMatch = r.setor ? r.setor.toLowerCase().includes(query) : false;
        const respMatch = r.responsavel ? r.responsavel.toLowerCase().includes(query) : false;
        const typeMatch = r.tipoManutencao ? r.tipoManutencao.toLowerCase().includes(query) : false;
        
        if (!descMatch && !secMatch && !respMatch && !typeMatch) return false;
      }
      
      return true;
    });
  }, [records, filters]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-500" /> ÁREA 3 — Dashboard Executivo
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Indicadores de desempenho, taxa de atendimento, diagnóstico de gargalos e visão gráfica em tempo real.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          Atualizar Dados
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 dark:text-red-300 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-650 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold leading-relaxed">
            <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">Erro no Dashboard:</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {isLoading ? (
        /* Loading Skeleton */
        <div className="h-[50vh] w-full flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-8 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Carregando métricas e gráficos em tempo real...</span>
        </div>
      ) : (
        <>
          {/* 1. Filter Panel */}
          <FilterPanel 
            filters={filters} 
            setFilters={setFilters} 
            lookups={lookups}
            records={records}
          />

          {/* 2. KPIs Section */}
          <KPISection records={filteredRecords} />

          {/* 3. Executive Diagnosis */}
          <DiagnosticPanel records={filteredRecords} />

          {/* 4. Interactive Recharts */}
          <div className="border-t border-slate-200 dark:border-slate-900 pt-6">
            <div className="mb-6">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-wide">Visões Gráficas Operacionais</h3>
              <p className="text-slate-400 dark:text-slate-550 text-xs mt-0.5">Distribuição estatística por setor, tipo, prioridade e técnico</p>
            </div>
            <MaintenanceCharts records={filteredRecords} />
          </div>

          {/* 5. Ordens de Serviço Filtradas (Tabela Analítica) */}
          <div className="border-t border-slate-200 dark:border-slate-900 pt-6 space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-wide">Ordens de Serviço Filtradas</h3>
              <p className="text-slate-400 dark:text-slate-550 text-xs mt-0.5">Detalhamento das ordens correspondentes aos filtros selecionados acima</p>
            </div>
            <AnalyticalTable records={filteredRecords} />
          </div>
        </>
      )}

    </div>
  );
}

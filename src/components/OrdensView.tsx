'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MaintenanceRecord, MasterLookupData } from '../types';
import FilterPanel, { FilterState } from './FilterPanel';
import AnalyticalTable from './AnalyticalTable';
import CreateOSModal from './CreateOSModal';
import EditOSModal from './EditOSModal';

export default function OrdensView() {
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);

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

  // Fetch Master Lookups & OS Records
  const fetchData = async () => {
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

      if (!resOrd.ok) throw new Error(jsonOrd.error || 'Falha ao buscar Ordens de Serviço');
      setRecords(jsonOrd.records || []);

    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão com o banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Delete OS (DELETE)
  const handleDeleteOS = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta Ordem de Serviço?')) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/ordens?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Erro ao excluir Ordem de Serviço');

      setSuccessMsg('Ordem de Serviço excluída com sucesso.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir Ordem de Serviço.');
    }
  };

  // Filter records dynamically
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Date start filter
      if (filters.startDate && r.dataSolicitacaoStr) {
        if (r.dataSolicitacaoStr < filters.startDate) return false;
      }
      // Date end filter
      if (filters.endDate && r.dataSolicitacaoStr) {
        if (r.dataSolicitacaoStr > filters.endDate) return false;
      }
      // Sector filter
      if (filters.sector && r.setor !== filters.sector) return false;
      // Status filter
      if (filters.status && r.status !== filters.status) return false;
      // Maintenance Type filter
      if (filters.type && r.tipoManutencao !== filters.type) return false;
      // Priority filter
      if (filters.priority && r.prioridade !== filters.priority) return false;
      // Responsible filter
      if (filters.responsible && r.responsavel !== filters.responsible) return false;
      // Area Tecnica filter
      if (filters.maintSector && r.areaTecnica !== filters.maintSector) return false;
      // Search
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const descMatch = r.descricao ? r.descricao.toLowerCase().includes(q) : false;
        const secMatch = r.setor ? r.setor.toLowerCase().includes(q) : false;
        const respMatch = r.responsavel ? r.responsavel.toLowerCase().includes(q) : false;
        if (!descMatch && !secMatch && !respMatch) return false;
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
            <ClipboardList className="w-6 h-6 text-blue-500" /> ÁREA 2 — Ordens de Serviço
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Abra novos chamados de manutenção, aplique filtros combinados e dê baixa com horários e pareceres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            Atualizar OS
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Nova Ordem de Serviço
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 animate-in fade-in dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
          <AlertCircle className="w-5 h-5 text-red-650 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold leading-relaxed">
            <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">Erro na Operação:</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-250 rounded-2xl p-4 flex items-start gap-3 text-emerald-800 animate-in fade-in dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{successMsg}</div>
        </div>
      )}

      {/* 1. Filter Panel & OS Table */}
      {isLoading ? (
        <div className="h-[40vh] w-full flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-8 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Carregando Ordens de Serviço...</span>
        </div>
      ) : (
        <>
          <FilterPanel 
            filters={filters} 
            setFilters={setFilters} 
            lookups={lookups}
            records={records}
          />

          <AnalyticalTable 
            records={filteredRecords}
            onEditOS={(rec) => setEditingRecord(rec)}
            onDeleteOS={handleDeleteOS}
          />
        </>
      )}

      {/* Modal Dialogs */}
      <CreateOSModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchData}
        lookups={lookups}
      />

      <EditOSModal 
        isOpen={!!editingRecord}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSuccess={fetchData}
        lookups={lookups}
      />

    </div>
  );
}

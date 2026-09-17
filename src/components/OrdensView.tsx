'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Plus, RefreshCw, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { MaintenanceRecord, MasterLookupData } from '../types';
import FilterPanel, { FilterState, getMonthStr } from './FilterPanel';
import AnalyticalTable from './AnalyticalTable';
import CreateOSModal from './CreateOSModal';
import EditOSModal from './EditOSModal';
import DeleteOSModal from './DeleteOSModal';
import AuditTimelineModal from './AuditTimelineModal';
import OrdensExcluidasView from './OrdensExcluidasView';

export default function OrdensView() {
  const [subTab, setSubTab] = useState<'ativas' | 'excluidas'>('ativas');
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
  const [deletingRecord, setDeletingRecord] = useState<MaintenanceRecord | null>(null);
  const [auditRecord, setAuditRecord] = useState<MaintenanceRecord | null>(null);

  // Filter States
  const [filters, setFilters] = useState<FilterState>({
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

  // Fetch Master Lookups & OS Records
  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Fetch cadastros, active users for responsibles, and ordens
      const [resCad, resUsers, resOrd] = await Promise.all([
        fetch('/api/cadastros'),
        fetch('/api/usuarios?mode=select'),
        fetch('/api/ordens')
      ]);

      const [jsonCad, jsonUsers, jsonOrd] = await Promise.all([
        resCad.json(),
        resUsers.json(),
        resOrd.json()
      ]);

      if (resCad.ok) {
        // Prefer active registered users as responsibles, fallback to cadastros_tecnicos
        const usersList: string[] = jsonUsers.usuarios ? jsonUsers.usuarios.map((u: any) => u.nome) : [];
        const cadastrosList: string[] = (jsonCad.tecnicos || []).map((t: any) => t.nome);
        const combinedResponsibles = Array.from(new Set([...usersList, ...cadastrosList]));

        setLookups({
          responsibles: combinedResponsibles,
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

  // Filter records dynamically
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filters.startDate && r.dataSolicitacaoStr) {
        if (r.dataSolicitacaoStr < filters.startDate) return false;
      }
      if (filters.endDate && r.dataSolicitacaoStr) {
        if (r.dataSolicitacaoStr > filters.endDate) return false;
      }
      if (filters.months && filters.months.length > 0) {
        const recordMonth = r.mesStr || getMonthStr(r.dataSolicitacaoStr);
        if (!filters.months.includes(recordMonth)) return false;
      }
      if (filters.sectors && filters.sectors.length > 0 && !filters.sectors.includes(r.setor)) return false;
      if (filters.statuses && filters.statuses.length > 0 && !filters.statuses.includes(r.status)) return false;
      if (filters.types && filters.types.length > 0 && !filters.types.includes(r.tipoManutencao)) return false;
      if (filters.priorities && filters.priorities.length > 0 && !filters.priorities.includes(r.prioridade)) return false;
      if (filters.responsibles && filters.responsibles.length > 0 && !filters.responsibles.includes(r.responsavel)) return false;
      if (filters.maintSectors && filters.maintSectors.length > 0 && !filters.maintSectors.includes(r.areaTecnica)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const descMatch = r.descricao ? r.descricao.toLowerCase().includes(q) : false;
        const secMatch = r.setor ? r.setor.toLowerCase().includes(q) : false;
        const respMatch = r.responsavel ? r.responsavel.toLowerCase().includes(q) : false;
        const typeMatch = r.tipoManutencao ? r.tipoManutencao.toLowerCase().includes(q) : false;
        if (!descMatch && !secMatch && !respMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [records, filters]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-500" /> Ordens de Serviço
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Abra novos chamados de manutenção, acompanhe auditorias e dê baixa com horários e pareceres técnicos.
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

      {/* Sub-tabs: Ordens Ativas vs Ordens Excluídas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setSubTab('ativas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'ativas'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Ordens Ativas ({records.length})
        </button>

        <button
          onClick={() => setSubTab('excluidas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            subTab === 'excluidas'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          Ordens Excluídas
        </button>
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

      {/* Tab Content */}
      {subTab === 'excluidas' ? (
        <OrdensExcluidasView />
      ) : (
        isLoading ? (
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
              onDeleteOS={(rec) => setDeletingRecord(rec)}
              onViewAudit={(rec) => setAuditRecord(rec)}
            />
          </>
        )
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

      {/* Mandatory Reason Delete Modal */}
      <DeleteOSModal
        isOpen={!!deletingRecord}
        order={deletingRecord}
        onClose={() => setDeletingRecord(null)}
        onSuccess={() => {
          setSuccessMsg('Ordem de serviço excluída com sucesso.');
          fetchData();
          setTimeout(() => setSuccessMsg(null), 3500);
        }}
      />

      {/* Audit Timeline Modal */}
      <AuditTimelineModal
        isOpen={!!auditRecord}
        order={auditRecord}
        onClose={() => setAuditRecord(null)}
      />

    </div>
  );
}

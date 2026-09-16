'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RefreshCw, 
  Search, 
  X, 
  History, 
  Calendar, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { MaintenanceRecord } from '../types';
import AuditTimelineModal from './AuditTimelineModal';

export default function OrdensExcluidasView() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedAuditOrder, setSelectedAuditOrder] = useState<MaintenanceRecord | null>(null);

  const fetchExcluidas = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ordens/excluidas');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar ordens excluídas.');
      setRecords(data.records || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao buscar ordens excluídas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExcluidas();
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Concluído':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30';
      case 'Em andamento':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30';
      case 'Atrasado':
        return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/30';
      default:
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/30';
    }
  };

  const filtered = records.filter(r => 
    r.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.setor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.responsavel && r.responsavel.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.excluidoPorNome && r.excluidoPorNome.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.motivoExclusao && r.motivoExclusao.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-500" /> Histórico de Ordens Excluídas (Soft Delete)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro protegido de ordens removidas das listagens ativas, preservando status e justificativas.
          </p>
        </div>

        <button
          onClick={fetchExcluidas}
          disabled={isLoading}
          className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          Atualizar
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por descrição, setor, responsável, quem excluiu ou motivo..."
          className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Excluded Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Ordem / Setor</th>
                <th className="py-3 px-4">Status Original</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Excluído Por</th>
                <th className="py-3 px-4">Data/Hora Exclusão</th>
                <th className="py-3 px-4">Motivo Obrigatório</th>
                <th className="py-3 px-4 text-center">Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    {isLoading ? 'Carregando...' : 'Nenhuma ordem excluída encontrada.'}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{r.setor}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={r.descricao}>{r.descricao}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Solicitação: {r.dataSolicitacaoStr}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(r.statusOriginal)}`}>
                        {r.statusOriginal || 'Não iniciado'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {r.responsavel}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-700 dark:text-slate-200">{r.excluidoPorNome || 'Sistema'}</p>
                        {r.excluidoPorLogin && <p className="text-[10px] text-slate-400 font-mono">@{r.excluidoPorLogin}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {r.excluidoEmFormatado || '—'}
                    </td>
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 rounded-xl p-2 text-[11px] text-rose-900 dark:text-rose-300 font-medium leading-relaxed">
                        {r.motivoExclusao || 'Sem justificativa registrada.'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedAuditOrder(r)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                        title="Ver Linha do Tempo e Histórico Completo"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Timeline Modal */}
      <AuditTimelineModal
        isOpen={!!selectedAuditOrder}
        order={selectedAuditOrder}
        onClose={() => setSelectedAuditOrder(null)}
      />

    </div>
  );
}

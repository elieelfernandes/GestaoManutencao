'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  X, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  RefreshCw 
} from 'lucide-react';
import { AuditRecord, MaintenanceRecord } from '../types';

interface AuditTimelineModalProps {
  isOpen: boolean;
  order: MaintenanceRecord | null;
  onClose: () => void;
}

export default function AuditTimelineModal({ isOpen, order, onClose }: AuditTimelineModalProps) {
  const [timeline, setTimeline] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order?.id) {
      setIsLoading(true);
      setErrorMsg(null);
      fetch(`/api/ordens/auditoria/${order.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          setTimeline(data.timeline || []);
        })
        .catch(err => {
          setErrorMsg(err.message || 'Erro ao carregar histórico.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const getActionBadge = (tipo: string) => {
    switch (tipo) {
      case 'CRIACAO':
        return {
          icon: <PlusCircle className="w-3.5 h-3.5 text-blue-500" />,
          label: 'Abertura da OS',
          color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40'
        };
      case 'BAIXA':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Conclusão / Baixa',
          color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
        };
      case 'ALTERACAO_STATUS':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-500" />,
          label: 'Alteração de Status',
          color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40'
        };
      case 'EXCLUSAO':
        return {
          icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
          label: 'Exclusão',
          color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
        };
      default:
        return {
          icon: <Edit3 className="w-3.5 h-3.5 text-slate-500" />,
          label: 'Edição de Dados',
          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh] space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-900/40">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Histórico & Auditoria de Movimentações
              </h3>
              <p className="text-[11px] text-slate-400">
                Ordem: <span className="font-semibold text-slate-600 dark:text-slate-300">{order.setor}</span> • {order.descricao.slice(0, 35)}...
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span>Carregando histórico da ordem...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-2xl text-rose-700 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          ) : timeline.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Nenhuma movimentação registrada anteriormente para esta ordem.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {timeline.map((item, idx) => {
                const badge = getActionBadge(item.tipoAcao);
                return (
                  <div key={item.id || idx} className="relative group">
                    {/* Circle marker on timeline */}
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>

                    {/* Timeline card */}
                    <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 space-y-2 shadow-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.icon} {badge.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.dataHoraFormatada}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {item.descricaoAcao}
                      </p>

                      {/* Author badge */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-200/40 dark:border-slate-850">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>Realizado por: <strong>{item.usuarioNome}</strong> (@{item.usuarioLogin})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { MaintenanceRecord } from '../types';

interface DeleteOSModalProps {
  isOpen: boolean;
  order: MaintenanceRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteOSModal({ isOpen, order, onClose, onSuccess }: DeleteOSModalProps) {
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim() || motivo.trim().length < 3) {
      setErrorMsg('O motivo da exclusão é obrigatório para fins de auditoria (mínimo 3 caracteres).');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ordens', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: order.id,
          motivoExclusao: motivo.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao excluir ordem de serviço.');
      }

      setMotivo('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao registrar exclusão da OS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/40">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Excluir Ordem de Serviço</h3>
              <p className="text-[11px] text-slate-400">Setor: {order.setor}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4">
          
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-2">
              {order.descricao}
            </p>
            <p className="text-[11px] text-slate-400">
              Responsável: <span className="font-semibold text-slate-600 dark:text-slate-300">{order.responsavel}</span> • Status atual: <span className="font-semibold text-blue-500">{order.status}</span>
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3 text-rose-800 dark:text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              Motivo da Exclusão <span className="text-rose-500">* (Obrigatório para Auditoria)</span>
            </label>
            <textarea
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva por que esta ordem está sendo excluída (ex: Ordem aberta em duplicidade por engano, cancelada pelo solicitante, etc.)..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-all font-medium resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || motivo.trim().length < 3}
              className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" /> Confirmar Exclusão
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

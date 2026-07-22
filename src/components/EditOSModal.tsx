'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Calendar, User, FileText, Wrench, AlertCircle } from 'lucide-react';
import { MaintenanceRecord, MasterLookupData, StatusType } from '../types';

interface EditOSModalProps {
  record: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lookups: MasterLookupData;
}

export default function EditOSModal({ record, isOpen, onClose, onSuccess, lookups }: EditOSModalProps) {
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        ...record,
        dataExecucaoStr: record.dataExecucaoStr || (record.status === 'Concluído' ? today : '')
      });
      setErrorMsg(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleStatusChange = (newStatus: StatusType) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    setFormData(prev => ({
      ...prev,
      status: newStatus,
      // If setting to Concluído, auto-fill execution date and end time if empty
      dataExecucaoStr: newStatus === 'Concluído' ? (prev.dataExecucaoStr || today) : prev.dataExecucaoStr,
      horarioTermino: newStatus === 'Concluído' ? (prev.horarioTermino || nowTime) : prev.horarioTermino,
      horarioInicio: newStatus === 'Em andamento' ? (prev.horarioInicio || nowTime) : prev.horarioInicio
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.status) {
      setErrorMsg('O status é obrigatório.');
      return;
    }

    const dataExecObj = formData.dataExecucaoStr ? new Date(formData.dataExecucaoStr + 'T00:00:00Z') : null;

    const updatedRecord: MaintenanceRecord = {
      ...record,
      ...formData,
      status: formData.status as StatusType,
      dataExecucao: dataExecObj,
      dataExecucaoStr: formData.dataExecucaoStr || '',
      horarioInicio: formData.horarioInicio || '',
      horarioTermino: formData.horarioTermino || '',
      observacao: formData.observacao || '',
      responsavel: formData.responsavel || record.responsavel
    };

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ordens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRecord)
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao atualizar Ordem de Serviço');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar as alterações no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Editar / Dar Baixa na OS</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Insira as informações de atendimento da ordem de serviço</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-850 rounded-full transition-all cursor-pointer"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local Error Message callout */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 animate-in slide-in-from-top duration-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">Erro ao Salvar:</strong>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Ticket Overview Badge */}
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Setor: <strong className="text-slate-800 dark:text-slate-200">{record.setor}</strong></span>
            <span>Solicitado em: <strong className="text-slate-800 dark:text-slate-200">{record.dataSolicitacaoStr || (record as any).dataStr || 'N/A'}</strong></span>
          </div>
          <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-relaxed">
            "{record.descricao}"
          </p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Status da Ordem de Serviço
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Concluído', 'Em andamento', 'Não iniciado', 'Atrasado'] as StatusType[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                    formData.status === st
                      ? st === 'Concluído'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/50'
                        : st === 'Em andamento'
                        ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50'
                        : st === 'Atrasado'
                        ? 'bg-rose-50 text-rose-800 border-rose-350 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/50'
                        : 'bg-slate-200 text-slate-850 border-slate-350 dark:bg-slate-750 dark:text-white dark:border-slate-600'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  disabled={isSubmitting}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsável Técnico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" /> Técnico Responsável
              </label>
              <select
                value={formData.responsavel || ''}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
                disabled={isSubmitting}
              >
                {lookups.responsibles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Data de Execução */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Data da Conclusão / Execução
              </label>
              <input 
                type="date" 
                value={formData.dataExecucaoStr || ''}
                onChange={(e) => setFormData({ ...formData, dataExecucaoStr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Horário Início */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Horário de Início
              </label>
              <input 
                type="text" 
                placeholder="Ex: 08:30"
                value={formData.horarioInicio || ''}
                onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>

            {/* Horário Término */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-550" /> Horário de Término
              </label>
              <input 
                type="text" 
                placeholder="Ex: 11:45"
                value={formData.horarioTermino || ''}
                onChange={(e) => setFormData({ ...formData, horarioTermino: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Observações técnicas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" /> Observação / Parecer Técnico
            </label>
            <textarea 
              rows={3}
              value={formData.observacao || ''}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Descreva o serviço realizado ou motivo de atraso..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl p-3 outline-none transition-all resize-none placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow transition-all flex items-center gap-2 cursor-pointer"
              disabled={isSubmitting}
            >
              <CheckCircle2 className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

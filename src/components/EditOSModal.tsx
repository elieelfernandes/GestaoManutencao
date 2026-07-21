'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Clock, Calendar, User, FileText, Wrench } from 'lucide-react';
import { MaintenanceRecord, MasterLookupData, StatusType } from '../types';

interface EditOSModalProps {
  record: MaintenanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedRecord: MaintenanceRecord) => void;
  lookups: MasterLookupData;
}

export default function EditOSModal({ record, isOpen, onClose, onSave, lookups }: EditOSModalProps) {
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({});

  useEffect(() => {
    if (record) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        ...record,
        dataExecucaoStr: record.dataExecucaoStr || (record.status === 'Concluído' ? today : '')
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.status) return;

    const dataExecObj = formData.dataExecucaoStr ? new Date(formData.dataExecucaoStr + 'T00:00:00Z') : null;
    const isConcluido = formData.status === 'Concluído';

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

    onSave(updatedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Editar / Dar Baixa na OS</h2>
              <p className="text-xs text-slate-400">ID: <span className="text-blue-400 font-mono">{record.id}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Overview Badge */}
        <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Setor: <strong className="text-slate-200">{record.setor}</strong></span>
            <span>Solicitado em: <strong className="text-slate-200">{record.dataSolicitacaoStr || (record as any).dataStr || 'N/A'}</strong></span>
          </div>
          <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed">
            "{record.descricao}"
          </p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Status Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Status da Ordem de Serviço
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Concluído', 'Em andamento', 'Não iniciado', 'Atrasado'] as StatusType[]).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                    formData.status === st
                      ? st === 'Concluído'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : st === 'Em andamento'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                        : st === 'Atrasado'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50'
                        : 'bg-slate-700 text-white border-slate-600'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsável Técnico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> Técnico Responsável
              </label>
              <select
                value={formData.responsavel || ''}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              >
                {lookups.responsibles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Data de Execução */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Data da Conclusão / Execução
              </label>
              <input 
                type="date" 
                value={formData.dataExecucaoStr || ''}
                onChange={(e) => setFormData({ ...formData, dataExecucaoStr: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Horário Início */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Horário de Início
              </label>
              <input 
                type="text" 
                placeholder="Ex: 08:30"
                value={formData.horarioInicio || ''}
                onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Horário Término */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Horário de Término
              </label>
              <input 
                type="text" 
                placeholder="Ex: 11:45"
                value={formData.horarioTermino || ''}
                onChange={(e) => setFormData({ ...formData, horarioTermino: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>
          </div>

          {/* Observações técnicas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Observação / Parecer Técnico
            </label>
            <textarea 
              rows={3}
              value={formData.observacao || ''}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Descreva o serviço realizado ou motivo de atraso..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl p-3 outline-none transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar Alterações
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

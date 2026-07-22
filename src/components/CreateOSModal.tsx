'use client';

import React, { useState, useEffect } from 'react';
import { X, Wrench, Calendar, Clock, AlertTriangle, User, Building, FileText, AlertCircle } from 'lucide-react';
import { MasterLookupData, MaintenanceRecord, PriorityType } from '../types';

interface CreateOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lookups: MasterLookupData;
}

export default function CreateOSModal({ isOpen, onClose, onSuccess, lookups }: CreateOSModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const [formData, setFormData] = useState({
    dataStr: today,
    horaSolicitacao: nowTime,
    setor: '',
    descricao: '',
    tipoManutencao: '',
    responsavel: '',
    prioridade: 'Média' as PriorityType,
    setorManutencao: '',
    prazoExecucaoStr: today,
    observacao: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Set default values when lookups are populated
  useEffect(() => {
    if (isOpen) {
      setFormData({
        dataStr: today,
        horaSolicitacao: nowTime,
        setor: lookups.sectors[0] || '',
        descricao: '',
        tipoManutencao: lookups.types[0] || 'Corretiva',
        responsavel: lookups.responsibles[0] || '',
        prioridade: 'Média',
        setorManutencao: lookups.maintenanceSectors[0] || '',
        prazoExecucaoStr: today,
        observacao: ''
      });
      setErrorMsg(null);
    }
  }, [lookups, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.descricao.trim()) {
      setErrorMsg('Por favor, informe a descrição do serviço.');
      return;
    }
    if (!formData.setor || !formData.tipoManutencao || !formData.responsavel || !formData.setorManutencao) {
      setErrorMsg('Todos os campos obrigatórios (Setor, Tipo, Responsável, Área) devem ser selecionados.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        dataSolicitacaoStr: formData.dataStr,
        horaSolicitacao: formData.horaSolicitacao,
        setor: formData.setor,
        descricao: formData.descricao.trim(),
        tipoManutencao: formData.tipoManutencao,
        responsavel: formData.responsavel,
        areaTecnica: formData.setorManutencao,
        prioridade: formData.prioridade,
        prazoExecucaoStr: formData.prazoExecucaoStr,
        observacao: formData.observacao.trim()
      };

      const res = await fetch('/api/ordens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao abrir nova Ordem de Serviço');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar a Ordem de Serviço no banco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const typesOptions = lookups.types.length > 0 ? lookups.types : ['Corretiva', 'Preventiva', 'Melhoria', 'Expansão', 'Apoio Técnico'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nova Ordem de Serviço</h2>
              <p className="text-xs text-slate-400">Preencha os dados do chamado de manutenção</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Local Error Message callout */}
        {errorMsg && (
          <div className="bg-red-950/40 border border-red-900/60 rounded-2xl p-4 flex items-start gap-3 text-red-300 animate-in slide-in-from-top duration-200">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              <strong className="block text-white font-bold mb-0.5">Erro no Formulário:</strong>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data Solicitação */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Data de Solicitação *
              </label>
              <input 
                type="date" 
                value={formData.dataStr}
                onChange={(e) => setFormData({ ...formData, dataStr: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              />
            </div>

            {/* Hora Solicitação */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Hora da Solicitação
              </label>
              <input 
                type="text" 
                value={formData.horaSolicitacao}
                placeholder="Ex: 08:30"
                onChange={(e) => setFormData({ ...formData, horaSolicitacao: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Setor Requisitante */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" /> Setor Requisitante *
              </label>
              <select
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              >
                <option value="" disabled>Selecione um setor...</option>
                {lookups.sectors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Tipo de Manutenção */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-400" /> Tipo de Manutenção *
              </label>
              <select
                value={formData.tipoManutencao}
                onChange={(e) => setFormData({ ...formData, tipoManutencao: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              >
                <option value="" disabled>Selecione o tipo...</option>
                {typesOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Prioridade *
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as PriorityType })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>

            {/* Responsável Técnico */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> Técnico Responsável *
              </label>
              <select
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              >
                <option value="" disabled>Selecione um técnico...</option>
                {lookups.responsibles.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Área Técnica */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" /> Área Técnica (Setor Manut.) *
              </label>
              <select
                value={formData.setorManutencao}
                onChange={(e) => setFormData({ ...formData, setorManutencao: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              >
                <option value="" disabled>Selecione a área...</option>
                {lookups.maintenanceSectors.map(ms => (
                  <option key={ms} value={ms}>{ms}</option>
                ))}
              </select>
            </div>

            {/* Prazo de Execução */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Prazo Limite desejado
              </label>
              <input 
                type="date" 
                value={formData.prazoExecucaoStr}
                onChange={(e) => setFormData({ ...formData, prazoExecucaoStr: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>
          </div>

          {/* Descrição do Serviço */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Descrição Detalhada da Solicitação *
            </label>
            <textarea 
              rows={3}
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o problema ou serviço necessário..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl p-3 outline-none transition-all resize-none"
              required
            />
          </div>

          {/* Observações adicionais */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              Observações Iniciais (Opcional)
            </label>
            <input 
              type="text" 
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              placeholder="Alguma observação adicional..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Ordem'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

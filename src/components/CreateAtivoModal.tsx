'use client';

import React, { useState, useEffect } from 'react';
import { Package, X, AlertCircle, Calendar, DollarSign, FileText, Clipboard, User, Tag } from 'lucide-react';
import { AssetCategory, AssetConservation, AssetSituation } from '../types';

interface CreateAtivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lookups: {
    sectors: { id: number; nome: string }[];
    tecnicos: { id: number; nome: string }[];
  };
}

export default function CreateAtivoModal({ isOpen, onClose, onSuccess, lookups }: CreateAtivoModalProps) {
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: 'Máquinas e Equipamentos' as AssetCategory,
    setorId: '' as string | number,
    responsavelId: '' as string | number,
    marcaFabricante: '',
    modeloReferencia: '',
    dataAquisicaoStr: '',
    valorAquisicao: '',
    estadoConservacao: 'Bom' as AssetConservation,
    situacao: 'Ativo' as AssetSituation,
    numeroNotaFiscal: '',
    fornecedor: '',
    vidaUtilAnos: '',
    depreciacaoAnualPct: '',
    observacoes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        descricao: '',
        categoria: 'Máquinas e Equipamentos',
        setorId: '',
        responsavelId: '',
        marcaFabricante: '',
        modeloReferencia: '',
        dataAquisicaoStr: '',
        valorAquisicao: '',
        estadoConservacao: 'Bom',
        situacao: 'Ativo',
        numeroNotaFiscal: '',
        fornecedor: '',
        vidaUtilAnos: '',
        depreciacaoAnualPct: '',
        observacoes: ''
      });
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!formData.descricao.trim()) {
      setErrorMsg('A descrição do ativo é obrigatória.');
      return;
    }
    if (!formData.categoria) {
      setErrorMsg('A categoria é obrigatória.');
      return;
    }
    if (!formData.situacao) {
      setErrorMsg('A situação do ativo é obrigatória.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        descricao: formData.descricao.trim(),
        setorId: formData.setorId !== '' ? Number(formData.setorId) : null,
        responsavelId: formData.responsavelId !== '' ? Number(formData.responsavelId) : null,
        valorAquisicao: formData.valorAquisicao !== '' ? Number(formData.valorAquisicao) : null,
        vidaUtilAnos: formData.vidaUtilAnos !== '' ? Number(formData.vidaUtilAnos) : null,
        depreciacaoAnualPct: formData.depreciacaoAnualPct !== '' ? Number(formData.depreciacaoAnualPct) : null,
        marcaFabricante: formData.marcaFabricante.trim() || null,
        modeloReferencia: formData.modeloReferencia.trim() || null,
        numeroNotaFiscal: formData.numeroNotaFiscal.trim() || null,
        fornecedor: formData.fornecedor.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        dataAquisicaoStr: formData.dataAquisicaoStr || null
      };

      const res = await fetch('/api/ativos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao cadastrar ativo patrimonial.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar o ativo no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: AssetCategory[] = [
    'Máquinas e Equipamentos',
    'Veículos',
    'Tecnologia da Informação',
    'Móveis e Utensílios',
    'Instrumentos de Medição',
    'Segurança',
    'Infraestrutura',
    'Outros'
  ];

  const conservations: AssetConservation[] = ['Ótimo', 'Bom', 'Regular', 'Ruim', 'Inservível'];
  const situations: AssetSituation[] = ['Ativo', 'Em Manutenção', 'Baixado', 'Alienado', 'Extraviado'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Novo Ativo Patrimonial</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cadastre um novo item do patrimônio da empresa</p>
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

        {/* Error Callout */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 animate-in slide-in-from-top duration-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
            <AlertCircle className="w-5 h-5 text-red-655 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">
              <strong className="block text-slate-900 dark:text-white font-bold mb-0.5">Erro no Formulário:</strong>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Descrição */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-500" /> Descrição do Ativo *
              </label>
              <input 
                type="text" 
                value={formData.descricao}
                placeholder="Ex: Torno Mecânico CNC Nardini"
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" /> Categoria *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as AssetCategory })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Situação */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-blue-500" /> Situação *
              </label>
              <select
                value={formData.situacao}
                onChange={(e) => setFormData({ ...formData, situacao: e.target.value as AssetSituation })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
                required
              >
                {situations.map(sit => (
                  <option key={sit} value={sit}>{sit}</option>
                ))}
              </select>
            </div>

            {/* Setor Responsável */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-blue-500" /> Setor Alocado
              </label>
              <select
                value={formData.setorId}
                onChange={(e) => setFormData({ ...formData, setorId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
              >
                <option value="">Selecione um setor...</option>
                {lookups.sectors.map(sec => (
                  <option key={sec.id} value={sec.id}>{sec.nome}</option>
                ))}
              </select>
            </div>

            {/* Técnico Responsável */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-500" /> Técnico Responsável
              </label>
              <select
                value={formData.responsavelId}
                onChange={(e) => setFormData({ ...formData, responsavelId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
              >
                <option value="">Selecione um técnico...</option>
                {lookups.tecnicos.map(tec => (
                  <option key={tec.id} value={tec.id}>{tec.nome}</option>
                ))}
              </select>
            </div>

            {/* Marca / Fabricante */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Marca / Fabricante</label>
              <input 
                type="text" 
                value={formData.marcaFabricante}
                placeholder="Ex: Siemens, Weg, Toyota"
                onChange={(e) => setFormData({ ...formData, marcaFabricante: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Modelo / Referência */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Modelo / Referência</label>
              <input 
                type="text" 
                value={formData.modeloReferencia}
                placeholder="Ex: XL-2000, 15HP"
                onChange={(e) => setFormData({ ...formData, modeloReferencia: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Data Aquisição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Data de Aquisição
              </label>
              <input 
                type="date" 
                value={formData.dataAquisicaoStr}
                onChange={(e) => setFormData({ ...formData, dataAquisicaoStr: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Valor Aquisição */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Valor de Aquisição (R$)
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.valorAquisicao}
                placeholder="Ex: 15000.00"
                onChange={(e) => setFormData({ ...formData, valorAquisicao: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Estado de Conservação */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Estado de Conservação</label>
              <select
                value={formData.estadoConservacao}
                onChange={(e) => setFormData({ ...formData, estadoConservacao: e.target.value as AssetConservation })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
              >
                {conservations.map(cons => (
                  <option key={cons} value={cons}>{cons}</option>
                ))}
              </select>
            </div>

            {/* Fornecedor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Fornecedor</label>
              <input 
                type="text" 
                value={formData.fornecedor}
                placeholder="Ex: Distribuidora Industrial S.A."
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Nota Fiscal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Número da Nota Fiscal</label>
              <input 
                type="text" 
                value={formData.numeroNotaFiscal}
                placeholder="Ex: NF-12345"
                onChange={(e) => setFormData({ ...formData, numeroNotaFiscal: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Vida Útil em Anos */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Vida Útil (Anos)</label>
              <input 
                type="number" 
                step="0.1"
                value={formData.vidaUtilAnos}
                placeholder="Ex: 10.0"
                onChange={(e) => setFormData({ ...formData, vidaUtilAnos: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Depreciação Anual % */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Depreciação Anual (%)</label>
              <input 
                type="number" 
                step="0.01"
                value={formData.depreciacaoAnualPct}
                placeholder="Ex: 10.00"
                onChange={(e) => setFormData({ ...formData, depreciacaoAnualPct: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
              />
            </div>

            {/* Observações */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300">Observações</label>
              <textarea 
                rows={2}
                value={formData.observacoes}
                placeholder="Ex: Adquirido com garantia estendida..."
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-850 dark:text-slate-200 text-xs rounded-xl p-3 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-505 text-white text-xs font-bold rounded-xl shadow-md hover:shadow transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Ativo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

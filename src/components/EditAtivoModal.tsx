'use client';

import React, { useState, useEffect } from 'react';
import { Package, X, AlertCircle, Calendar, DollarSign, FileText, Clipboard, User, Tag } from 'lucide-react';
import { AssetCategory, AssetConservation, AssetSituation, AssetRecord } from '../types';
import { formatCurrencyBRL, parseCurrencyBRL } from '../utils/helpers';

interface EditAtivoModalProps {
  isOpen: boolean;
  record: AssetRecord | null;
  onClose: () => void;
  onSuccess: () => void;
  lookups: {
    sectors: { id: number; nome: string }[];
    tecnicos: { id: number; nome: string }[];
  };
}

// Official Receita Federal depreciation rates (IN RFB nº 1700/2017)
const RFB_DEPRECIATION_MAP: Record<AssetCategory, { vidaUtil: number; taxaAnual: number }> = {
  'Máquinas e Equipamentos': { vidaUtil: 10, taxaAnual: 10 },
  'Veículos': { vidaUtil: 5, taxaAnual: 20 },
  'Tecnologia da Informação': { vidaUtil: 5, taxaAnual: 20 },
  'Móveis e Utensílios': { vidaUtil: 10, taxaAnual: 10 },
  'Instrumentos de Medição': { vidaUtil: 10, taxaAnual: 10 },
  'Segurança': { vidaUtil: 10, taxaAnual: 10 },
  'Infraestrutura': { vidaUtil: 25, taxaAnual: 4 },
  'Outros': { vidaUtil: 10, taxaAnual: 10 }
};

export default function EditAtivoModal({ isOpen, record, onClose, onSuccess, lookups }: EditAtivoModalProps) {
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
    if (isOpen && record) {
      setFormData({
        descricao: record.descricao || '',
        categoria: record.categoria || 'Máquinas e Equipamentos',
        setorId: record.setorId !== null ? String(record.setorId) : '',
        responsavelId: record.responsavelId !== null ? String(record.responsavelId) : '',
        marcaFabricante: record.marcaFabricante || '',
        modeloReferencia: record.modeloReferencia || '',
        dataAquisicaoStr: record.dataAquisicaoStr || '',
        // Map raw float number (like 15000.56) to cents string first, e.g. 1500056, to let the BRL mask handle formatting correctly
        valorAquisicao: record.valorAquisicao !== null ? formatCurrencyBRL(Math.round(record.valorAquisicao * 100)) : '',
        estadoConservacao: (record.estadoConservacao as AssetConservation) || 'Bom',
        situacao: record.situacao || 'Ativo',
        numeroNotaFiscal: record.numeroNotaFiscal || '',
        fornecedor: record.fornecedor || '',
        vidaUtilAnos: record.vidaUtilAnos !== null ? String(record.vidaUtilAnos) : '',
        depreciacaoAnualPct: record.depreciacaoAnualPct !== null ? String(record.depreciacaoAnualPct) : '',
        observacoes: record.observacoes || ''
      });
      setErrorMsg(null);
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  // Handle category change and auto-fill RFB guidelines
  const handleCategoryChange = (cat: AssetCategory) => {
    const defaults = RFB_DEPRECIATION_MAP[cat];
    setFormData(prev => ({
      ...prev,
      categoria: cat,
      vidaUtilAnos: String(defaults.vidaUtil),
      depreciacaoAnualPct: String(defaults.taxaAnual)
    }));
  };

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
        descricao: formData.descricao.trim(),
        categoria: formData.categoria,
        setorId: formData.setorId !== '' ? Number(formData.setorId) : null,
        responsavelId: formData.responsavelId !== '' ? Number(formData.responsavelId) : null,
        marcaFabricante: formData.marcaFabricante.trim() || null,
        modeloReferencia: formData.modeloReferencia.trim() || null,
        dataAquisicaoStr: formData.dataAquisicaoStr || null,
        valorAquisicao: parseCurrencyBRL(formData.valorAquisicao),
        estadoConservacao: formData.estadoConservacao,
        situacao: formData.situacao,
        numeroNotaFiscal: formData.numeroNotaFiscal.trim() || null,
        fornecedor: formData.fornecedor.trim() || null,
        vidaUtilAnos: formData.vidaUtilAnos !== '' ? Number(formData.vidaUtilAnos) : null,
        depreciacaoAnualPct: formData.depreciacaoAnualPct !== '' ? Number(formData.depreciacaoAnualPct) : null,
        observacoes: formData.observacoes.trim() || null
      };

      const res = await fetch(`/api/ativos/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao atualizar ativo patrimonial.');
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
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Editar Ativo <span className="text-xs px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-500/20">{record.numeroPatrimonio}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Atualize as informações do item cadastrado</p>
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
                onChange={(e) => handleCategoryChange(e.target.value as AssetCategory)}
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

            {/* Valor Aquisição (Com máscara de moeda R$) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Valor de Aquisição
              </label>
              <input 
                type="text" 
                value={formData.valorAquisicao}
                placeholder="R$ 0,00"
                onChange={(e) => setFormData({ ...formData, valorAquisicao: formatCurrencyBRL(e.target.value) })}
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
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                RFB: {RFB_DEPRECIATION_MAP[formData.categoria].vidaUtil} anos sugeridos.
              </p>
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
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">
                RFB: {RFB_DEPRECIATION_MAP[formData.categoria].taxaAnual}% ao ano sugeridos.
              </p>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

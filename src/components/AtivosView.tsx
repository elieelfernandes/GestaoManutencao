'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, RefreshCw, AlertCircle, CheckCircle2, Search, RotateCcw, Edit2, Trash2, Calendar, ShieldAlert, ChevronUp, ChevronDown } from 'lucide-react';
import { AssetRecord, AssetCategory, AssetSituation } from '../types';
import CreateAtivoModal from './CreateAtivoModal';
import EditAtivoModal from './EditAtivoModal';
import { formatDateBr } from '../utils/helpers';

interface FilterState {
  categoria: string;
  setorId: string;
  situacao: string;
  search: string;
}

type SortField = 'numeroPatrimonio' | 'descricao' | 'dataAquisicaoStr' | 'valorAquisicao' | 'valorResidual';
type SortOrder = 'asc' | 'desc';

export default function AtivosView() {
  const [records, setRecords] = useState<AssetRecord[]>([]);
  const [sectors, setSectors] = useState<{ id: number; nome: string }[]>([]);
  const [tecnicos, setTecnicos] = useState<{ id: number; nome: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('dataAquisicaoStr');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AssetRecord | null>(null);

  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    categoria: '',
    setorId: '',
    situacao: '',
    search: ''
  });

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resAtivos, resCadastros] = await Promise.all([
        fetch('/api/ativos'),
        fetch('/api/cadastros')
      ]);

      const [jsonAtivos, jsonCadastros] = await Promise.all([
        resAtivos.json(),
        resCadastros.json()
      ]);

      if (!resAtivos.ok) throw new Error(jsonAtivos.error || 'Falha ao buscar ativos patrimoniais.');
      if (!resCadastros.ok) throw new Error(jsonCadastros.error || 'Falha ao buscar dados cadastrais.');

      setRecords(jsonAtivos.records || []);
      setSectors(jsonCadastros.setores || []);
      setTecnicos(jsonCadastros.tecnicos || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza de que deseja excluir o ativo "${name}"?`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/ativos/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Erro ao excluir ativo.');

      setSuccessMsg('Ativo patrimonial excluído com sucesso.');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir ativo.');
    }
  };

  const handleResetFilters = () => {
    setFilters({
      categoria: '',
      setorId: '',
      situacao: '',
      search: ''
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort logic
  const filteredRecords = useMemo(() => {
    const filtered = records.filter(r => {
      if (filters.categoria && r.categoria !== filters.categoria) return false;
      if (filters.setorId && String(r.setorId) !== filters.setorId) return false;
      if (filters.situacao && r.situacao !== filters.situacao) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const descMatch = r.descricao ? r.descricao.toLowerCase().includes(q) : false;
        const codeMatch = r.numeroPatrimonio ? r.numeroPatrimonio.toLowerCase().includes(q) : false;
        const brandMatch = r.marcaFabricante ? r.marcaFabricante.toLowerCase().includes(q) : false;
        if (!descMatch && !codeMatch && !brandMatch) return false;
      }
      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle nulls/undefined to always sort them at the end of the order
      if (valA === null || valA === undefined) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      if (valB === null || valB === undefined) {
        return sortOrder === 'asc' ? -1 : 1;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const strA = sortField === 'descricao' ? valA.toLowerCase() : valA;
        const strB = sortField === 'descricao' ? valB.toLowerCase() : valB;
        if (strA < strB) return sortOrder === 'asc' ? -1 : 1;
        if (strA > strB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [records, filters, sortField, sortOrder]);

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

  const situations: AssetSituation[] = ['Ativo', 'Em Manutenção', 'Baixado', 'Alienado', 'Extraviado'];

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getSituationColor = (sit: AssetSituation) => {
    switch (sit) {
      case 'Ativo':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30';
      case 'Em Manutenção':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/30';
      case 'Baixado':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700';
      case 'Alienado':
        return 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/30';
      case 'Extraviado':
        return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/30';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-250';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-900 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" /> Cadastro de Ativos Patrimoniais
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle e rastreabilidade física de ativos, alocação de setores, valor de compra e depreciação acumulada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            Atualizar Ativos
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Novo Ativo
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

      {/* 1. Filter Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm uppercase tracking-wider">
            <Package className="w-4 h-4 text-blue-500" />
            Filtros Patrimoniais
          </div>
          <button 
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700/50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search Term */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Buscar Descrição/Cód</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 dark:text-slate-550" />
              <input 
                type="text"
                placeholder="Ex: Torno, Siemens..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoria</label>
            <select
              value={filters.categoria}
              onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
            >
              <option value="">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Setor Alocado</label>
            <select
              value={filters.setorId}
              onChange={(e) => setFilters({ ...filters, setorId: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
            >
              <option value="">Todos os Setores</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.nome}</option>
              ))}
            </select>
          </div>

          {/* Situação */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Situação</label>
            <select
              value={filters.situacao}
              onChange={(e) => setFilters({ ...filters, situacao: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
            >
              <option value="">Todas as Situações</option>
              {situations.map(sit => (
                <option key={sit} value={sit}>{sit}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. List Table */}
      {isLoading ? (
        <div className="h-[40vh] w-full flex flex-col items-center justify-center gap-3 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-3xl p-8 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Carregando Ativos Patrimoniais...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th 
                    onClick={() => handleSort('numeroPatrimonio')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-350 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Patrimônio
                      {sortField === 'numeroPatrimonio' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('descricao')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-350 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Descrição
                      {sortField === 'descricao' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Alocação (Setor / Resp)</th>
                  <th className="py-3 px-4">Marca / Modelo</th>
                  <th 
                    onClick={() => handleSort('valorAquisicao')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-350 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Valor Compra
                      {sortField === 'valorAquisicao' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('dataAquisicaoStr')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-350 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Aquisição
                      {sortField === 'dataAquisicaoStr' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4">Deprec. Acumulada</th>
                  <th 
                    onClick={() => handleSort('valorResidual')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-350 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Valor Residual
                      {sortField === 'valorResidual' && (
                        sortOrder === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4">Situação</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-450 dark:text-slate-500">
                      Nenhum ativo patrimonial encontrado correspondente aos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                      {/* Patrimônio Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                          {r.numeroPatrimonio}
                        </span>
                      </td>

                      {/* Descrição */}
                      <td className="py-3.5 px-4 max-w-[200px] truncate font-medium text-slate-850 dark:text-white" title={r.descricao}>
                        {r.descricao}
                      </td>

                      {/* Categoria */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {r.categoria}
                      </td>

                      {/* Setor / Responsável */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{r.setorNome || '—'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.responsavelNome || 'Não informado'}</div>
                      </td>

                      {/* Marca / Modelo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-350">{r.marcaFabricante || '—'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.modeloReferencia || '—'}</div>
                      </td>

                      {/* Valor Compra */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-850 dark:text-slate-200">
                        {formatCurrency(r.valorAquisicao)}
                      </td>

                      {/* Data Aquisição */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-350">
                        {r.dataAquisicaoStr ? formatDateBr(r.dataAquisicaoStr) : '—'}
                      </td>

                      {/* Depreciação Acumulada */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-amber-700 dark:text-amber-400">
                        {formatCurrency(r.depreciacaoAcumulada || 0)}
                      </td>

                      {/* Valor Residual */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800 dark:text-white">
                        {formatCurrency(r.valorResidual !== undefined ? r.valorResidual : r.valorAquisicao)}
                      </td>

                      {/* Situação StatusBadge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getSituationColor(r.situacao)}`}>
                          {r.situacao}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingRecord(r)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                            title="Editar Ativo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.descricao)}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 rounded-lg border border-rose-200 dark:border-rose-500/20 transition-all cursor-pointer"
                            title="Excluir Ativo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateAtivoModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchData}
        lookups={{ sectors, tecnicos }}
      />

      <EditAtivoModal 
        isOpen={!!editingRecord}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSuccess={fetchData}
        lookups={{ sectors, tecnicos }}
      />

    </div>
  );
}

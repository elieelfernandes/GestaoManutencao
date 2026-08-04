'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, RefreshCw, AlertCircle, CheckCircle2, Search, RotateCcw, Edit2, Trash2, Calendar, ShieldAlert, ChevronUp, ChevronDown, Download, DollarSign, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { AssetRecord, AssetCategory, AssetSituation } from '../types';
import CreateAtivoModal from './CreateAtivoModal';
import EditAtivoModal from './EditAtivoModal';
import { formatDateBr } from '../utils/helpers';
import * as XLSX from 'xlsx';
import { useTheme } from '../utils/ThemeContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

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

  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) return;

    const dataToExport = filteredRecords.map(r => ({
      'Número Patrimônio': r.numeroPatrimonio,
      'Descrição': r.descricao,
      'Categoria': r.categoria,
      'Setor': r.setorNome || '—',
      'Responsável': r.responsavelNome || '—',
      'Marca/Fabricante': r.marcaFabricante || '—',
      'Modelo/Referência': r.modeloReferencia || '—',
      'Data de Aquisição': r.dataAquisicaoStr ? formatDateBr(r.dataAquisicaoStr) : '—',
      'Valor de Aquisição': r.valorAquisicao !== null ? formatCurrency(r.valorAquisicao) : '—',
      'Estado de Conservação': r.estadoConservacao || '—',
      'Situação': r.situacao,
      'Depreciação Acumulada': formatCurrency(r.depreciacaoAcumulada || 0),
      'Valor Residual': formatCurrency(r.valorResidual !== undefined ? r.valorResidual : r.valorAquisicao),
      'Número da Nota Fiscal': r.numeroNotaFiscal || '—',
      'Fornecedor': r.fornecedor || '—',
      'Vida Útil (Anos)': r.vidaUtilAnos !== null ? r.vidaUtilAnos : '—',
      'Depreciação Anual (%)': r.depreciacaoAnualPct !== null ? `${r.depreciacaoAnualPct}%` : '—',
      'Observações': r.observacoes || '—'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ativos Patrimoniais');

    // Auto-fit column widths
    const maxLengths = dataToExport.reduce((acc, row) => {
      Object.keys(row).forEach(key => {
        const val = String(row[key as keyof typeof row]);
        acc[key] = Math.max(acc[key] || key.length, val.length);
      });
      return acc;
    }, {} as { [key: string]: number });

    worksheet['!cols'] = Object.keys(maxLengths).map(key => ({
      wch: maxLengths[key] + 3
    }));

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fileName = `Marilux_Ativos_Patrimoniais_${year}-${month}-${day}.xlsx`;

    XLSX.writeFile(workbook, fileName);
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

  // KPI Calculations
  const totalBens = filteredRecords.length;
  const valorTotalInvestido = filteredRecords.reduce((sum, r) => sum + (r.valorAquisicao || 0), 0);
  const depreciacaoAcumuladaTotal = filteredRecords.reduce((sum, r) => sum + (r.depreciacaoAcumulada || 0), 0);
  const valorResidualTotal = filteredRecords.reduce((sum, r) => sum + (r.valorResidual !== undefined ? r.valorResidual : (r.valorAquisicao || 0)), 0);

  // Group by Sector Data for BarChart (Top 10)
  const chartSectorsData = useMemo(() => {
    const sectorCounts: Record<string, number> = {};
    filteredRecords.forEach(r => {
      const secName = r.setorNome || 'Não alocado';
      sectorCounts[secName] = (sectorCounts[secName] || 0) + 1;
    });
    return Object.keys(sectorCounts)
      .map(name => ({ name, quantidade: sectorCounts[name] }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }, [filteredRecords]);

  // Group by Category Data for PieChart (Invested Value)
  const chartCategoriesData = useMemo(() => {
    const categoryValues: Record<string, number> = {};
    filteredRecords.forEach(r => {
      if (r.categoria) {
        categoryValues[r.categoria] = (categoryValues[r.categoria] || 0) + (r.valorAquisicao || 0);
      }
    });
    return Object.keys(categoryValues)
      .map(name => ({ name, value: categoryValues[name] }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords]);

  const isLight = theme === 'light';
  const gridStroke = isLight ? '#f1f5f9' : '#1e293b';
  const labelColor = isLight ? '#475569' : '#64748b';
  const primaryBarFill = isLight ? '#3b82f6' : '#3b82f6';
  const areaColors = isLight
    ? ['#93c5fd', '#86efac', '#fde047', '#c084fc', '#f472b6', '#cbd5e1', '#fdba74']
    : ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#f97316'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs text-slate-800 dark:text-slate-100">
          <p className="font-bold mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="font-semibold text-blue-600 dark:text-blue-400">
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipVal = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className="bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs text-slate-800 dark:text-slate-100">
          <p className="font-bold mb-1">{entry.name}</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
            Valor Investido: {formatCurrency(entry.value)}
          </p>
        </div>
      );
    }
    return null;
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
            onClick={handleExportExcel}
            disabled={isLoading || filteredRecords.length === 0}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow active:scale-98 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
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

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Bens */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total de Bens</span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-600/10 rounded-lg text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{totalBens}</span>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">Itens no Patrimônio</div>
          </div>
        </div>

        {/* Valor Total Investido */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Valor Investido</span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-600/10 rounded-lg text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(valorTotalInvestido)}</span>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Custo Histórico de Compra</div>
          </div>
        </div>

        {/* Valor Residual Atual */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Valor Residual Atual</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-600/10 rounded-lg text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(valorResidualTotal)}</span>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Valor Contábil Líquido</div>
          </div>
        </div>

        {/* Depreciação Acumulada */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300 group shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider">Depreciação Acumulada</span>
            <div className="p-1.5 bg-amber-50 dark:bg-amber-600/10 rounded-lg text-amber-600 dark:text-amber-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-white">{formatCurrency(depreciacaoAcumuladaTotal)}</span>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Perda de Valor Acumulada</div>
          </div>
        </div>
      </div>

      {/* Summary Charts */}
      {isMounted && filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Bens por Setor */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-wide uppercase">Bens por Setor Alocado</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Top 10 setores com maior volume físico de ativos</p>
            </div>
            <div className="w-full h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartSectorsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis dataKey="name" stroke={labelColor} fontSize={9} tickLine={false} />
                  <YAxis stroke={labelColor} fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="quantidade" name="Bens" fill={primaryBarFill} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Investimento por Categoria */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-wide uppercase">Investimento por Categoria</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Distribuição do valor de aquisição histórico</p>
            </div>
            <div className="w-full h-64 mt-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartCategoriesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartCategoriesData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={areaColors[index % areaColors.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipVal />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={8}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '9px', color: isLight ? '#475569' : '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
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

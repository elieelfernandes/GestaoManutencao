'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown, 
  Download, 
  Search,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MaintenanceRecord } from '../types';
import StatusBadge from './StatusBadge';

interface AnalyticalTableProps {
  records: MaintenanceRecord[];
  onEditOS?: (record: MaintenanceRecord) => void;
  onDeleteOS?: (id: string) => void;
}

const columnHelper = createColumnHelper<MaintenanceRecord>();

export default function AnalyticalTable({ records, onEditOS, onDeleteOS }: AnalyticalTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalSearch, setGlobalSearch] = useState('');

  // Define table columns
  const columns = [
    columnHelper.accessor('dataSolicitacaoStr', {
      header: 'Data',
      cell: info => <span className="font-medium text-slate-300 whitespace-nowrap">{info.getValue() || '—'}</span>
    }),
    columnHelper.accessor('setor', {
      header: 'Setor',
      cell: info => <span className="font-semibold text-white whitespace-nowrap">{info.getValue() || '—'}</span>
    }),
    columnHelper.accessor('descricao', {
      header: 'Descrição do Serviço',
      cell: info => (
        <div className="max-w-[280px] truncate text-slate-300 font-medium" title={info.getValue()}>
          {info.getValue() || '—'}
        </div>
      )
    }),
    columnHelper.accessor('tipoManutencao', {
      header: 'Tipo',
      cell: info => {
        const val = info.getValue();
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-purple-300 border border-purple-500/20 whitespace-nowrap">
            {val}
          </span>
        );
      }
    }),
    columnHelper.accessor('responsavel', {
      header: 'Responsável',
      cell: info => <span className="text-amber-400 font-semibold whitespace-nowrap">{info.getValue() || '—'}</span>
    }),
    columnHelper.accessor('prioridade', {
      header: 'Prioridade',
      cell: info => {
        const val = info.getValue();
        let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
        if (val === 'Alta') colorClass = 'bg-rose-950/40 text-rose-400 border-rose-800/30';
        if (val === 'Média') colorClass = 'bg-amber-950/40 text-amber-400 border-amber-800/30';
        if (val === 'Baixa') colorClass = 'bg-cyan-950/40 text-cyan-400 border-cyan-800/30';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${colorClass} whitespace-nowrap`}>
            {val}
          </span>
        );
      }
    }),
    columnHelper.accessor('areaTecnica', {
      header: 'Área Técnica',
      cell: info => <span className="text-slate-400 text-xs whitespace-nowrap">{info.getValue() || '—'}</span>
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} className="whitespace-nowrap" />
    }),
    columnHelper.accessor('observacao', {
      header: 'Observação',
      cell: info => (
        <div className="max-w-[150px] truncate text-slate-500 text-xs italic" title={info.getValue()}>
          {info.getValue() || '—'}
        </div>
      )
    }),
    columnHelper.display({
      id: 'acoes',
      header: 'Ações',
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {onEditOS && (
              <button
                onClick={() => onEditOS(record)}
                className="p-1.5 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-lg border border-blue-500/20 transition-all cursor-pointer"
                title="Editar / Dar Baixa"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDeleteOS && (
              <button
                onClick={() => {
                  if (confirm(`Tem certeza que deseja excluir a OS "${record.descricao}"?`)) {
                    onDeleteOS(record.id);
                  }
                }}
                className="p-1.5 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
                title="Excluir Ordem de Serviço"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      }
    })
  ];

  // Filter records based on global search in description or sector or responsible
  const filteredData = React.useMemo(() => {
    if (!globalSearch) return records;
    const lower = globalSearch.toLowerCase();
    return records.filter(r => 
      (r.descricao && r.descricao.toLowerCase().includes(lower)) ||
      (r.setor && r.setor.toLowerCase().includes(lower)) ||
      (r.responsavel && r.responsavel.toLowerCase().includes(lower)) ||
      (r.tipoManutencao && r.tipoManutencao.toLowerCase().includes(lower)) ||
      (r.status && r.status.toLowerCase().includes(lower))
    );
  }, [records, globalSearch]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  // Export fully cleaned data back to Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;

    const dataToExport = filteredData.map(r => ({
      'Data OS': r.dataSolicitacaoStr || (r as any).dataStr || '—',
      'Hora Solicitação': r.horaSolicitacao || '—',
      'Setor Solicitante': r.setor || '—',
      'Descrição do Serviço': r.descricao || '—',
      'Tipo de Manutenção': r.tipoManutencao || '—',
      'Responsável': r.responsavel || '—',
      'Prioridade': r.prioridade || '—',
      'Data de Execução': r.dataExecucaoStr || '—',
      'Início': r.horarioInicio || '—',
      'Término': r.horarioTermino || '—',
      'Status': r.status || '—',
      'Progresso (%)': (r as any).pctStatus !== undefined ? `${((r as any).pctStatus * 100).toFixed(0)}%` : '—',
      'Setor da Manutenção (Área)': r.areaTecnica || r.setorManutencao || '—',
      'Prazo Execução': r.prazoExecucaoStr || '—',
      'Prazo (Dias)': r.prazo || '—',
      'Observação': r.observacao || '—'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros Padronizados');
    
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

    XLSX.writeFile(workbook, 'Marilux_Manutencao_Limpa.xlsx');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      
      {/* Table Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Tabela Analítica de Atividades</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Listagem unificada de chamados após processos de limpeza</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input 
              type="text"
              placeholder="Filtrar tabela..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="bg-slate-950/60 border border-slate-850 focus:border-blue-500 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all placeholder:text-slate-600 sm:w-48 lg:w-64"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto rounded-xl border border-slate-850">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-slate-950/50 border-b border-slate-850">
                {headerGroup.headers.map(header => {
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th 
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="text-slate-400 font-bold uppercase tracking-wider px-4 py-3 select-none cursor-pointer hover:bg-slate-800/40 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> :
                          sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-blue-400" /> :
                          <ChevronsUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-850 bg-slate-900/40">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-slate-800/25 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-slate-500">
                  Nenhum registro encontrado para a pesquisa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Exibindo de</span>
          <span className="font-semibold text-slate-300">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>
          <span>a</span>
          <span className="font-semibold text-slate-300">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}
          </span>
          <span>de</span>
          <span className="font-semibold text-white">{filteredData.length}</span>
          <span>registros</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Row selection dropdown */}
          <div className="flex items-center gap-1.5">
            <span>Exibir</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value));
              }}
              className="bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1 text-slate-300 text-xs focus:border-blue-500 outline-none cursor-pointer"
            >
              {[10, 25, 50, 100].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-850 text-slate-400 hover:text-white disabled:text-slate-700 disabled:border-slate-850/50 hover:bg-slate-800 disabled:hover:bg-transparent active:scale-90 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            
            <div className="text-slate-400 px-1">
              Página <span className="font-semibold text-slate-200">{table.getState().pagination.pageIndex + 1}</span> de{' '}
              <span className="font-semibold text-slate-200">{table.getPageCount() || 1}</span>
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-850 text-slate-400 hover:text-white disabled:text-slate-700 disabled:border-slate-850/50 hover:bg-slate-800 disabled:hover:bg-transparent active:scale-90 transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

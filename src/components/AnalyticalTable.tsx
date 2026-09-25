'use client';

import React, { useState } from 'react';
import { 
  createColumnHelper, 
  flexRender, 
  getCoreRowModel, 
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel
} from '@tanstack/react-table';
import { MaintenanceRecord } from '../types';
import { 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  Edit2, 
  Trash2, 
  Download, 
  Search,
  ArrowLeft,
  ArrowRight,
  History
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDateBr } from '../utils/helpers';

interface AnalyticalTableProps {
  records: MaintenanceRecord[];
  onEditOS?: (record: MaintenanceRecord) => void;
  onDeleteOS?: (record: MaintenanceRecord) => void;
  onViewAudit?: (record: MaintenanceRecord) => void;
}

const columnHelper = createColumnHelper<MaintenanceRecord>();

export default function AnalyticalTable({ records, onEditOS, onDeleteOS, onViewAudit }: AnalyticalTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchInput, setSearchInput] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalSearch(searchInput);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const columns = React.useMemo(() => {
    const baseColumns: any[] = [
      columnHelper.accessor('dataSolicitacaoStr', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer text-xs"
          >
            Data OS
            {column.getIsSorted() === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : 
             column.getIsSorted() === 'desc' ? <ChevronDown className="w-3.5 h-3.5" /> : 
             <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50" />}
          </button>
        ),
        cell: info => <span className="font-mono text-slate-700 dark:text-slate-300 text-xs">{formatDateBr(info.getValue())}</span>,
      }),
      columnHelper.accessor('horaSolicitacao', {
        header: 'Hora',
        cell: info => <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{info.getValue() || '—'}</span>,
      }),
      columnHelper.accessor('setor', {
        header: 'Setor Solicitante',
        cell: info => <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('descricao', {
        header: 'Descrição do Serviço',
        cell: info => (
          <div className="max-w-[280px] truncate text-slate-700 dark:text-slate-200 text-xs" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('tipoManutencao', {
        header: 'Tipo',
        cell: info => (
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('responsavel', {
        header: 'Responsável',
        cell: info => <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('areaTecnica', {
        header: 'Área Técnica',
        cell: info => <span className="text-slate-500 dark:text-slate-400 text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('prioridade', {
        header: 'Prioridade',
        cell: info => {
          const val = info.getValue();
          let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
          if (val === 'Alta') color = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/40';
          if (val === 'Média') color = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40';
          if (val === 'Baixa') color = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/40';
          return (
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
          const val = info.getValue();
          let color = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
          if (val === 'Concluído') color = 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30';
          if (val === 'Em andamento') color = 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30';
          if (val === 'Atrasado') color = 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/30';
          if (val === 'Não iniciado') color = 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/30';
          return (
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor('prazoExecucaoStr', {
        header: 'Prazo',
        cell: info => <span className="font-mono text-slate-500 dark:text-slate-400 text-xs">{formatDateBr(info.getValue())}</span>,
      }),
    ];

    if (onEditOS || onDeleteOS || onViewAudit) {
      baseColumns.push(
        columnHelper.display({
          id: 'acoes',
          header: 'Ações',
          cell: ({ row }) => {
            const record = row.original;
            return (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                {onViewAudit && (
                  <button
                    onClick={() => onViewAudit(record)}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    title="Ver Histórico & Auditoria"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>
                )}
                {onEditOS && (
                  <button
                    onClick={() => onEditOS(record)}
                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                    title="Editar / Dar Baixa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteOS && (
                  <button
                    onClick={() => onDeleteOS(record)}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 rounded-lg border border-rose-200 dark:border-rose-500/20 transition-all cursor-pointer"
                    title="Excluir Ordem de Serviço"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          }
        })
      );
    }
    return baseColumns;
  }, [onEditOS, onDeleteOS, onViewAudit]);

  // Filter records based on global search
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

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;

    const dataToExport = filteredData.map(r => ({
      'Data OS': formatDateBr(r.dataSolicitacaoStr || (r as any).dataStr),
      'Hora Solicitação': r.horaSolicitacao || '—',
      'Setor Solicitante': r.setor || '—',
      'Descrição do Serviço': r.descricao || '—',
      'Tipo de Manutenção': r.tipoManutencao || '—',
      'Responsável': r.responsavel || '—',
      'Prioridade': r.prioridade || '—',
      'Data de Execução': formatDateBr(r.dataExecucaoStr),
      'Início': r.horarioInicio || '—',
      'Término': r.horarioTermino || '—',
      'Status': r.status || '—',
      'Setor da Manutenção (Área)': r.areaTecnica || r.setorManutencao || '—',
      'Prazo Execução': formatDateBr(r.prazoExecucaoStr),
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

    XLSX.writeFile(workbook, 'Marilux_Manutencao_Ordens.xlsx');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      
      {/* Table Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-400 tracking-wide uppercase">Tabela Analítica de Atividades</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Listagem unificada de chamados em aberto e finalizados</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
            <input 
              type="text"
              placeholder="Filtrar tabela..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-blue-500 text-slate-800 dark:text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 outline-none transition-all placeholder:text-slate-400 sm:w-48 lg:w-64"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-850">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="py-3 px-3.5">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-slate-400 text-xs">
                  Nenhum chamado encontrado.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="py-3 px-3.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-850">
        <div className="flex items-center gap-2">
          <span>Mostrando</span>
          <span className="font-semibold text-slate-800 dark:text-white">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>
          <span>até</span>
          <span className="font-semibold text-slate-800 dark:text-white">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              filteredData.length
            )}
          </span>
          <span>de</span>
          <span className="font-semibold text-slate-800 dark:text-white">{filteredData.length}</span>
          <span>registros</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Exibir</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value));
              }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 text-xs focus:border-blue-500 outline-none cursor-pointer"
            >
              {[10, 25, 50, 100].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            
            <div className="text-slate-500 dark:text-slate-400 px-1">
              Página <span className="font-semibold text-slate-800 dark:text-slate-200">{table.getState().pagination.pageIndex + 1}</span> de{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{table.getPageCount() || 1}</span>
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

'use client';

import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AssetCategory, AssetConservation, AssetSituation } from '../types';
import { normalizeText, formatDateBr } from '../utils/helpers';

interface ImportAtivosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lookups: {
    sectors: { id: number; nome: string }[];
    tecnicos: { id: number; nome: string }[];
  };
}

interface ParsedAssetRow {
  rowIndex: number;
  numeroPatrimonio?: string;
  descricao: string;
  categoria?: AssetCategory;
  setorNomeOriginal?: string;
  setorId?: number | null;
  responsavelNomeOriginal?: string;
  responsavelId?: number | null;
  marcaFabricante?: string;
  modeloReferencia?: string;
  dataAquisicaoStr?: string | null;
  valorAquisicao?: number | null;
  estadoConservacao?: AssetConservation;
  situacao?: AssetSituation;
  numeroNotaFiscal?: string;
  fornecedor?: string;
  vidaUtilAnos?: number | null;
  depreciacaoAnualPct?: number | null;
  observacoes?: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const VALID_CATEGORIES: AssetCategory[] = [
  'Máquinas e Equipamentos',
  'Veículos',
  'Tecnologia da Informação',
  'Móveis e Utensílios',
  'Instrumentos de Medição',
  'Segurança',
  'Infraestrutura',
  'Outros'
];

const VALID_SITUATIONS: AssetSituation[] = [
  'Ativo',
  'Em Manutenção',
  'Baixado',
  'Alienado',
  'Extraviado'
];

const VALID_CONSERVATIONS: AssetConservation[] = [
  'Ótimo',
  'Bom',
  'Regular',
  'Ruim',
  'Inservível'
];

/**
 * Tabela Oficial da Receita Federal (IN RFB nº 1700/2017, Anexo III)
 */
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

export default function ImportAtivosModal({ isOpen, onClose, onSuccess, lookups }: ImportAtivosModalProps) {
  const [rows, setRows] = useState<ParsedAssetRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'error'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Blank Model Excel
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Descrição *': 'Torno Mecânico CNC Nardini',
        'Categoria *': 'Máquinas e Equipamentos',
        'Setor': 'Produção',
        'Responsável': 'Cristian',
        'Marca/Fabricante': 'Nardini',
        'Modelo/Referência': 'Logic 175',
        'Data de Aquisição': '2024-05-15',
        'Valor de Aquisição': 85000.00,
        'Estado de Conservação': 'Bom',
        'Situação': 'Ativo',
        'Número da Nota Fiscal': 'NF-98421',
        'Fornecedor': 'Indústria Mecânica Brasil S.A.',
        'Vida Útil (Anos)': 10,
        'Depreciação Anual (%)': 10,
        'Observações': 'Garantia estendida de 24 meses'
      },
      {
        'Descrição *': 'Notebook Dell Latitude 3420',
        'Categoria *': 'Tecnologia da Informação',
        'Setor': 'Administrativo',
        'Responsável': 'JR',
        'Marca/Fabricante': 'Dell',
        'Modelo/Referência': 'Core i5 16GB SSD 512GB',
        'Data de Aquisição': '2025-01-10',
        'Valor de Aquisição': 4500.00,
        'Estado de Conservação': 'Ótimo',
        'Situação': 'Ativo',
        'Número da Nota Fiscal': 'NF-11234',
        'Fornecedor': 'Dell Computadores do Brasil',
        'Vida Útil (Anos)': 5,
        'Depreciação Anual (%)': 20,
        'Observações': 'Uso exclusivo da equipe de manutenção'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo Importação');

    ws['!cols'] = [
      { wch: 32 }, // Descrição
      { wch: 26 }, // Categoria
      { wch: 20 }, // Setor
      { wch: 20 }, // Responsável
      { wch: 20 }, // Marca
      { wch: 22 }, // Modelo
      { wch: 18 }, // Data
      { wch: 18 }, // Valor
      { wch: 22 }, // Estado
      { wch: 16 }, // Situação
      { wch: 22 }, // NF
      { wch: 28 }, // Fornecedor
      { wch: 16 }, // Vida Útil
      { wch: 20 }, // Depreciação
      { wch: 35 }  // Obs
    ];

    XLSX.writeFile(wb, 'Modelo_Importacao_Ativos_Marilux.xlsx');
  };

  // Helper: parse date from various formats (Excel serial number, YYYY-MM-DD, DD/MM/YYYY)
  const parseExcelDate = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === 'number') {
      // Excel serial date format
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    // DD/MM/YYYY format
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (brMatch) {
      const d = brMatch[1].padStart(2, '0');
      const m = brMatch[2].padStart(2, '0');
      const y = brMatch[3];
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  // Helper: parse money value
  const parseMoney = (val: any): number | null => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    let clean = String(val).replace(/R\$/g, '').trim();
    // Check format like 1.234,56
    if (clean.includes(',') && clean.includes('.')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  // 2. Parse Excel File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          setErrorMsg('A planilha selecionada está vazia.');
          setRows([]);
          return;
        }

        const parsedRows: ParsedAssetRow[] = rawJson.map((row, index) => {
          const errors: string[] = [];
          const warnings: string[] = [];

          // Find values supporting flexible column headers
          const getField = (keys: string[]) => {
            for (const k of keys) {
              const matchingKey = Object.keys(row).find(
                col => normalizeText(col) === normalizeText(k)
              );
              if (matchingKey && row[matchingKey] !== undefined && row[matchingKey] !== '') {
                return row[matchingKey];
              }
            }
            return '';
          };

          const descricaoRaw = String(getField(['Descrição', 'Descricao', 'Descrição *', 'Nome', 'Nome do Bem'])).trim();
          const categoriaRaw = String(getField(['Categoria', 'Categoria *', 'Tipo de Ativo'])).trim();
          const setorRaw = String(getField(['Setor', 'Setor Alocado', 'Departamento'])).trim();
          const responsavelRaw = String(getField(['Responsável', 'Responsavel', 'Técnico', 'Tecnico', 'Técnico Responsável'])).trim();
          const marcaRaw = String(getField(['Marca', 'Marca/Fabricante', 'Fabricante'])).trim();
          const modeloRaw = String(getField(['Modelo', 'Modelo/Referência', 'Modelo / Referência'])).trim();
          const dataRaw = getField(['Data de Aquisição', 'Data Aquisicao', 'Data Aquisição', 'Data de Compra', 'Data Compra']);
          const valorRaw = getField(['Valor de Aquisição', 'Valor Aquisicao', 'Valor de Compra', 'Valor Compra', 'Valor (R$)', 'Valor']);
          const estadoRaw = String(getField(['Estado de Conservação', 'Estado Conservacao', 'Estado'])).trim();
          const situacaoRaw = String(getField(['Situação', 'Situacao', 'Status'])).trim();
          const nfRaw = String(getField(['Número da Nota Fiscal', 'Nota Fiscal', 'NF', 'Numero Nota Fiscal'])).trim();
          const fornecedorRaw = String(getField(['Fornecedor'])).trim();
          const vidaUtilRaw = getField(['Vida Útil (Anos)', 'Vida Util', 'Vida Útil', 'Vida Util (Anos)']);
          const deprecPctRaw = getField(['Depreciação Anual (%)', 'Depreciacao Anual', 'Depreciação Anual', 'Taxa Anual (%)', 'Taxa Anual']);
          const obsRaw = String(getField(['Observações', 'Observacoes', 'Obs'])).trim();
          const patrimonioRaw = String(getField(['Número Patrimônio', 'Numero Patrimonio', 'Patrimônio', 'Patrimonio', 'Código'])).trim();

          // 1. Mandatory Descrição validation
          if (!descricaoRaw) {
            errors.push('Descrição do ativo é obrigatória.');
          }

          // 2. Category Matching
          let matchedCategory: AssetCategory | undefined = undefined;
          if (!categoriaRaw) {
            errors.push('Categoria é obrigatória.');
          } else {
            const foundCat = VALID_CATEGORIES.find(
              c => normalizeText(c) === normalizeText(categoriaRaw)
            );
            if (foundCat) {
              matchedCategory = foundCat;
            } else {
              errors.push(`Categoria inválida: "${categoriaRaw}". Categorias permitidas: ${VALID_CATEGORIES.join(', ')}`);
            }
          }

          // 3. Strict Sector Matching (Rule 2: MUST match cadastros_setores if provided)
          let matchedSectorId: number | null = null;
          if (setorRaw) {
            const foundSector = lookups.sectors.find(
              s => normalizeText(s.nome) === normalizeText(setorRaw)
            );
            if (foundSector) {
              matchedSectorId = foundSector.id;
            } else {
              errors.push(`Setor não encontrado: "${setorRaw}". Cadastre o setor antes de importar ou deixe o campo vazio.`);
            }
          }

          // 4. Strict Technician/Responsável Matching (Rule 2: MUST match cadastros_tecnicos if provided)
          let matchedResponsavelId: number | null = null;
          if (responsavelRaw) {
            const foundTech = lookups.tecnicos.find(
              t => normalizeText(t.nome) === normalizeText(responsavelRaw)
            );
            if (foundTech) {
              matchedResponsavelId = foundTech.id;
            } else {
              errors.push(`Técnico/Responsável não encontrado: "${responsavelRaw}". Cadastre o técnico antes de importar ou deixe o campo vazio.`);
            }
          }

          // 5. Situation Validation
          let matchedSituacao: AssetSituation = 'Ativo';
          if (situacaoRaw) {
            const foundSit = VALID_SITUATIONS.find(
              s => normalizeText(s) === normalizeText(situacaoRaw)
            );
            if (foundSit) {
              matchedSituacao = foundSit;
            } else {
              errors.push(`Situação inválida: "${situacaoRaw}". Situações válidas: ${VALID_SITUATIONS.join(', ')}`);
            }
          }

          // 6. Conservation Validation
          let matchedConservation: AssetConservation = 'Bom';
          if (estadoRaw) {
            const foundCons = VALID_CONSERVATIONS.find(
              c => normalizeText(c) === normalizeText(estadoRaw)
            );
            if (foundCons) {
              matchedConservation = foundCons;
            } else {
              warnings.push(`Estado de conservação "${estadoRaw}" não reconhecido. Aplicado padrão: "Bom".`);
            }
          }

          // 7. Date Parsing
          let parsedDateStr: string | null = null;
          if (dataRaw) {
            parsedDateStr = parseExcelDate(dataRaw);
            if (!parsedDateStr) {
              errors.push(`Data de aquisição inválida: "${dataRaw}". Use o formato AAAA-MM-DD ou DD/MM/AAAA.`);
            }
          }

          // 8. Money Parsing
          const parsedValor = parseMoney(valorRaw);
          if (valorRaw && parsedValor === null) {
            errors.push(`Valor de aquisição inválido: "${valorRaw}".`);
          }

          // 9. Depreciation & Useful Life (Auto-suggest RFB defaults if missing)
          let parsedVidaUtil = parseMoney(vidaUtilRaw);
          let parsedDeprecPct = parseMoney(deprecPctRaw);

          if (matchedCategory) {
            const rfbDefaults = RFB_DEPRECIATION_MAP[matchedCategory];
            if (parsedVidaUtil === null) {
              parsedVidaUtil = rfbDefaults.vidaUtil;
              warnings.push(`Vida útil preenchida automaticamente via RFB (${rfbDefaults.vidaUtil} anos).`);
            }
            if (parsedDeprecPct === null) {
              parsedDeprecPct = rfbDefaults.taxaAnual;
              warnings.push(`Depreciação anual preenchida automaticamente via RFB (${rfbDefaults.taxaAnual}% a.a.).`);
            }
          }

          return {
            rowIndex: index + 2, // Excel 1-based index with headers
            numeroPatrimonio: patrimonioRaw || undefined,
            descricao: descricaoRaw,
            categoria: matchedCategory,
            setorNomeOriginal: setorRaw || undefined,
            setorId: matchedSectorId,
            responsavelNomeOriginal: responsavelRaw || undefined,
            responsavelId: matchedResponsavelId,
            marcaFabricante: marcaRaw || undefined,
            modeloReferencia: modeloRaw || undefined,
            dataAquisicaoStr: parsedDateStr,
            valorAquisicao: parsedValor,
            estadoConservacao: matchedConservation,
            situacao: matchedSituacao,
            numeroNotaFiscal: nfRaw || undefined,
            fornecedor: fornecedorRaw || undefined,
            vidaUtilAnos: parsedVidaUtil,
            depreciacaoAnualPct: parsedDeprecPct,
            observacoes: obsRaw || undefined,
            isValid: errors.length === 0,
            errors,
            warnings
          };
        });

        setRows(parsedRows);
      } catch (err: any) {
        setErrorMsg(`Erro ao ler o arquivo Excel: ${err.message || 'Verifique o formato da planilha.'}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  const validRows = rows.filter(r => r.isValid);
  const errorRows = rows.filter(r => !r.isValid);

  const displayedRows = rows.filter(r => {
    if (filterView === 'valid') return r.isValid;
    if (filterView === 'error') return !r.isValid;
    return true;
  });

  // 3. Confirm and Submit Batch to Database
  const handleConfirmImport = async () => {
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        items: validRows.map(r => ({
          numeroPatrimonio: r.numeroPatrimonio,
          descricao: r.descricao,
          categoria: r.categoria,
          setorId: r.setorId,
          responsavelId: r.responsavelId,
          marcaFabricante: r.marcaFabricante,
          modeloReferencia: r.modeloReferencia,
          dataAquisicaoStr: r.dataAquisicaoStr,
          valorAquisicao: r.valorAquisicao,
          estadoConservacao: r.estadoConservacao,
          situacao: r.situacao,
          numeroNotaFiscal: r.numeroNotaFiscal,
          fornecedor: r.fornecedor,
          vidaUtilAnos: r.vidaUtilAnos,
          depreciacaoAnualPct: r.depreciacaoAnualPct,
          observacoes: r.observacoes
        }))
      };

      const res = await fetch('/api/ativos/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao importar lote de ativos.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar os ativos importados no banco de dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                Importação de Ativos em Lote via Excel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Faça upload de uma planilha .xlsx para cadastrar múltiplos bens simultaneamente
              </p>
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

        {/* Action / Upload Banner */}
        {rows.length === 0 ? (
          <div className="space-y-4 py-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-750 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-950/40 group flex flex-col items-center justify-center space-y-3"
            >
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-blue-600 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Clique ou arraste seu arquivo Excel (.xlsx) aqui
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Formatos suportados: .xlsx, .xls
                </p>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">Não possui a planilha modelo?</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Baixe nosso modelo oficial pré-formatado com exemplos e regras da Receita Federal
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Baixar Planilha Modelo
              </button>
            </div>
          </div>
        ) : (
          /* Preview Section */
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Summary & Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-850">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Arquivo:</span>
                <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                  {fileName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterView('all')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    filterView === 'all' 
                      ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  Todos ({rows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterView('valid')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    filterView === 'valid' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Válidos ({validRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterView('error')}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    filterView === 'error' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" /> Com Erros ({errorRows.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRows([]);
                    setFileName(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all ml-1 cursor-pointer"
                  title="Remover e escolher outro arquivo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error Banners */}
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2 text-red-800 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Table Area */}
            <div className="flex-1 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[220px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-850 sticky top-0 z-10">
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] w-14">Linha</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] w-24">Status</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Descrição</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Categoria</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Setor</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Responsável</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Valor</th>
                    <th className="px-3 py-2.5 font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Deprec.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-900">
                  {displayedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        Nenhum registro encontrado para o filtro selecionado.
                      </td>
                    </tr>
                  ) : (
                    displayedRows.map((r, idx) => (
                      <tr 
                        key={idx}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors ${
                          !r.isValid ? 'bg-red-50/30 dark:bg-red-950/10' : ''
                        }`}
                      >
                        <td className="px-3 py-2 font-mono text-slate-400 text-[11px]">#{r.rowIndex}</td>
                        <td className="px-3 py-2">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/30">
                              <CheckCircle2 className="w-3 h-3" /> Válido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/30">
                              <AlertCircle className="w-3 h-3" /> Erro
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-100">
                          <div>{r.descricao || <span className="text-red-500 italic">Vazia</span>}</div>
                          {r.errors.length > 0 && (
                            <div className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-normal">
                              {r.errors.join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {r.categoria || <span className="text-red-500 italic">—</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {r.setorNomeOriginal ? (
                            r.setorId ? (
                              <span>{r.setorNomeOriginal}</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 font-semibold">{r.setorNomeOriginal} (Não cadastrado)</span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                          {r.responsavelNomeOriginal ? (
                            r.responsavelId ? (
                              <span>{r.responsavelNomeOriginal}</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400 font-semibold">{r.responsavelNomeOriginal} (Não cadastrado)</span>
                            )
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                          {formatCurrency(r.valorAquisicao)}
                        </td>
                        <td className="px-3 py-2 text-slate-500 text-[11px]">
                          {r.vidaUtilAnos ? `${r.vidaUtilAnos}a (${r.depreciacaoAnualPct}%)` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {rows.length > 0 && (
              <span>
                Total identificado: <strong>{validRows.length}</strong> válidos
                {errorRows.length > 0 && (
                  <span className="text-red-500 ml-1">({errorRows.length} inválidos serão ignorados)</span>
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Cancelar
            </button>

            {rows.length > 0 && (
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={validRows.length === 0 || isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow active:scale-98 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Confirmar Importação ({validRows.length} ativos)
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useRef, useState } from 'react';
import { Wrench, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parseMaintenanceWorkbook } from '../utils/excelParser';
import { ExcelParserResult } from '../types';

interface DashboardHeaderProps {
  onDataParsed: (data: ExcelParserResult) => void;
  currentFileName: string;
}

export default function DashboardHeader({ onDataParsed, currentFileName }: DashboardHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.xlsm')) {
      setErrorMsg('Por favor, envie um arquivo Excel válido (.xlsx, .xls, .xlsm).');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (data instanceof ArrayBuffer) {
          const result = parseMaintenanceWorkbook(data, file.name);
          onDataParsed(result);
        } else {
          setErrorMsg('Falha ao ler os dados do arquivo.');
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao processar a planilha. Verifique se o arquivo segue o modelo correto da Marilux.');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erro na leitura do arquivo.');
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        {/* Title Area */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white animate-pulse">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
              Dashboard de Gestão de Manutenção
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium mt-1">
              Marilux | Painel Executivo, Operacional e Analítico
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:max-w-md w-full">
          <div 
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group ${
              isDragOver 
                ? 'border-blue-500 bg-blue-950/20 text-blue-300' 
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-500 text-slate-400 hover:text-slate-200'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden" 
              accept=".xlsx, .xls, .xlsm"
            />
            <Upload className="w-5 h-5 group-hover:scale-110 transition-transform text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Importar Nova Planilha
            </span>
            <span className="text-[10px] text-slate-500">
              Arraste o arquivo .xlsx ou clique para selecionar
            </span>
          </div>

          {/* Active File Metadata */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col justify-center sm:min-w-[180px] max-w-full">
            <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              Planilha Ativa
            </div>
            <div className="text-xs font-semibold mt-1 text-slate-200 truncate max-w-[200px]" title={currentFileName}>
              {currentFileName}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Dados Conectados
            </div>
          </div>
        </div>

      </div>

      {errorMsg && (
        <div className="max-w-7xl mx-auto mt-4 p-3 bg-red-950/40 border border-red-800 text-red-300 rounded-xl flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </header>
  );
}

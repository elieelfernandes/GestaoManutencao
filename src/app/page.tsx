'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import KPISection from '../components/KPISection';
import DiagnosticPanel from '../components/DiagnosticPanel';
import FilterPanel, { FilterState } from '../components/FilterPanel';
import MaintenanceCharts from '../components/MaintenanceCharts';
import AnalyticalTable from '../components/AnalyticalTable';
import { ExcelParserResult, MasterLookupData } from '../types';
import { parseMaintenanceWorkbook } from '../utils/excelParser';
import { Wrench } from 'lucide-react';

export default function Home() {
  const [parsedData, setParsedData] = useState<ExcelParserResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    month: '',
    sector: '',
    status: '',
    type: '',
    priority: '',
    responsible: '',
    maintSector: '',
    search: ''
  });

  // Load spreadsheet or Neon database data on initial render
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Try to fetch from Neon DB API first
        try {
          const apiResponse = await fetch('/api/records');
          if (apiResponse.ok) {
            const apiResult = await apiResponse.json();
            // If we have records in Neon, use them!
            if (apiResult.records && apiResult.records.length > 0) {
              setParsedData({
                records: apiResult.records,
                masterLookups: apiResult.masterLookups,
                originalFileName: 'Banco de Dados Neon (Conectado)'
              });
              setIsLoading(false);
              return;
            }
          }
        } catch (dbErr) {
          console.warn('Database is offline or not configured yet. Loading default file...', dbErr);
        }
        
        // 2. If DB is empty/unconfigured, load from default spreadsheet
        const response = await fetch('/data/default_data.xlsx');
        if (!response.ok) {
          throw new Error('Não foi possível ler o arquivo padrão de manutenção. Por favor, envie sua planilha Excel de manutenção na barra superior.');
        }
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        const result = parseMaintenanceWorkbook(arrayBuffer, 'Marilux - Gestão de Manutenção.xlsx (Padrão)');
        setParsedData(result);
        
        // 3. Proactively save to Neon DB in background to seed it
        try {
          await fetch('/api/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              records: result.records,
              masterLookups: result.masterLookups
            })
          });
          console.log('Database initialized and seeded with default data!');
        } catch (seedErr) {
          console.warn('Failed to seed default data to Neon:', seedErr);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao carregar os dados padrão.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, []);

  const handleDataParsed = async (newData: ExcelParserResult) => {
    setParsedData(newData);
    
    // Persist new data to Neon database
    try {
      setIsLoading(true);
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: newData.records,
          masterLookups: newData.masterLookups
        })
      });
      if (!res.ok) {
        throw new Error('Erro ao salvar os novos dados no banco de dados Neon.');
      }
      setParsedData(prev => prev ? { ...prev, originalFileName: 'Banco de Dados Neon (Atualizado)' } : prev);
      console.log('Database updated successfully with new upload!');
    } catch (err: any) {
      console.error(err);
      alert('Aviso: Os dados foram carregados no painel localmente, mas não puderam ser salvos na nuvem do Neon. Erro: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter records dynamically based on FilterState
  const filteredRecords = useMemo(() => {
    if (!parsedData) return [];
    
    const records = parsedData.records;
    
    return records.filter(r => {
      // 1. Period Date range filter (start Date)
      if (filters.startDate) {
        if (!r.data) return false;
        // set start at midnight UTC
        const start = new Date(filters.startDate + 'T00:00:00Z');
        if (r.data < start) return false;
      }
      
      // 2. Period Date range filter (end Date)
      if (filters.endDate) {
        if (!r.data) return false;
        // set end at end of day UTC
        const end = new Date(filters.endDate + 'T23:59:59Z');
        if (r.data > end) return false;
      }

      // Month filter
      if (filters.month && r.mesStr !== filters.month) return false;
      
      // 3. Sector filter
      if (filters.sector && r.setor !== filters.sector) return false;
      
      // 4. Status filter
      if (filters.status && r.status !== filters.status) return false;
      
      // 5. Maintenance Type filter
      if (filters.type && r.tipoManutencao !== filters.type) return false;
      
      // 6. Priority filter
      if (filters.priority && r.prioridade !== filters.priority) return false;
      
      // 7. Responsible filter
      if (filters.responsible && r.responsavel !== filters.responsible) return false;
      
      // 8. Maintenance Sector filter
      if (filters.maintSector && r.setorManutencao !== filters.maintSector) return false;
      
      // 9. Global Text Search (description, sector, responsible)
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const descMatch = r.descricao ? r.descricao.toLowerCase().includes(query) : false;
        const secMatch = r.setor ? r.setor.toLowerCase().includes(query) : false;
        const respMatch = r.responsavel ? r.responsavel.toLowerCase().includes(query) : false;
        const typeMatch = r.tipoManutencao ? r.tipoManutencao.toLowerCase().includes(query) : false;
        
        if (!descMatch && !secMatch && !respMatch && !typeMatch) return false;
      }
      
      return true;
    });
  }, [parsedData, filters]);

  // Extract lookups
  const lookups: MasterLookupData = useMemo(() => {
    if (parsedData) {
      return parsedData.masterLookups;
    }
    return {
      responsibles: [],
      sectors: [],
      priorities: [],
      maintenanceSectors: []
    };
  }, [parsedData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <DashboardHeader 
        onDataParsed={handleDataParsed}
        currentFileName={parsedData?.originalFileName || 'Nenhum arquivo carregado'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
        
        {isLoading ? (
          /* Premium Loading Screen */
          <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 bg-slate-900/20 border border-slate-900 rounded-3xl p-8">
            <div className="p-4 bg-blue-600/10 text-blue-500 rounded-full border border-blue-500/20 animate-spin">
              <Wrench className="w-10 h-10" />
            </div>
            <div className="text-center space-y-1.5">
              <h2 className="text-lg font-bold text-white tracking-wide">Processando Banco de Dados...</h2>
              <p className="text-xs text-slate-500">Mapeando colunas e limpando registros de manutenção</p>
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 text-center text-red-400 space-y-4 max-w-xl mx-auto mt-12">
            <h2 className="font-extrabold text-lg text-white">Falha ao Carregar Dados</h2>
            <p className="text-xs text-red-300/80 leading-relaxed">{error}</p>
            <p className="text-xs text-slate-500">Por favor, envie sua planilha Excel de manutenção na barra superior para iniciar o dashboard.</p>
          </div>
        ) : parsedData ? (
          /* Dashboard Layout */
          <>
            {/* 1. Filter Panel */}
            <FilterPanel 
              filters={filters} 
              setFilters={setFilters} 
              lookups={lookups}
              records={parsedData.records}
            />

            {/* 2. KPI Section */}
            <KPISection records={filteredRecords} />

            {/* 3. Executive Diagnosis Block */}
            <DiagnosticPanel records={filteredRecords} />

            {/* 4. Graphical Analysis View */}
            <div className="border-t border-slate-900 pt-6">
              <div className="mb-6">
                <h2 className="text-lg font-extrabold text-white tracking-wide">Visões Gráficas Operacionais</h2>
                <p className="text-slate-500 text-xs mt-0.5">Indicadores estatísticos e rankings gerenciais</p>
              </div>
              <MaintenanceCharts records={filteredRecords} />
            </div>

            {/* 5. Analytical Table View */}
            <div className="border-t border-slate-900 pt-6">
              <div className="mb-6">
                <h2 className="text-lg font-extrabold text-white tracking-wide">Detalhamento Analítico</h2>
                <p className="text-slate-500 text-xs mt-0.5">Consulta detalhada de registros e exportação</p>
              </div>
              <AnalyticalTable records={filteredRecords} />
            </div>
          </>
        ) : null}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/30 border-t border-slate-900 py-6 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        <span>© {new Date().getFullYear()} Marilux - Gestão de Manutenção | Desenvolvido com Antigravity</span>
      </footer>

    </div>
  );
}

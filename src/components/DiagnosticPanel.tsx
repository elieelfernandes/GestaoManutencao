'use client';

import React from 'react';
import { FileText, ShieldAlert, TrendingUp, Lightbulb, ClipboardList, CheckCircle2 } from 'lucide-react';
import { MaintenanceRecord } from '../types';

interface DiagnosticPanelProps {
  records: MaintenanceRecord[];
}

export default function DiagnosticPanel({ records }: DiagnosticPanelProps) {
  const total = records.length;
  
  if (total === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        Nenhum dado disponível para gerar o diagnóstico. Por favor, carregue uma planilha.
      </div>
    );
  }

  const completed = records.filter(r => r.status === 'Concluído').length;
  const open = records.filter(r => r.status === 'Em andamento' || r.status === 'Não iniciado').length;
  const delayed = records.filter(r => r.status === 'Atrasado').length;
  
  const completionRate = (completed / total) * 100;
  const openRate = (open / total) * 100;
  const delayedRate = (delayed / total) * 100;

  // Caculate maintenance type volumes
  const corrective = records.filter(r => r.tipoManutencao === 'Corretiva').length;
  const preventive = records.filter(r => r.tipoManutencao === 'Preventiva').length;
  const melhoria = records.filter(r => r.tipoManutencao === 'Melhoria').length;
  
  const correctiveRate = total > 0 ? (corrective / total) * 100 : 0;
  const preventiveRate = total > 0 ? (preventive / total) * 100 : 0;
  const melhoriaRate = total > 0 ? (melhoria / total) * 100 : 0;

  // Calculate sector criticality (open + delayed tickets)
  const sectorMap: { [key: string]: { total: number; pending: number; delayed: number } } = {};
  records.forEach(r => {
    if (!sectorMap[r.setor]) {
      sectorMap[r.setor] = { total: 0, pending: 0, delayed: 0 };
    }
    sectorMap[r.setor].total += 1;
    if (r.status === 'Em andamento' || r.status === 'Não iniciado') {
      sectorMap[r.setor].pending += 1;
    }
    if (r.status === 'Atrasado') {
      sectorMap[r.setor].delayed += 1;
    }
  });

  const criticalSectors = Object.keys(sectorMap)
    .map(name => ({
      name,
      total: sectorMap[name].total,
      score: sectorMap[name].pending * 1 + sectorMap[name].delayed * 2, // weighted severity
      pending: sectorMap[name].pending,
      delayed: sectorMap[name].delayed
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .filter(s => s.score > 0);

  // Dynamic recommendations logic
  const recommendations: string[] = [];
  
  if (correctiveRate > 40) {
    recommendations.push(
      `O índice de manutenção Corretiva está elevado (${correctiveRate.toFixed(1)}%). Recomenda-se estruturar planos de manutenção preventiva sistemática nos equipamentos gargalos para reduzir paradas não programadas.`
    );
  } else {
    recommendations.push(
      `Bom controle de corretivas (${correctiveRate.toFixed(1)}%). Continue priorizando preventivas e melhorias para manter a confiabilidade dos ativos.`
    );
  }

  if (delayed > 0) {
    recommendations.push(
      `Existem ${delayed} solicitações marcadas como Atrasadas (${delayedRate.toFixed(1)}% do total). Sugere-se realizar um mutirão focado ou reavaliar o dimensionamento da equipe técnica para escoar este gargalo.`
    );
  }

  if (completionRate < 75) {
    recommendations.push(
      `A taxa de conclusão atual está em ${completionRate.toFixed(1)}%, que fica abaixo da meta ideal de 85%. Recomenda-se uma reunião de alinhamento com os líderes de área para identificar barreiras na liberação de máquinas para manutenção.`
    );
  } else {
    recommendations.push(
      `Excelente taxa de atendimento (${completionRate.toFixed(1)}%). A equipe está mantendo o backlog sob controle. Recomenda-se focar na qualidade do registro dos horários de início/término para cálculo de MTTR.`
    );
  }

  if (criticalSectors.length > 0) {
    const listSectors = criticalSectors.map(s => `"${s.name}"`).join(', ');
    recommendations.push(
      `Os setores ${listSectors} concentram o maior volume de pendências e atrasos. Recomenda-se auditar os equipamentos destas áreas para identificar falhas crônicas e revisar os procedimentos operacionais padrão.`
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      
      {/* Visual Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors duration-500"></div>
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
        <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Diagnóstico Executivo da Manutenção</h2>
          <p className="text-slate-400 text-xs mt-0.5">Análise e recomendações gerenciais geradas dinamicamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Data Interpretation */}
        <div className="space-y-5 text-sm leading-relaxed text-slate-300">
          
          {/* Subsection: Overview */}
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-bold text-blue-400 tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Visão Geral de Desempenho
            </div>
            <p>
              Com base no processamento de <strong className="text-white">{total} ordens de serviço</strong>, a operação de manutenção registra uma <strong className="text-emerald-400">taxa de conclusão de {completionRate.toFixed(1)}%</strong> ({completed} atendimentos encerrados). 
              O volume acumulado de solicitações em aberto (não iniciadas ou em andamento) é de <strong className="text-blue-400">{open} chamados</strong> ({openRate.toFixed(1)}% da demanda total), 
              com um total de <strong className={`${delayed > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>{delayed} ordens em atraso</strong> ({delayedRate.toFixed(1)}%).
            </p>
          </div>

          {/* Subsection: Critical Sectors */}
          {criticalSectors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs uppercase font-bold text-red-400 tracking-wider mb-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                Setores Críticos Identificados
              </div>
              <p className="mb-2">
                A análise de criticidade ponderada identificou gargalos operacionais concentrados nas seguintes áreas de maior demanda pendente:
              </p>
              <ul className="space-y-1.5 pl-1">
                {criticalSectors.map((s, idx) => (
                  <li key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white min-w-[120px]">{s.name}</span>
                    <span className="text-slate-400">
                      ({s.pending} pendentes {s.delayed > 0 ? `, ${s.delayed} atrasados` : ''} de {s.total} totais)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Subsection: Recurrent Maintenance Types */}
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-bold text-purple-400 tracking-wider mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              Perfil das Intervenções
            </div>
            <p>
              O perfil das atividades de manutenção demonstra uma distribuição com foco em{' '}
              <strong className="text-purple-300">manutenção Corretiva ({correctiveRate.toFixed(1)}%)</strong>,{' '}
              <strong className="text-emerald-300">Preventiva ({preventiveRate.toFixed(1)}%)</strong> e{' '}
              <strong className="text-amber-300">Melhoria ({melhoriaRate.toFixed(1)}%)</strong>. A proporção entre preventivas e corretivas é um dos principais indicadores de maturidade da gestão de ativos, sugerindo a necessidade de balanceamento contínuo das rotinas preventivas.
            </p>
          </div>

        </div>

        {/* Right Column: Recommendations */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase font-bold text-indigo-400 tracking-wider mb-4">
              <Lightbulb className="w-4 h-4 text-indigo-400" />
              Recomendações Gerenciais
            </div>
            
            <div className="space-y-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                  <span className="mt-0.5 inline-flex items-center justify-center shrink-0 w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                    {idx + 1}
                  </span>
                  <p>{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Diagnostic Footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-medium">
            <span>Status da Operação: {completionRate >= 80 ? 'ESTÁVEL' : 'ATENÇÃO'}</span>
            <span>Meta de Atendimento: 85.0%</span>
          </div>
        </div>

      </div>

    </div>
  );
}

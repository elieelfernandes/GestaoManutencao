'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { MaintenanceRecord } from '../types';
import { getMonthStr } from './FilterPanel';
import { useTheme } from '../utils/ThemeContext';

interface MaintenanceChartsProps {
  records: MaintenanceRecord[];
}

export default function MaintenanceCharts({ records }: MaintenanceChartsProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || records.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-500 shadow-sm">
        Carregando gráficos...
      </div>
    );
  }

  const isLight = theme === 'light';

  // 1. Helper to sort months chronologically
  const parseMonthYear = (str: string) => {
    const parts = str.split(' ');
    if (parts.length === 2) {
      const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const m = months.indexOf(parts[0]);
      const y = parseInt(parts[1], 10);
      if (m !== -1 && !isNaN(y)) {
        return new Date(y, m, 1);
      }
    }
    return new Date(0);
  };

  // 2. Data Prep: Requests by Month
  const monthCounts: { [key: string]: number } = {};
  records.forEach(r => {
    const month = r.mesStr || getMonthStr(r.dataSolicitacaoStr);
    if (month && month !== 'Outro') {
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    }
  });
  const requestsByMonthData = Object.keys(monthCounts)
    .map(month => ({ month, quantidade: monthCounts[month] }))
    .sort((a, b) => parseMonthYear(a.month).getTime() - parseMonthYear(b.month).getTime());

  // 3. Data Prep: Requests by Status
  const statusCounts = {
    'Concluído': 0,
    'Em andamento': 0,
    'Não iniciado': 0,
    'Atrasado': 0
  };
  records.forEach(r => {
    if (r.status in statusCounts) {
      statusCounts[r.status as keyof typeof statusCounts]++;
    }
  });
  const requestsByStatusData = Object.keys(statusCounts).map(name => ({
    name,
    value: statusCounts[name as keyof typeof statusCounts]
  })).filter(d => d.value > 0);

  // Dynamic status colors
  const STATUS_COLORS = isLight ? {
    'Concluído': '#86efac',   // soft pastel green (emerald-300)
    'Em andamento': '#93c5fd', // soft pastel blue (blue-300)
    'Não iniciado': '#cbd5e1', // soft pastel grey (slate-300)
    'Atrasado': '#fca5a5'     // soft pastel red (red-300)
  } : {
    'Concluído': '#10b981',
    'Em andamento': '#3b82f6',
    'Não iniciado': '#64748b',
    'Atrasado': '#ef4444'
  };

  // 4. Data Prep: Requests by Maintenance Type
  const typeCounts: { [key: string]: number } = {};
  records.forEach(r => {
    if (r.tipoManutencao) {
      typeCounts[r.tipoManutencao] = (typeCounts[r.tipoManutencao] || 0) + 1;
    }
  });
  const requestsByTypeData = Object.keys(typeCounts)
    .map(name => ({ name, quantidade: typeCounts[name] }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // 5. Data Prep: Requests by Priority
  const priorityCounts = {
    'Alta': 0,
    'Média': 0,
    'Baixa': 0
  };
  records.forEach(r => {
    if (r.prioridade in priorityCounts) {
      priorityCounts[r.prioridade as keyof typeof priorityCounts]++;
    }
  });
  const requestsByPriorityData = Object.keys(priorityCounts).map(name => ({
    name,
    quantidade: priorityCounts[name as keyof typeof priorityCounts]
  }));

  // Dynamic priority colors
  const PRIORITY_COLORS = isLight ? {
    'Alta': '#fda4af',   // soft pastel rose-300
    'Média': '#fde047',  // soft pastel yellow-300
    'Baixa': '#67e8f9'   // soft pastel cyan-300
  } : {
    'Alta': '#f43f5e',
    'Média': '#f59e0b',
    'Baixa': '#06b6d4'
  };

  // 6. Data Prep: Requests by Sector (Top 10 Ranking)
  const sectorCounts: { [key: string]: number } = {};
  records.forEach(r => {
    if (r.setor) {
      sectorCounts[r.setor] = (sectorCounts[r.setor] || 0) + 1;
    }
  });
  const requestsBySectorSorted = Object.keys(sectorCounts)
    .map(name => ({ name, quantidade: sectorCounts[name] }))
    .sort((a, b) => b.quantidade - a.quantidade);
  
  const top10SectorsData = requestsBySectorSorted.slice(0, 10);

  // 7. Data Prep: Requests by Maintenance Technical Sector
  const maintSecCounts: { [key: string]: number } = {};
  records.forEach(r => {
    const area = r.areaTecnica || r.setorManutencao;
    if (area) {
      maintSecCounts[area] = (maintSecCounts[area] || 0) + 1;
    }
  });
  const requestsByMaintSecData = Object.keys(maintSecCounts)
    .map(name => ({ name, quantidade: maintSecCounts[name] }))
    .sort((a, b) => b.quantidade - a.quantidade);

  // Dynamic Area Pie Chart colors
  const AREA_COLORS = isLight 
    ? ['#93c5fd', '#86efac', '#fde047', '#c084fc', '#f472b6'] 
    : ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // 8. Data Prep: Requests by Responsible (Technicians)
  const respCounts: { [key: string]: number } = {};
  records.forEach(r => {
    if (r.responsavel) {
      respCounts[r.responsavel] = (respCounts[r.responsavel] || 0) + 1;
    }
  });
  const requestsByResponsibleData = Object.keys(respCounts)
    .map(name => ({ name, quantidade: respCounts[name] }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 8);

  // Theme-sensitive styles
  const gridStroke = isLight ? '#f1f5f9' : '#1e293b';
  const labelColor = isLight ? '#475569' : '#64748b';
  const primaryBarFill = isLight ? '#3b82f6' : '#3b82f6';
  const secondaryBarFill = isLight ? '#93c5fd' : '#8b5cf6';

  // Custom tooltips styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-950/95 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-lg text-xs text-slate-800 dark:text-slate-100">
          <p className="font-bold mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="font-semibold" style={{ color: isLight ? '#2563eb' : (p.color || p.fill) }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    };
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* 1. Requests by Month (Area Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">Solicitações por Mês</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Evolução temporal das ordens de serviço abertas</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={requestsByMonthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMonth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={isLight ? 0.2 : 0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={labelColor} fontSize={10} tickLine={false} />
              <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="quantidade" name="Chamados" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMonth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Requests by Status (Donut Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">Solicitações por Status</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Distribuição percentual das atividades</p>
        </div>
        <div className="w-full h-64 mt-4 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={requestsByStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {requestsByStatusData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || '#94a3b8'} 
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', color: isLight ? '#475569' : '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Requests by Maintenance Type (Bar Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">Solicitações por Tipo de Manutenção</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Recorrência por categoria de chamado</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestsByTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" stroke={labelColor} fontSize={9} tickLine={false} />
              <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Quantidade" fill={secondaryBarFill} radius={[4, 4, 0, 0]}>
                {requestsByTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? secondaryBarFill : (isLight ? '#d8b4fe' : '#a78bfa')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Requests by Priority (Bar Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">Solicitações por Prioridade</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Urgência das ordens registradas</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestsByPriorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" stroke={labelColor} fontSize={10} tickLine={false} />
              <YAxis stroke={labelColor} fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                {requestsByPriorityData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#f59e0b'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Ranking of Top 10 Sectors with Most Tickets (Horizontal Bar Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px] md:col-span-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">Ranking dos 10 Setores com mais Chamados</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Departamentos solicitantes com maior demanda de manutenção</p>
        </div>
        <div className="w-full h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={top10SectorsData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" stroke={labelColor} fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke={labelColor} fontSize={9} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Chamados" fill={primaryBarFill} radius={[0, 4, 4, 0]}>
                {top10SectorsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? (isLight ? '#fca5a5' : '#ef4444') : primaryBarFill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Requests by Maintenance Technical Sector (Pie/Donut Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">Solicitações por Setor da Manutenção</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Demanda por área técnica especializada</p>
        </div>
        <div className="w-full h-64 mt-4 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={requestsByMaintSecData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%)`}
                labelLine={true}
                dataKey="quantidade"
              >
                {requestsByMaintSecData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={AREA_COLORS[index % AREA_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7. Requests by Responsible (Bar Chart) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white tracking-wide uppercase">Solicitações por Responsável Técnico</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Carga de trabalho acumulada por executor</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={requestsByResponsibleData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
              <XAxis type="number" stroke={labelColor} fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke={labelColor} fontSize={9} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Atividades" fill="#10b981" radius={[0, 4, 4, 0]}>
                {requestsByResponsibleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? (isLight ? '#a7f3d0' : '#10b981') : (isLight ? '#d1fae5' : '#34d399')} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

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

interface MaintenanceChartsProps {
  records: MaintenanceRecord[];
}

export default function MaintenanceCharts({ records }: MaintenanceChartsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || records.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-500">
        Carregando gráficos...
      </div>
    );
  }

  // 1. Helper to sort months chronologically
  const parseMonthYear = (str: string) => {
    const parts = str.split('/');
    if (parts.length === 2) {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
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
    if (r.mesStr && r.mesStr !== 'Outro') {
      monthCounts[r.mesStr] = (monthCounts[r.mesStr] || 0) + 1;
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

  const STATUS_COLORS = {
    'Concluído': '#10b981', // emerald-500
    'Em andamento': '#3b82f6', // blue-500
    'Não iniciado': '#64748b', // slate-500
    'Atrasado': '#ef4444' // red-500
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

  const PRIORITY_COLORS = {
    'Alta': '#f43f5e', // rose-500
    'Média': '#f59e0b', // amber-500
    'Baixa': '#06b6d4' // cyan-500
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
    if (r.setorManutencao) {
      maintSecCounts[r.setorManutencao] = (maintSecCounts[r.setorManutencao] || 0) + 1;
    }
  });
  const requestsByMaintSecData = Object.keys(maintSecCounts)
    .map(name => ({ name, quantidade: maintSecCounts[name] }))
    .sort((a, b) => b.quantidade - a.quantidade);

  const AREA_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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
    .slice(0, 8); // Top 8 technicians to keep chart neat

  // Custom tooltips styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl shadow-xl text-xs">
          <p className="font-bold text-slate-100 mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="font-semibold" style={{ color: p.color || p.fill }}>
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
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Solicitações por Mês</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Evolução temporal das ordens de serviço abertas</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={requestsByMonthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMonth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="quantidade" name="Chamados" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMonth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Requests by Status (Donut Chart) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Solicitações por Status</h3>
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
                wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Requests by Maintenance Type (Bar Chart) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Solicitações por Tipo de Manutenção</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Recorrência por categoria de chamado</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestsByTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                {requestsByTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : '#a78bfa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Requests by Priority (Bar Chart) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Solicitações por Prioridade</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Urgência das ordens registradas</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={requestsByPriorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
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
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[350px] md:col-span-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Ranking dos 10 Setores com mais Chamados</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Departamentos solicitantes com maior demanda de manutenção</p>
        </div>
        <div className="w-full h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={top10SectorsData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Chamados" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                {top10SectorsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Requests by Maintenance Technical Sector (Pie/Donut Chart) */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Solicitações por Setor da Manutenção</h3>
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
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between min-h-[350px]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide uppercase text-slate-400">Solicitações por Responsável Técnico</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Carga de trabalho acumulada por executor</p>
        </div>
        <div className="w-full h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={requestsByResponsibleData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} tickLine={false} width={100} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="quantidade" name="Atividades" fill="#10b981" radius={[0, 4, 4, 0]}>
                {requestsByResponsibleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#34d399'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

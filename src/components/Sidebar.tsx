'use client';

import React from 'react';
import { LayoutDashboard, ClipboardList, Settings, Wrench, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';

export type NavTab = 'dashboard' | 'ordens' | 'cadastros';

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      subtitle: 'KPIs e Gráficos Gerenciais',
      icon: LayoutDashboard
    },
    {
      id: 'ordens' as NavTab,
      label: 'Ordens de Serviço',
      subtitle: 'Abertura, Filtros e Baixas',
      icon: ClipboardList
    },
    {
      id: 'cadastros' as NavTab,
      label: 'Cadastros Mestre',
      subtitle: 'Técnicos, Setores e Áreas',
      icon: Settings
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 flex flex-col shrink-0 min-h-screen">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 rounded-2xl border border-blue-100 dark:border-blue-500/20 shadow-sm">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-slate-800 dark:text-white text-base tracking-wide flex items-center gap-1.5">
            MARILUX <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-500/20">CMMS</span>
          </h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Gestão de Manutenção</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Navegação Principal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-2xl font-medium transition-all group duration-200 text-left border ${
                isActive
                  ? 'bg-blue-50/70 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/30 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/60 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{item.subtitle}</div>
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 transition-transform ${
                isActive ? 'text-blue-600 dark:text-blue-400 opacity-100 translate-x-0.5' : 'text-slate-400 dark:text-slate-600 opacity-0 group-hover:opacity-100'
              }`} />
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle Button */}
      <div className="px-4 pb-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer shadow-sm bg-white dark:bg-transparent"
        >
          {theme === 'light' ? (
            <>
              <Moon className="w-4.5 h-4.5 text-slate-500" />
              <span>Tema Escuro</span>
            </>
          ) : (
            <>
              <Sun className="w-4.5 h-4.5 text-amber-500 animate-spin-slow" />
              <span>Tema Claro</span>
            </>
          )}
        </button>
      </div>

      {/* System Status Footer */}
      <div className="p-4 border border-slate-100 dark:border-slate-900 m-4 rounded-2xl bg-slate-50/55 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Base Neon Conectada</span>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Sincronia 100% em Tempo Real</p>
      </div>

    </aside>
  );
}

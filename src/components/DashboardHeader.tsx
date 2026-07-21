'use client';

import React from 'react';
import { Wrench, PlusCircle } from 'lucide-react';

interface DashboardHeaderProps {
  onCreateOS?: () => void;
}

export default function DashboardHeader({ onCreateOS }: DashboardHeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        
        {/* Title Area */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-200 to-white bg-clip-text text-transparent">
              Sistema de Gestão de Manutenção
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Marilux | CMMS Industrial 100% Integrado ao Banco Postgres
            </p>
          </div>
        </div>

        {/* Action Button */}
        {onCreateOS && (
          <button
            onClick={onCreateOS}
            className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer uppercase tracking-wider border border-blue-400/30"
          >
            <PlusCircle className="w-5 h-5" />
            Nova Ordem de Serviço
          </button>
        )}

      </div>
    </header>
  );
}

'use client';

import React from 'react';
import { StatusType } from '../types';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let colorClass = 'bg-slate-800 text-slate-400 border-slate-700/50';
  let dotClass = 'bg-slate-500';

  if (status === 'Concluído') {
    colorClass = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30';
    dotClass = 'bg-emerald-500';
  } else if (status === 'Em andamento') {
    colorClass = 'bg-blue-950/40 text-blue-400 border-blue-800/30';
    dotClass = 'bg-blue-500';
  } else if (status === 'Atrasado') {
    colorClass = 'bg-red-950/40 text-red-400 border-red-800/30 font-bold';
    dotClass = 'bg-red-500 animate-pulse';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
      {status}
    </span>
  );
}

'use client';

import React from 'react';
import { StatusType } from '../types';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  let colorClass = 'bg-slate-100 text-slate-750 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50';
  let dotClass = 'bg-slate-500';

  if (status === 'Concluído') {
    colorClass = 'bg-emerald-50 text-emerald-800 border-emerald-250 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/30';
    dotClass = 'bg-emerald-500';
  } else if (status === 'Em andamento') {
    colorClass = 'bg-blue-50 text-blue-850 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/30';
    dotClass = 'bg-blue-500';
  } else if (status === 'Atrasado') {
    colorClass = 'bg-red-55/70 text-red-850 border-red-200/90 font-bold dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/30';
    dotClass = 'bg-red-500 animate-pulse';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}></span>
      {status}
    </span>
  );
}

'use client';

import React, { useState } from 'react';
import Sidebar, { NavTab } from '../components/Sidebar';
import DashboardView from '../components/DashboardView';
import OrdensView from '../components/OrdensView';
import CadastrosView from '../components/CadastrosView';
import { useTheme } from '../utils/ThemeContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 overflow-y-auto space-y-8">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'ordens' && <OrdensView />}
        {activeTab === 'cadastros' && <CadastrosView />}
      </main>

    </div>
  );
}

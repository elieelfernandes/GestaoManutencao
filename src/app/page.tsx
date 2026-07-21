'use client';

import React, { useState } from 'react';
import Sidebar, { NavTab } from '../components/Sidebar';
import DashboardView from '../components/DashboardView';
import OrdensView from '../components/OrdensView';
import CadastrosView from '../components/CadastrosView';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Fixed Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'ordens' && <OrdensView />}
        {activeTab === 'cadastros' && <CadastrosView />}
      </main>

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Sidebar, { NavTab } from '../components/Sidebar';
import DashboardView from '../components/DashboardView';
import OrdensView from '../components/OrdensView';
import CadastrosView from '../components/CadastrosView';
import AtivosView from '../components/AtivosView';
import UsuariosView from '../components/UsuariosView';
import LoginView from '../components/LoginView';
import FirstLoginPasswordModal from '../components/FirstLoginPasswordModal';
import { useTheme } from '../utils/ThemeContext';
import { UserRecord } from '../types';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const { theme } = useTheme();

  // Check active session on mount
  const checkSession = async () => {
    setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        
        // Auto-select first permitted tab if dashboard is disabled for this user
        if (data.user.permissoes && !data.user.permissoes.dashboard) {
          if (data.user.permissoes.ordens) setActiveTab('ordens');
          else if (data.user.permissoes.ativos) setActiveTab('ativos');
          else if (data.user.permissoes.cadastros) setActiveTab('cadastros');
          else if (data.user.perfil === 'ADMIN') setActiveTab('usuarios');
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
      setCurrentUser(null);
    }
  };

  // Loading Screen
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs font-bold text-slate-400 tracking-wider">Carregando Marilux CMMS...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated -> Show Login
  if (!currentUser) {
    return <LoginView onLoginSuccess={(user) => {
      setCurrentUser(user);
      if (user.permissoes && !user.permissoes.dashboard) {
        if (user.permissoes.ordens) setActiveTab('ordens');
        else if (user.permissoes.ativos) setActiveTab('ativos');
        else if (user.permissoes.cadastros) setActiveTab('cadastros');
        else if (user.perfil === 'ADMIN') setActiveTab('usuarios');
      }
    }} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col md:flex-row antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={currentUser} 
        onLogout={handleLogout} 
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 overflow-y-auto space-y-8">
        {activeTab === 'dashboard' && currentUser.permissoes?.dashboard !== false && <DashboardView />}
        {activeTab === 'ordens' && currentUser.permissoes?.ordens !== false && <OrdensView />}
        {activeTab === 'cadastros' && currentUser.permissoes?.cadastros !== false && <CadastrosView />}
        {activeTab === 'ativos' && currentUser.permissoes?.ativos !== false && <AtivosView />}
        {activeTab === 'usuarios' && currentUser.perfil === 'ADMIN' && <UsuariosView />}
      </main>

      {/* First Login Password Change Modal */}
      <FirstLoginPasswordModal
        isOpen={Boolean(currentUser.precisaTrocarSenha)}
        onSuccess={() => {
          setCurrentUser({ ...currentUser, precisaTrocarSenha: false });
        }}
      />

    </div>
  );
}

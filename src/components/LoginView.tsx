'use client';

import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  Building2
} from 'lucide-react';
import { UserRecord } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserRecord) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password Recovery state
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{
    hasEmail?: boolean;
    message: string;
    token?: string;
    isSuccess?: boolean;
  } | null>(null);

  // Reset with token state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resettingWithToken, setResettingWithToken] = useState(false);
  const [tokenResetSuccess, setTokenResetSuccess] = useState(false);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput.trim()) {
      setErrorMessage('Preencha seu usuário/e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: loginInput.trim(),
          senha: passwordInput.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar.');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao conectar ao servidor de autenticação.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Recovery Request
  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput.trim()) {
      setRecoveryResult({ message: 'Digite seu usuário ou e-mail cadastrado.' });
      return;
    }

    setRecoveryLoading(true);
    setRecoveryResult(null);

    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginOrEmail: recoveryInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Usuário não localizado.');
      }

      setRecoveryResult({
        hasEmail: data.hasEmail,
        message: data.message,
        token: data.token,
        isSuccess: true
      });
    } catch (err: any) {
      setRecoveryResult({
        hasEmail: false,
        message: err.message || 'Erro ao consultar usuário.',
        isSuccess: false
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Handle Password Reset with Token
  const handleResetPasswordWithToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas digitadas não conferem.');
      return;
    }

    setResettingWithToken(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: recoveryResult?.token,
          novaSenha: newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha.');
      }

      setTokenResetSuccess(true);
      setTimeout(() => {
        setIsRecoveryOpen(false);
        setRecoveryResult(null);
        setTokenResetSuccess(false);
        setPasswordInput(newPassword);
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao redefinir senha.');
    } finally {
      setResettingWithToken(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-2xl shadow-inner mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide flex items-center justify-center gap-2">
            MARILUX <span className="text-blue-500 font-medium text-lg">CMMS</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sistema Integrado de Gestão de Manutenção e Controle Patrimonial
          </p>
        </div>

        {/* Form View / Recovery View Switcher */}
        {!isRecoveryOpen ? (
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-3 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Input: Login / E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Digite seu usuário ou e-mail"
                  autoComplete="username"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Input: Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 block">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryOpen(true);
                    setErrorMessage(null);
                    setRecoveryResult(null);
                  }}
                  className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                <>
                  Acessar Plataforma
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Password Recovery Modal Area */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" /> Recuperação de Senha
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsRecoveryOpen(false);
                  setRecoveryResult(null);
                }}
                className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            </div>

            {/* If token is generated, show direct reset fields */}
            {recoveryResult?.token && !tokenResetSuccess ? (
              <form onSubmit={handleResetPasswordWithToken} className="space-y-3">
                <div className="bg-blue-950/40 border border-blue-800/40 p-3 rounded-xl text-xs text-blue-300">
                  <p className="font-bold">E-mail localizado!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Defina sua nova senha de acesso abaixo:
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nova Senha</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resettingWithToken}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {resettingWithToken ? 'Gravando...' : 'Salvar Nova Senha'}
                </button>
              </form>
            ) : tokenResetSuccess ? (
              <div className="bg-emerald-950/40 border border-emerald-800/40 p-4 rounded-xl text-center space-y-2 text-emerald-300">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-xs">Senha redefinida com sucesso!</p>
                <p className="text-[11px] text-slate-400">Retornando para a tela de login...</p>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Informe o seu usuário ou e-mail cadastrado para verificar as opções de redefinição de acesso.
                </p>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    placeholder="Seu usuário ou e-mail"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {recoveryResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    recoveryResult.hasEmail 
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300' 
                      : 'bg-amber-950/40 border border-amber-800/40 text-amber-300'
                  }`}>
                    {recoveryResult.hasEmail ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <HelpCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{recoveryResult.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  {recoveryLoading ? 'Consultando...' : 'Verificar Cadastro'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-600" /> Marilux Indústria e Comércio © 2026
          </p>
        </div>

      </div>
    </div>
  );
}

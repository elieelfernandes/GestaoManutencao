'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface FirstLoginPasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export default function FirstLoginPasswordModal({ isOpen, onSuccess }: FirstLoginPasswordModalProps) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaSenha || novaSenha.length < 6) {
      setErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/trocar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao atualizar senha.');
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao registrar nova senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl relative z-10 space-y-5">
        
        {/* Header with warning */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-white tracking-wide">
            Primeiro Acesso: Troca de Senha
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Você está utilizando uma senha provisória padrão. Por motivos de segurança, cadastre sua nova senha pessoal antes de acessar o sistema.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {errorMsg && (
            <div className="bg-rose-950/40 border border-rose-800/40 rounded-xl p-3 flex items-start gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Nova Senha</label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="Digite a nova senha novamente"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Salvando Senha...
              </>
            ) : (
              'Confirmar e Entrar no Sistema'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

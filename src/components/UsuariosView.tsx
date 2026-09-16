'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  Lock, 
  Unlock, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search,
  Check,
  X,
  Shield,
  LayoutDashboard,
  Wrench,
  Package,
  Layers
} from 'lucide-react';
import { UserRecord, UserPermissions } from '../types';

export default function UsuariosView() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Form State for Create / Edit
  const [formNome, setFormNome] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCargo, setFormCargo] = useState('Técnico');
  const [formPerfil, setFormPerfil] = useState<'ADMIN' | 'TECNICO'>('TECNICO');
  const [formStatus, setFormStatus] = useState<'ATIVO' | 'BLOQUEADO'>('ATIVO');
  const [formPermissoes, setFormPermissoes] = useState<UserPermissions>({
    dashboard: true,
    ordens: true,
    ativos: false,
    cadastros: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/usuarios');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao carregar usuários.');
      }
      setUsers(data.usuarios || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao buscar usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormNome('');
    setFormLogin('');
    setFormEmail('');
    setFormCargo('Técnico');
    setFormPerfil('TECNICO');
    setFormStatus('ATIVO');
    setFormPermissoes({
      dashboard: true,
      ordens: true,
      ativos: false,
      cadastros: false
    });
    setErrorMsg(null);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormNome(user.nome);
    setFormLogin(user.login);
    setFormEmail(user.email || '');
    setFormCargo(user.cargo);
    setFormPerfil(user.perfil);
    setFormStatus(user.status);
    setFormPermissoes(user.permissoes || {
      dashboard: true,
      ordens: true,
      ativos: false,
      cadastros: false
    });
    setErrorMsg(null);
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNome.trim() || !formLogin.trim()) {
      setErrorMsg('Nome e Usuário/Login são obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formNome.trim(),
          login: formLogin.trim(),
          email: formEmail.trim() || null,
          cargo: formCargo.trim(),
          perfil: formPerfil,
          permissoes: formPermissoes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário.');
      }

      setSuccessMsg(data.message || 'Usuário criado com sucesso!');
      setIsCreateOpen(false);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          nome: formNome.trim(),
          email: formEmail.trim() || null,
          cargo: formCargo.trim(),
          perfil: formPerfil,
          status: formStatus,
          permissoes: formPermissoes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar usuário.');
      }

      setSuccessMsg(data.message || 'Usuário atualizado com sucesso!');
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao atualizar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset user password to default
  const handleResetPassword = async (userId: number) => {
    if (!confirm('Deseja realmente redefinir a senha deste usuário para a padrão "Marilux@123"?')) return;

    try {
      const res = await fetch('/api/usuarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, resetPassword: true })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao redefinir senha.');
      }

      alert('Senha redefinida com sucesso para "Marilux@123". O usuário deverá alterá-la no próximo acesso.');
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Falha ao redefinir senha.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.login.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    u.cargo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-850 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-wide flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" /> Gestão de Usuários e Permissões
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de acessos, cadastro de operadores e liberação granular de visibilidade dos módulos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Novo Usuário
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-2xl p-4 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome, login, e-mail ou cargo..."
          className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                <th className="py-3 px-4">Usuário / Nome</th>
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4">Perfil</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Módulos Permitidos</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                    {isLoading ? 'Carregando usuários...' : 'Nenhum usuário localizado.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{u.nome}</p>
                        <p className="font-mono text-slate-400 text-[11px]">@{u.login}</p>
                        {u.email && <p className="text-[10px] text-slate-500">{u.email}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {u.cargo}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.perfil === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                          <ShieldCheck className="w-3 h-3" /> Administrador Geral
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Técnico / Operador
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === 'ATIVO' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          <Check className="w-3 h-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                          <Lock className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.permissoes?.dashboard && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Dashboard
                          </span>
                        )}
                        {u.permissoes?.ordens && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30">
                            Ordens de Serviço
                          </span>
                        )}
                        {u.permissoes?.ativos && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/30">
                            Ativos Patrimoniais
                          </span>
                        )}
                        {u.permissoes?.cadastros && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30">
                            Cadastros Mestre
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:text-white bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-600 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-all cursor-pointer"
                          title="Editar Usuário & Permissões"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(u.id)}
                          className="p-1.5 text-amber-600 dark:text-amber-400 hover:text-white bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-600 rounded-lg border border-amber-200 dark:border-amber-500/20 transition-all cursor-pointer"
                          title="Redefinir senha para Marilux@123"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Cadastrar Novo Usuário
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    placeholder="Nome completo do colaborador"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Usuário / Login *</label>
                  <input
                    type="text"
                    required
                    value={formLogin}
                    onChange={(e) => setFormLogin(e.target.value)}
                    placeholder="Login de acesso (exclusivo)"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail Real (Opcional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="E-mail corporativo ou pessoal"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cargo / Função</label>
                  <input
                    type="text"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    placeholder="Cargo ou função do usuário"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Perfil de Acesso</label>
                  <select
                    value={formPerfil}
                    onChange={(e) => {
                      const p = e.target.value as 'ADMIN' | 'TECNICO';
                      setFormPerfil(p);
                      if (p === 'ADMIN') {
                        setFormPermissoes({ dashboard: true, ordens: true, ativos: true, cadastros: true });
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="TECNICO">Técnico / Operador</option>
                    <option value="ADMIN">Administrador Geral</option>
                  </select>
                </div>
              </div>

              {/* Module Visibility Permissions */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Visibilidade de Módulos (O que este usuário pode ver):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.dashboard}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, dashboard: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Dashboard</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.ordens}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, ordens: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Ordens de Serviço</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.ativos}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, ativos: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Ativos Patrimoniais</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.cadastros}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, cadastros: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Cadastros Mestre</span>
                  </label>
                </div>
              </div>

              {/* Password notice */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <p className="font-bold">Senha Provisória Padrão: <span className="font-mono">Marilux@123</span></p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  O usuário será obrigado a criar sua senha pessoal no primeiro acesso.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit User */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Editar Usuário: {editingUser.nome}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={formNome}
                    onChange={(e) => setFormNome(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail Real (Opcional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ex: usuario@marilux.com.br"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cargo</label>
                  <input
                    type="text"
                    value={formCargo}
                    onChange={(e) => setFormCargo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Perfil</label>
                  <select
                    value={formPerfil}
                    onChange={(e) => setFormPerfil(e.target.value as 'ADMIN' | 'TECNICO')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="TECNICO">Técnico / Operador</option>
                    <option value="ADMIN">Administrador Geral</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status da Conta</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'ATIVO' | 'BLOQUEADO')}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="BLOQUEADO">Bloqueado</option>
                  </select>
                </div>
              </div>

              {/* Module Visibility Permissions */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Visibilidade de Módulos:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.dashboard}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, dashboard: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Dashboard</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.ordens}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, ordens: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Ordens de Serviço</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.ativos}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, ativos: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Ativos Patrimoniais</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formPermissoes.cadastros}
                      onChange={(e) => setFormPermissoes({ ...formPermissoes, cadastros: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Cadastros Mestre</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow transition-all cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

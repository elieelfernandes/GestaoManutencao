'use client';

import React, { useState, useEffect } from 'react';
import { User, Building, Wrench, Settings, Plus, Trash2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface LookupItem {
  id: number;
  nome: string;
  areaAtuacao?: string;
}

interface CadastrosState {
  tecnicos: LookupItem[];
  setores: LookupItem[];
  areasTecnicas: LookupItem[];
  tiposManutencao: LookupItem[];
}

export default function CadastrosView() {
  const [data, setData] = useState<CadastrosState>({
    tecnicos: [],
    setores: [],
    areasTecnicas: [],
    tiposManutencao: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [novoTecnico, setNovoTecnico] = useState('');
  const [areaAtuacao, setAreaAtuacao] = useState('');
  const [novoSetor, setNovoSetor] = useState('');
  const [novaAreaTecnica, setNovaAreaTecnica] = useState('');
  const [novoTipoManutencao, setNovoTipoManutencao] = useState('');

  // Fetch all master lookups from API
  const fetchCadastros = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/cadastros');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar cadastros');
      setData({
        tecnicos: json.tecnicos || [],
        setores: json.setores || [],
        areasTecnicas: json.areasTecnicas || [],
        tiposManutencao: json.tiposManutencao || []
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao buscar cadastros no banco de dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCadastros();
  }, []);

  // Add a new master item
  const handleAdd = async (
    type: 'tecnico' | 'setor' | 'area_tecnica' | 'tipo_manutencao',
    nome: string,
    extra?: string,
    ignoreSimilar = false
  ) => {
    if (!nome.trim()) {
      setErrorMsg('O nome do cadastro não pode estar em branco.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/cadastros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, nome: nome.trim(), areaAtuacao: extra, ignoreSimilar })
      });
      const json = await res.json();

      if (res.status === 409 && json.error === 'similar_found') {
        if (confirm(`Aviso: Já existe um cadastro muito semelhante chamado "${json.similarName}".\n\nDeseja mesmo criar um novo registro em vez de reaproveitar o atual?`)) {
          await handleAdd(type, nome, extra, true);
        }
        return;
      }

      if (!res.ok) {
        throw new Error(json.error || json.message || 'Falha ao cadastrar item');
      }

      setSuccessMsg(json.message || 'Cadastro adicionado com sucesso!');
      
      // Clear inputs
      if (type === 'tecnico') { setNovoTecnico(''); setAreaAtuacao(''); }
      if (type === 'setor') setNovoSetor('');
      if (type === 'area_tecnica') setNovaAreaTecnica('');
      if (type === 'tipo_manutencao') setNovoTipoManutencao('');

      fetchCadastros();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar cadastro.');
    }
  };

  // Delete a master item with in-use protection feedback (Rule 6)
  const handleDelete = async (type: 'tecnico' | 'setor' | 'area_tecnica' | 'tipo_manutencao', id: number, nome: string) => {
    if (!confirm(`Deseja realmente excluir o cadastro "${nome}"?`)) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/cadastros?type=${type}&id=${id}&nome=${encodeURIComponent(nome)}`, {
        method: 'DELETE'
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Erro ao excluir cadastro');
      }

      setSuccessMsg(json.message || 'Cadastro excluído com sucesso!');
      fetchCadastros();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao excluir cadastro.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" /> ÁREA 1 — Cadastros Mestre
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie os formulários de entrada para Técnicos, Setores da Fábrica, Áreas Técnicas e Tipos de Manutenção.
          </p>
        </div>

        <button
          onClick={fetchCadastros}
          disabled={isLoading}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-800 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          Atualizar Listas
        </button>
      </div>

      {/* Alert Feedback Banners */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-900/60 rounded-2xl p-4 flex items-start gap-3 text-red-300 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold leading-relaxed">
            <strong className="block text-white font-bold mb-0.5">Atenção:</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-2xl p-4 flex items-start gap-3 text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold">{successMsg}</div>
        </div>
      )}

      {/* Grid of 4 Master Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. TÉCNICOS / RESPONSÁVEIS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-4">
              <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-500/20">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Técnicos & Responsáveis</h3>
                <p className="text-[11px] text-slate-500">Equipe de execução da manutenção</p>
              </div>
            </div>

            {/* Add Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAdd('tecnico', novoTecnico, areaAtuacao); }}
              className="space-y-3 mb-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Técnico *"
                  value={novoTecnico}
                  onChange={(e) => setNovoTecnico(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-blue-500 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                  required
                />
                <input
                  type="text"
                  placeholder="Área de Atuação (ex: Elétrica)"
                  value={areaAtuacao}
                  onChange={(e) => setAreaAtuacao(e.target.value)}
                  className="bg-slate-950 border border-slate-850 focus:border-blue-500 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-98"
              >
                <Plus className="w-4 h-4" /> Adicionar Técnico
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {data.tecnicos.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Nenhum técnico cadastrado.</p>
              ) : (
                data.tecnicos.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-700 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-200">{t.nome}</span>
                      {t.areaAtuacao && (
                        <span className="block text-[10px] text-slate-500">{t.areaAtuacao}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete('tecnico', t.id, t.nome)}
                      title="Excluir cadastro"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-right">
            Total: {data.tecnicos.length} registrados
          </div>
        </div>

        {/* 2. SETORES DA FÁBRICA */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-4">
              <div className="p-2.5 bg-emerald-600/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Setores da Fábrica</h3>
                <p className="text-[11px] text-slate-500">Áreas requisitantes de serviço</p>
              </div>
            </div>

            {/* Add Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAdd('setor', novoSetor); }}
              className="flex gap-2 mb-6"
            >
              <input
                type="text"
                placeholder="Nome do Setor (ex: Linha A) *"
                value={novoSetor}
                onChange={(e) => setNovoSetor(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-emerald-500 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all shrink-0 active:scale-98"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {data.setores.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Nenhum setor cadastrado.</p>
              ) : (
                data.setores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-700 transition-colors">
                    <span className="text-xs font-bold text-slate-200">{s.nome}</span>
                    <button
                      onClick={() => handleDelete('setor', s.id, s.nome)}
                      title="Excluir cadastro"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-right">
            Total: {data.setores.length} registrados
          </div>
        </div>

        {/* 3. ÁREAS TÉCNICAS */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-4">
              <div className="p-2.5 bg-amber-600/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Áreas Técnicas</h3>
                <p className="text-[11px] text-slate-500">Especialidades da manutenção</p>
              </div>
            </div>

            {/* Add Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAdd('area_tecnica', novaAreaTecnica); }}
              className="flex gap-2 mb-6"
            >
              <input
                type="text"
                placeholder="Área Técnica (ex: Mecânica) *"
                value={novaAreaTecnica}
                onChange={(e) => setNovaAreaTecnica(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-amber-500 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 transition-all shrink-0 active:scale-98"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {data.areasTecnicas.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Nenhuma área técnica cadastrada.</p>
              ) : (
                data.areasTecnicas.map((at) => (
                  <div key={at.id} className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-700 transition-colors">
                    <span className="text-xs font-bold text-slate-200">{at.nome}</span>
                    <button
                      onClick={() => handleDelete('area_tecnica', at.id, at.nome)}
                      title="Excluir cadastro"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-right">
            Total: {data.areasTecnicas.length} registradas
          </div>
        </div>

        {/* 4. TIPOS DE MANUTENÇÃO */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4 mb-4">
              <div className="p-2.5 bg-purple-600/10 text-purple-400 rounded-2xl border border-purple-500/20">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Tipos de Manutenção</h3>
                <p className="text-[11px] text-slate-500">Categorização das intervenções</p>
              </div>
            </div>

            {/* Add Form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleAdd('tipo_manutencao', novoTipoManutencao); }}
              className="flex gap-2 mb-6"
            >
              <input
                type="text"
                placeholder="Tipo (ex: Corretiva) *"
                value={novoTipoManutencao}
                onChange={(e) => setNovoTipoManutencao(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 focus:border-purple-500 text-white text-xs rounded-xl px-3 py-2.5 outline-none transition-all"
                required
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 transition-all shrink-0 active:scale-98"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </form>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {data.tiposManutencao.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Nenhum tipo cadastrado.</p>
              ) : (
                data.tiposManutencao.map((tm) => (
                  <div key={tm.id} className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-850 rounded-xl hover:border-slate-700 transition-colors">
                    <span className="text-xs font-bold text-slate-200">{tm.nome}</span>
                    <button
                      onClick={() => handleDelete('tipo_manutencao', tm.id, tm.nome)}
                      title="Excluir cadastro"
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider text-right">
            Total: {data.tiposManutencao.length} registrados
          </div>
        </div>

      </div>

    </div>
  );
}

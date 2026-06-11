import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User, MapPin, Phone, Mail, FileText, Save, RefreshCw, CheckCircle, AlertCircle, Building } from 'lucide-react';

const maskPhone = (v: string) =>
  v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2').substring(0,15);

const Profile: React.FC = () => {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [erro, setErro]         = useState<string | null>(null);
  const [form, setForm]         = useState({
    nome: '', email: '', telefone: '', endereco: '', cnpj: '', nome_fantasia: ''
  });

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const fetchPerfil = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('usuarios')
        .select('nome, email, telefone, endereco, cnpj, nome_fantasia')
        .eq('id', user.id)
        .single();
      if (data) setForm({
        nome:         data.nome         || '',
        email:        data.email        || user.email || '',
        telefone:     data.telefone     || '',
        endereco:     data.endereco     || '',
        cnpj:         data.cnpj         || '',
        nome_fantasia: data.nome_fantasia || '',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPerfil(); }, [fetchPerfil]);

  const handleSave = async () => {
    setErro(null);
    if (!form.nome.trim()) return setErro('Nome é obrigatório.');
    if (!form.endereco.trim()) return setErro('Endereço é obrigatório — ele é usado como ponto de coleta.');
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from('usuarios')
        .update({
          nome:          form.nome.trim(),
          telefone:      form.telefone.trim(),
          endereco:      form.endereco.trim(),
          cnpj:          form.cnpj.trim(),
          nome_fantasia: form.nome_fantasia.trim(),
        })
        .eq('id', user.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      window.dispatchEvent(new CustomEvent('balanceUpdated')); // atualiza nome no layout
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo transition-all";

  if (loading) return (
    <div className="flex justify-center py-20 text-movendo">
      <RefreshCw className="animate-spin" size={28} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto font-sans space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Meu Perfil</h2>
        <p className="text-gray-400 text-sm mt-1">Seu endereço é usado como ponto de coleta nos pedidos.</p>
      </div>

      {/* Avatar + email (não editável) */}
      <div className="bg-slate-950 rounded-3xl p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-movendo/20 flex items-center justify-center text-xl font-black text-movendo shrink-0">
          {form.nome.slice(0,2).toUpperCase() || 'MJ'}
        </div>
        <div>
          <p className="text-white font-black text-lg leading-tight">{form.nome || 'Seu nome'}</p>
          <p className="text-white/40 text-sm mt-0.5 flex items-center gap-1.5">
            <Mail size={12} /> {form.email}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 space-y-5">

        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome completo</label>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className={inputClass} placeholder="Seu nome"
              value={form.nome} onChange={e => set('nome', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nome fantasia / empresa</label>
          <div className="relative">
            <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className={inputClass} placeholder="Nome da empresa (opcional)"
              value={form.nome_fantasia} onChange={e => set('nome_fantasia', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Telefone</label>
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className={inputClass} placeholder="(00) 00000-0000"
              value={form.telefone} onChange={e => set('telefone', maskPhone(e.target.value))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Endereço de coleta
            <span className="ml-2 text-movendo font-black text-[9px] bg-movendo-light px-2 py-0.5 rounded-full normal-case">Importante</span>
          </label>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-movendo" />
            <input type="text" className={inputClass} placeholder="Rua, Número, Bairro, Cidade - UF"
              value={form.endereco} onChange={e => set('endereco', e.target.value)} />
          </div>
          <p className="text-[10px] text-gray-400 ml-1">Este endereço aparece como ponto de coleta nos seus pedidos.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">CNPJ</label>
          <div className="relative">
            <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" className={inputClass} placeholder="00.000.000/0000-00"
              value={form.cnpj} onChange={e => set('cnpj', e.target.value)} />
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 text-green-700 text-xs font-bold px-4 py-3 rounded-xl">
            <CheckCircle size={14} /> Perfil atualizado com sucesso!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-movendo hover:bg-movendo-dark text-white font-black py-4 rounded-2xl shadow-lg shadow-movendo/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
        >
          {saving
            ? <><RefreshCw size={18} className="animate-spin" /> Salvando...</>
            : <><Save size={18} /> Salvar alterações</>
          }
        </button>
      </div>
    </div>
  );
};

export default Profile;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Truck, Mail, Lock, User, MapPin, Phone, AlertCircle, ArrowRight } from 'lucide-react';

const maskPhone = (v: string) => v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'($1) $2').replace(/(\d{5})(\d)/,'$1-$2').substring(0,15);

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const navigate = useNavigate();

  const [form, setForm] = useState({ nome: '', email: '', senha: '', endereco: '', telefone: '' });

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data: auth, error: ae } = await supabase.auth.signUp({
        email: form.email, password: form.senha,
        options: { data: { nome: form.nome, telefone: form.telefone, endereco: form.endereco } }
      });
      if (ae) throw ae;
      if (!auth.user) throw new Error('Erro na autenticação.');

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo transition-all";

  return (
    <div className="min-h-screen bg-white flex font-sans">

      <div className="hidden lg:flex lg:w-[45%] bg-slate-950 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #EA580C 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-movendo rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-xl font-black">
              <span className="text-white">movendo</span><span className="text-movendo">juntos</span>
            </span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">
            Faça parte<br />da rede.
          </h1>
          <p className="text-white/40 mt-4 text-base leading-relaxed">
            Cadastre-se e ganhe<br /><span className="text-movendo font-black text-2xl">12 MOVE</span><br />para começar.
          </p>
          <div className="mt-10 space-y-3">
            {['Sem mensalidade', 'Sem taxa por entrega', 'MOVE não é dinheiro'].map(t => (
              <div key={t} className="flex items-center gap-2 text-white/50 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-movendo"></div>{t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md">

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center">
              <Truck size={18} className="text-movendo" />
            </div>
            <span className="text-lg font-black">
              <span className="text-slate-950">movendo</span><span className="text-movendo">juntos</span>
            </span>
          </div>

          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Criar conta</h2>
          <p className="text-gray-400 text-sm mb-8">Preencha seus dados para entrar na rede.</p>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nome</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required className={inputClass} placeholder="Seu nome"
                    value={form.nome} onChange={e => set('nome', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" required className={inputClass} placeholder="seu@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" required minLength={6} className={inputClass} placeholder="Mínimo 6 caracteres"
                    value={form.senha} onChange={e => set('senha', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Telefone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required className={inputClass} placeholder="(00) 00000-0000"
                    value={form.telefone} onChange={e => set('telefone', maskPhone(e.target.value))} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Endereço de coleta</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" required className={inputClass} placeholder="Rua, Número, Bairro, Cidade - UF"
                    value={form.endereco} onChange={e => set('endereco', e.target.value)} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-2 bg-movendo hover:bg-movendo-dark text-white font-black py-4 rounded-2xl shadow-lg shadow-movendo/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Criando conta...' : <> Criar conta e ganhar 12 MOVE <ArrowRight size={18} /> </>}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400 text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-movendo font-black hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

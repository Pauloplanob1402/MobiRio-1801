import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Truck, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
    } catch {
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">

      {/* Lado esquerdo — visual */}
      <div className="hidden lg:flex lg:w-[45%] bg-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Padrão de fundo sutil */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #EA580C 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-movendo rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="text-white">movendo</span>
              <span className="text-movendo">juntos</span>
            </span>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
            Mova mais.<br />
            <span className="text-movendo">Gaste menos.</span><br />
            Juntos.
          </h1>
          <p className="text-white/40 mt-6 text-lg font-light leading-relaxed">
            A rede colaborativa de fretes.<br />Quem já vai, leva junto.
          </p>
        </div>

        <div className="relative space-y-3">
          {[
            { icon: '📦', text: 'Publique um pedido por 1 MOVE' },
            { icon: '🚗', text: 'Declare sua rota e atraia pedidos' },
            { icon: '✅', text: 'Confirme a entrega e ganhe +1 MOVE' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white/60 text-sm">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">

          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-slate-950 rounded-xl flex items-center justify-center">
              <Truck size={18} className="text-movendo" />
            </div>
            <span className="text-lg font-black">
              <span className="text-slate-950">movendo</span>
              <span className="text-movendo">juntos</span>
            </span>
          </div>

          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Entrar</h2>
          <p className="text-gray-400 text-sm mb-8">Acesse sua conta para continuar.</p>

          {error && (
            <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-2xl">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email" required
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo transition-all"
                  placeholder="seu@email.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password" required
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo transition-all"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-2 bg-movendo hover:bg-movendo-dark text-white font-black py-4 rounded-2xl shadow-lg shadow-movendo/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Entrando...' : (
                <> Entrar <ArrowRight size={18} /> </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400 text-sm">
            Não tem conta?{' '}
            <Link to="/register" className="text-movendo font-black hover:underline">Cadastre-se grátis</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

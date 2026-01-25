
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Truck, Mail, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError('Credenciais inválidas ou erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Lado Esquerdo: Branding conforme a imagem de referência */}
      <div className="hidden lg:flex lg:w-1/2 bg-beirario items-center justify-center p-12 text-white">
        <div className="max-w-md text-center flex flex-col items-center">
          <div className="w-32 h-32 bg-white/10 rounded-[2.5rem] flex items-center justify-center mb-10 backdrop-blur-sm border border-white/5">
            <Truck size={64} strokeWidth={1.5} className="text-white" />
          </div>
          <h1 className="text-6xl font-black mb-6 tracking-tight">Mobirio</h1>
          <p className="text-xl text-white/90 leading-relaxed font-light italic">
            "Organizando fluxos. Movendo juntos."
          </p>
        </div>
      </div>

      {/* Lado Direito: Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-sm:max-w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-beirario flex items-center justify-center rounded-2xl shadow-lg">
              <Truck className="text-white" size={32} />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Boas-vindas</h2>
          <p className="text-gray-500 mb-8">Acesse sua conta corporativa Mobirio</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all"
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="password" 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-beirario/20 transition-all transform active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Ainda não tem acesso?{' '}
            <Link to="/register" className="text-beirario font-bold hover:underline">Solicitar Cadastro</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

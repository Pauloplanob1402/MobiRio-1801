
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Truck, Mail, Lock, User, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome_pessoa: '',
    email: '',
    senha: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Criar Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.senha,
        options: { data: { full_name: formData.nome_pessoa } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro na autenticação.");

      // 2. Criar Perfil com 12 MOVE Automáticos
      const { error: profileError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        nome: formData.nome_pessoa,
        email: formData.email,
        creditos: 12
      });

      if (profileError) throw profileError;

      // 3. Registrar Histórico Inicial
      await supabase.from('movimentos_credito').insert({
        usuario_id: authData.user.id,
        quantidade: 12,
        tipo: 'CREDITO',
        envio_id: null
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-beirario items-center justify-center p-12 text-white">
        <div className="max-w-md text-center flex flex-col items-center">
          <Truck size={64} className="mb-10 opacity-20" />
          <h1 className="text-6xl font-black mb-6">Mobirio</h1>
          <p className="text-xl italic">"Organizando fluxos. Movendo juntos."</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-2">Novo Cadastro</h2>
          <p className="text-gray-500 mb-8">Receba 12 MOVE iniciais ao entrar na rede.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Seu Nome</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Nome Completo" required
                  value={formData.nome_pessoa} onChange={e => setFormData({...formData, nome_pessoa: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Email Corporativo</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="empresa@email.com" required
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase">Senha</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="password" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Mínimo 6 caracteres" required
                  value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-beirario text-white font-bold py-4 rounded-xl shadow-lg mt-4 disabled:opacity-50">
              {loading ? 'Cadastrando...' : 'Criar Conta e Ganhar 12 MOVE'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500">
            Já tem acesso? <Link to="/login" className="text-beirario font-bold">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

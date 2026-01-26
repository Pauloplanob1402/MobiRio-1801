
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Truck, Mail, Lock, User, FileText, MapPin, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    cnpj: '',
    endereco: '',
    telefone: ''
  });

  const maskCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      setFormData(prev => ({ ...prev, cnpj: maskCNPJ(value) }));
    } else if (name === 'telefone') {
      setFormData(prev => ({ ...prev, telefone: maskPhone(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Criar Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.senha,
        options: { data: { full_name: formData.nome } }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro na autenticação.");

      // 2. Criar Fornecedor Vinculado
      const { error: supplierError } = await supabase.from('fornecedores').insert({
        id: authData.user.id,
        razao_social: formData.nome.toUpperCase() + ' LTDA',
        nome_fantasia: formData.nome,
        cnpj: formData.cnpj,
        endereco: formData.endereco,
        telefone: formData.telefone,
        creditos: 12
      });

      if (supplierError) throw supplierError;

      // 3. Criar Perfil de Usuário
      const { error: profileError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        fornecedor_id: authData.user.id,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        cnpj: formData.cnpj,
        endereco: formData.endereco,
        creditos: 12
      });

      if (profileError) throw profileError;

      // 4. Registrar Créditos Iniciais no Histórico
      await supabase.from('movimentos_credito').insert({
        usuario_id: authData.user.id,
        quantidade: 12,
        tipo: 'CREDITO',
        envio_id: null
      });

      alert('Cadastro realizado com sucesso! Você ganhou 12 MOVE.');
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
          <Truck size={80} className="mb-8" />
          <h1 className="text-6xl font-black mb-4 tracking-tighter">Mobirio</h1>
          <p className="text-xl italic opacity-80 italic">"Organizando fluxos. Movendo juntos."</p>
          <div className="mt-10 bg-white/10 p-4 rounded-xl border border-white/10">
            <p className="text-sm font-bold">Receba 12 MOVE iniciais ao entrar na rede.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Cadastre sua Empresa</h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="nome" type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Ex: João da Silva" required value={formData.nome} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="email" type="email" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="empresa@email.com" required value={formData.email} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="senha" type="password" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Mínimo 6 chars" required minLength={6} value={formData.senha} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">CNPJ</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="cnpj" type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="00.000.000/0000-00" required value={formData.cnpj} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="telefone" type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="(00) 00000-0000" required value={formData.telefone} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase">Endereço Completo</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="endereco" type="text" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Rua, Número, Bairro, Cidade - UF" required value={formData.endereco} onChange={handleChange} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg mt-4 disabled:opacity-50 transition-all">
              {loading ? 'Processando...' : 'Finalizar Cadastro e Ganhar 12 MOVE'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Já possui acesso? <Link to="/login" className="text-beirario font-bold">Entrar agora</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

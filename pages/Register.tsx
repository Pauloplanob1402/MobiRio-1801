
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

      // 2. Criar Fornecedor Vinculado (Usando o ID do usuário como ID do fornecedor para 1-para-1 inicial)
      const { error: supplierError } = await supabase.from('fornecedores').insert({
        id: authData.user.id,
        razao_social: formData.nome.toUpperCase(),
        nome_fantasia: formData.nome,
        cnpj: formData.cnpj,
        endereco: formData.endereco
      });

      if (supplierError) throw supplierError;

      // 3. Criar Perfil de Usuário com 12 MOVE Automáticos
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

      // 4. Registrar Histórico Inicial
      await supabase.from('movimentos_credito').insert({
        usuario_id: authData.user.id,
        fornecedor_id: authData.user.id,
        quantidade: 12,
        tipo: 'CREDITO',
        envio_id: null
      });

      alert('Cadastro realizado com sucesso! Você ganhou 12 MOVE iniciais.');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all text-sm";

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="hidden lg:flex lg:w-1/2 bg-beirario items-center justify-center p-12 text-white">
        <div className="max-w-md text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10">
            <Truck size={48} className="text-white" />
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tighter">Mobirio</h1>
          <p className="text-xl font-light italic opacity-90">"Organizando fluxos. Movendo juntos."</p>
          <div className="mt-12 bg-white/10 p-6 rounded-2xl border border-white/5 backdrop-blur-md">
            <CheckCircle2 className="mx-auto mb-3 text-white" size={32} />
            <p className="font-bold text-lg">Bônus de Boas-vindas</p>
            <p className="text-sm opacity-80">Ganhe 12 MOVE automaticamente ao completar seu perfil corporativo.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-beirario flex items-center justify-center rounded-xl">
              <Truck size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-beirario">Mobirio</h1>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Cadastro</h2>
          <p className="text-gray-500 mb-8">Preencha os dados da sua empresa para participar da rede.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-in fade-in zoom-in duration-300">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Nome Completo do Responsável</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="nome" type="text" className={inputClass} placeholder="Ex: João Silva" required
                    value={formData.nome} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="email" type="email" className={inputClass} placeholder="empresa@email.com" required
                    value={formData.email} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="senha" type="password" className={inputClass} placeholder="Mínimo 6 caracteres" required minLength={6}
                    value={formData.senha} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">CNPJ da Empresa</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="cnpj" type="text" className={inputClass} placeholder="00.000.000/0000-00" required
                    value={formData.cnpj} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="telefone" type="text" className={inputClass} placeholder="(00) 00000-0000" required
                    value={formData.telefone} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Endereço Completo</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input name="endereco" type="text" className={inputClass} placeholder="Rua, Número, Bairro, Cidade - UF" required
                    value={formData.endereco} onChange={handleChange} />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-beirario/20 transition-all transform active:scale-[0.98] disabled:opacity-70 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Finalizar Cadastro e Ganhar 12 MOVE</>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            Já possui acesso? <Link to="/login" className="text-beirario font-bold hover:underline">Entrar na plataforma</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

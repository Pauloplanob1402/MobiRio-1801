
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Truck, Mail, Lock, User, Building, Phone, Fingerprint, MapPin, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    endereco: '',
    nome_pessoa: '',
    telefone: '',
    email: '',
    senha: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Registrar no Auth com metadados para disponibilidade imediata
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: formData.email, 
        password: formData.senha,
        options: {
          data: {
            full_name: formData.nome_pessoa
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário de autenticação.");

      // Criar fornecedor
      const { data: supplierData, error: supplierError } = await supabase
        .from('fornecedores')
        .insert({
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          cnpj: formData.cnpj,
          endereco: formData.endereco
        })
        .select()
        .maybeSingle();

      if (supplierError) throw supplierError;
      if (!supplierData) throw new Error("Não foi possível criar o perfil de fornecedor.");

      // Criar usuário vinculado
      const { error: profileError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        fornecedor_id: supplierData.id,
        nome: formData.nome_pessoa,
        telefone: formData.telefone,
        email: formData.email
      });

      if (profileError) throw profileError;

      navigate('/');
    } catch (err: any) {
      console.error("Erro no registro:", err);
      setError(err.message || 'Erro inesperado ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all text-sm";

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
      <div className="hidden lg:flex lg:w-1/3 bg-beirario items-center justify-center p-12 text-white">
        <div className="max-w-md text-center flex flex-col items-center">
          <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center mb-8 backdrop-blur-sm border border-white/5">
            <Truck size={48} strokeWidth={1.5} className="text-white" />
          </div>
          <h1 className="text-4xl font-black mb-6 tracking-tight">Mobirio</h1>
          <p className="text-lg text-white/90 leading-relaxed font-light italic">
            "Organizando fluxos. Movendo juntos."
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-2xl py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Cadastre sua Empresa</h2>
          <p className="text-gray-500 mb-8">Preencha os dados corporativos e do responsável.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-xs font-bold text-beirario uppercase tracking-widest border-b pb-2">Informações Fiscais</h3>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Razão Social</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="Empresa LTDA" required
                  value={formData.razao_social} onChange={e => setFormData({...formData, razao_social: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Nome Fantasia</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="Nome Comercial" required
                  value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">CNPJ</label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="00.000.000/0000-00" required
                  value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Endereço Completo</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="Rua, Número, Cidade" required
                  value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="text-xs font-bold text-beirario uppercase tracking-widest border-b pb-2">Dados do Responsável</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Seu Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="Nome completo" required
                  value={formData.nome_pessoa} onChange={e => setFormData({...formData, nome_pessoa: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="(00) 00000-0000" required
                  value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Email Profissional</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="email" className={inputClass} placeholder="seu@email.com.br" required
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="password" className={inputClass} placeholder="Mínimo 6 caracteres" required
                  value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} />
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button type="submit" disabled={loading} className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-beirario/20 transition-all transform active:scale-[0.98] disabled:opacity-70">
                {loading ? 'Processando Cadastro...' : 'Finalizar e Acessar'}
              </button>
            </div>
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

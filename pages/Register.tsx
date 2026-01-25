
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
      // 1. Criar conta no Supabase Auth
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
      if (!authData.user) throw new Error("Erro ao criar usuário de autenticação.");

      // 2. Criar Fornecedor (opcional, não bloqueia o registro)
      let supplierId = null;
      try {
        const { data: supplierData } = await supabase
          .from('fornecedores')
          .insert({
            razao_social: (formData.razao_social || formData.nome_pessoa).toUpperCase(),
            nome_fantasia: formData.nome_fantasia || formData.nome_pessoa,
            cnpj: formData.cnpj || '00.000.000/0000-00',
            endereco: formData.endereco || 'Pendente'
          })
          .select()
          .single();
        if (supplierData) supplierId = supplierData.id;
      } catch (e) {
        console.warn("Criação de fornecedor falhou, continuando registro de usuário...");
      }

      // 3. Criar registro na tabela 'usuarios' com 12 créditos iniciais (Obrigatório)
      const { error: profileError } = await supabase.from('usuarios').insert({
        id: authData.user.id,
        fornecedor_id: supplierId,
        nome: formData.nome_pessoa,
        email: formData.email,
        telefone: formData.telefone || '(00) 00000-0000',
        creditos: 12
      });

      if (profileError) throw profileError;

      // 4. Inserir movimento de crédito inicial para histórico
      await supabase.from('movimentos_credito').insert({
        fornecedor_id: supplierId,
        usuario_id: authData.user.id,
        quantidade: 12,
        tipo: 'CREDITO',
        envio_id: null
      });

      navigate('/');
    } catch (err: any) {
      console.error("Erro crítico no registro:", err);
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all text-sm text-gray-900";

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans text-gray-900">
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

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-2xl py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Cadastre-se</h2>
          <p className="text-gray-500 mb-8">Participe da rede de logística colaborativa Beira Rio.</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-xs font-bold text-beirario uppercase tracking-widest border-b pb-2">Seus Dados</h3>
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
              <label className="text-xs font-bold text-gray-700">Email Corporativo</label>
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="(00) 00000-0000"
                  value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
              </div>
            </div>

            <div className="space-y-4 md:col-span-2 mt-4">
              <h3 className="text-xs font-bold text-beirario uppercase tracking-widest border-b pb-2">Dados da Empresa (Opcional)</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">Nome Fantasia</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="Nome Comercial"
                  value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700">CNPJ</label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" className={inputClass} placeholder="00.000.000/0000-00"
                  value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button type="submit" disabled={loading} className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-beirario/20 transition-all transform active:scale-[0.98] disabled:opacity-70">
                {loading ? 'Cadastrando...' : 'Criar Conta e Ganhar 12 MOVE'}
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

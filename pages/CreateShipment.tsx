
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Unidade } from '../types';
import { Send, CheckCircle, Building2, FileText } from 'lucide-react';

const CreateShipment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [formData, setFormData] = useState({
    descricao: '',
    unidade_id: '',
  });
  const navigate = useNavigate();

  const fetchUnits = useCallback(async () => {
    const { data } = await supabase
      .from('unidades')
      .select('*')
      .order('nome', { ascending: true });
    if (data) setUnidades(data);
  }, []);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Sessão expirada. Faça login novamente.');

    if (!formData.unidade_id) return alert('Selecione um destino.');
    
    setLoading(true);

    try {
      // REGRA: Pedir carona é GRÁTIS e direto. 
      // Não bloqueia se perfil de fornecedor estiver incompleto.
      const { data: profile } = await supabase
        .from('usuarios')
        .select('fornecedor_id')
        .eq('id', user.id)
        .maybeSingle();

      const { error } = await supabase
        .from('envios')
        .insert({
          solicitante_id: user.id,
          fornecedor_id: profile?.fornecedor_id || null, 
          descricao: formData.descricao,
          unidade_id: formData.unidade_id,
          status: 'disponivel'
        });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => navigate('/meus-envios'), 1500);
    } catch (err: any) {
      alert('Erro ao criar solicitação: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicitação Criada!</h2>
        <p className="text-gray-500">Seu volume está visível para os parceiros.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto font-sans">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Solicitar Carona</h2>
        <p className="text-gray-500 mt-1">Publique o volume que deseja enviar para uma Unidade Beira Rio.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Unidade de Destino</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all text-sm text-gray-900 appearance-none"
                required
                value={formData.unidade_id}
                onChange={(e) => setFormData({...formData, unidade_id: e.target.value})}
              >
                <option value="">Selecione a Unidade Beira Rio</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{u.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Descrição do Volume</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
              <textarea 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all min-h-[120px] text-sm text-gray-900"
                placeholder="Ex: Amostras técnicas de couro (3 caixas)"
                required
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex gap-4">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">
              Voltar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-[2] bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={20} />
              {loading ? 'Processando...' : 'Publicar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShipment;

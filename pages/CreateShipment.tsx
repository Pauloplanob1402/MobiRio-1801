import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Unidade } from '../types';
import { Send, CheckCircle, Building2, FileText, RefreshCw } from 'lucide-react';

// Extrai só "Filial 01 - Igrejinha" do nome completo
const nomesCurto = (nome: string) => nome.split(':')[0].trim();

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

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      alert('Sessão expirada. Faça login novamente.');
      return navigate('/login');
    }

    if (!formData.unidade_id) return alert('Selecione uma unidade de destino.');

    setLoading(true);

    try {
      const { error } = await supabase
        .from('envios')
        .insert({
          solicitante_id: user.id,
          descricao: formData.descricao,
          unidade_id: formData.unidade_id,
          status: 'disponivel',
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
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in duration-300">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight">Solicitado!</h2>
        <p className="text-gray-500 font-medium">Sua carona foi publicada na rede Mobirio.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto font-sans p-6">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">Solicitar Carona</h2>
        <p className="text-gray-500 mt-2 font-medium">Publique um novo volume para transporte colaborativo.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Destino (Unidade Beira Rio)</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-beirario" size={20} />
              <select
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beirario/10 focus:border-beirario text-sm appearance-none font-bold text-gray-700"
                required
                value={formData.unidade_id}
                onChange={(e) => setFormData({ ...formData, unidade_id: e.target.value })}
              >
                <option value="">Selecione a Unidade de Destino</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>{nomesCurto(u.nome)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Descrição Detalhada</label>
            <div className="relative">
              <FileText className="absolute left-4 top-4 text-beirario" size={20} />
              <textarea
                className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beirario/10 focus:border-beirario min-h-[150px] text-sm font-medium text-gray-700 leading-relaxed"
                placeholder="Ex: Amostras de palmilhas, solas e enfeites. 2 caixas pequenas lacradas. Peso aprox: 2kg."
                required
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 px-8 py-4 border border-gray-200 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] bg-beirario hover:bg-beirario-dark text-white font-black py-4 rounded-2xl shadow-xl shadow-beirario/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
              {loading ? 'Publicando...' : 'Publicar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShipment;

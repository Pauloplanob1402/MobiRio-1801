
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Unidade } from '../types';
import { Package, MapPin, FileText, Send, CheckCircle, Building2, AlertCircle } from 'lucide-react';

const CreateShipment: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [fornecedorId, setFornecedorId] = useState('');
  const [userCredits, setUserCredits] = useState<number>(0);
  const [formData, setFormData] = useState({
    descricao: '',
    unidade_id: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (user && isMounted) {
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('fornecedor_id, creditos')
            .eq('id', user.id)
            .maybeSingle();
          
          if (usuario && isMounted) {
            setFornecedorId(usuario.fornecedor_id);
            setUserCredits(usuario.creditos || 0);
          }
        }

        const { data: units, error: unitsError } = await supabase
          .from('unidades')
          .select('*')
          .order('nome', { ascending: true });
        
        if (unitsError) throw unitsError;
        if (units && isMounted) setUnidades(units);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      }
    };

    fetchInitialData();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userCredits < 1) {
      alert('Saldo MOVE insuficiente para solicitar novo envio.');
      return;
    }
    if (!formData.unidade_id) return alert('Selecione uma unidade Beira Rio de destino.');
    if (!fornecedorId) return alert('Perfil de fornecedor não encontrado. Recarregue a página.');
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('envios')
        .insert({
          fornecedor_id: fornecedorId,
          descricao: formData.descricao,
          unidade_id: formData.unidade_id,
          status: 'disponivel'
        });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => navigate('/meus-envios'), 2000);
    } catch (err: any) {
      alert('Erro ao criar envio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicitação Enviada!</h2>
        <p className="text-gray-500">Seu volume já está disponível para carona.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto font-sans">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Novo Envio</h2>
          <p className="text-gray-500 mt-1">Solicite o transporte de volumes para uma Unidade Beira Rio.</p>
        </div>
        <div className="bg-beirario-light text-beirario px-4 py-2 rounded-xl border border-beirario/10">
          <p className="text-[10px] font-bold uppercase">Seu Saldo</p>
          <p className="text-xl font-black">{userCredits} MOVE</p>
        </div>
      </div>

      {userCredits < 1 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3 text-orange-700 text-sm">
          <AlertCircle size={20} />
          <div>
            <p className="font-bold">Saldo MOVE insuficiente</p>
            <p className="text-xs">Para solicitar um envio, você precisa oferecer caronas e acumular MOVE.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Unidade Beira Rio (Destino)</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <select 
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/20 focus:border-beirario transition-all appearance-none text-sm text-gray-900"
                required
                disabled={userCredits < 1}
                value={formData.unidade_id}
                onChange={(e) => setFormData({...formData, unidade_id: e.target.value})}
              >
                <option value="">Selecione o destino</option>
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
                placeholder="Ex: 5 pares de palmilha, amostras técnicas, etc."
                required
                disabled={userCredits < 1}
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              ></textarea>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex gap-4">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading || userCredits < 1} 
              className="flex-[2] bg-beirario hover:bg-beirario-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-beirario/10 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
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

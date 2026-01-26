import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, MapPin, User, Phone } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // PARTE 2: BUSCANDO NOMES E ENDEREÇOS REAIS
      const { data, error } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios!solicitante_id(nome, endereco, telefone)
        `) 
        .eq('status', 'disponivel')
        .is('fornecedor_id', null)
        .neq('solicitante_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEnvios(data || []);
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
    const channel = supabase.channel('available_realtime').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'envios' }, () => fetchAvailable()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // PARTE 1: APENAS ACEITAR A CARONA (ENTRAR EM ROTA)
  const handleAccept = async (envioId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('envios')
      .update({
        fornecedor_id: user.id,
        status: 'em_transito'
      })
      .eq('id', envioId);

    if (error) {
      alert('Erro ao aceitar: ' + error.message);
    } else {
      alert('✅ Carona aceita! Vá em "Minhas Atividades" para entregar e ganhar seu MOVE.');
      fetchAvailable();
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Buscando caronas...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-3xl font-black text-gray-900">Caronas Disponíveis</h2>
        <p className="text-gray-500">Volumes aguardando coleta.</p>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed p-20 text-center text-gray-400">
          <Truck className="mx-auto mb-4" size={48} />
          <p>Nenhuma carona disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between mb-4">
                <div className="bg-beirario/10 p-2 rounded text-beirario"><Package /></div>
                <span className="text-[10px] text-gray-400 uppercase font-bold">Pendente</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <p className="font-bold text-gray-800">{envio.solicitante?.nome || 'Usuário Desconhecido'}</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-red-500 mt-1" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Local de Coleta</p>
                    <p className="text-sm">{envio.solicitante?.endereco || 'Endereço não cadastrado'}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Item</p>
                  <p className="text-sm italic">"{envio.descricao}"</p>
                </div>
              </div>

              <button 
                onClick={() => handleAccept(envio.id)}
                className="w-full mt-6 bg-black text-white py-4 rounded-xl font-bold hover:bg-beirario transition-colors"
              >
                Aceitar Carona e Iniciar Rota
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;
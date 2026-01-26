import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, MapPin, CheckCircle2 } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ETAPA 1: BUSCAR CARONAS (ESCONDENDO AS MINHAS)
  const fetchAvailable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('envios')
        .select('*') 
        .eq('status', 'disponivel')
        .neq('solicitante_id', user.id) // Garante que o Paulo não veja as caronas do Paulo
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
    
    // ATUALIZAÇÃO EM TEMPO REAL
    const channel = supabase
      .channel('realt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => {
        fetchAvailable();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ETAPA 2: O BOTÃO QUE FAZ O +1 E -1 (RPC DO SÊNIOR)
  const handleAccept = async (envio: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Faça login primeiro!');
      return;
    }

    const confirmar = window.confirm("Deseja confirmar a entrega e receber 1 MOVE?");
    if (!confirmar) return;

    // AQUI É ONDE O CRÉDITO TROCA DE MÃOS
    const { data, error } = await supabase.rpc('rpc_confirmar_entrega', {
      p_solicitante_id: envio.solicitante_id,
      p_motorista_id: user.id
    });

    if (error) {
      alert('Erro no Banco: ' + error.message);
    } else {
      alert('✅ SUCESSO! Você recebeu 1 MOVE.');
      fetchAvailable(); // Recarrega para o card sumir
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Carregando conexões...</div>;

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="border-b pb-4">
        <h2 className="text-3xl font-black text-gray-900">Caronas Disponíveis</h2>
        <p className="text-gray-500">Apenas volumes de outros parceiros.</p>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed p-20 text-center">
          <Truck className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold">Tudo limpo!</h3>
          <p className="text-gray-400">Não há caronas de outros usuários no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-beirario/10 p-3 rounded-lg text-beirario">
                  <Package size={24} />
                </div>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded">
                  ID: {envio.id.slice(0, 8)}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descrição</p>
                  <p className="font-semibold text-gray-800">"{envio.descricao}"</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-red-500" />
                  <p className="text-xs text-gray-600">Solicitante: {envio.solicitante_id.slice(0, 8)}...</p>
                </div>
              </div>

              <button 
                onClick={() => handleAccept(envio)}
                className="w-full mt-6 bg-beirario hover:bg-black text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-beirario/20"
              >
                <CheckCircle2 size={18} />
                Confirmar Entrega e Ganhar MOVE
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;
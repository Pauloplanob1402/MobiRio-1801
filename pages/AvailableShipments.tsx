
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, MapPin, User, Building2, RefreshCw } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailable = useCallback(async () => {
    try {
      // RESET TOTAL: Query simplificada sem joins para eliminar Erro 400
      const { data, error } = await supabase
        .from('envios')
        .select('*') 
        .eq('status', 'disponivel')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // TESTE DE VISIBILIDADE: Mostrando tudo o que está na tabela para confirmar conexão
      setEnvios(data || []);
    } catch (err) {
      console.error("Erro na busca simplificada (Status 400?):", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();

    // REALTIME: Subscrição direta para refletir inserções manuais instantaneamente
    const channel = supabase.channel('realtime_available_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, (payload) => {
        console.log('Mudança detectada no banco:', payload);
        fetchAvailable();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAvailable]);

  const handleAccept = async (envioId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('envios')
      .update({ 
        fornecedor_id: user.id, 
        status: 'em_transito',
        aceito_por: user.id,
        aceito_em: new Date().toISOString()
      })
      .eq('id', envioId);

    if (error) {
      alert('Erro ao aceitar: ' + error.message);
    } else {
      alert('✅ Carona aceita!');
      fetchAvailable();
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-beirario" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-900 uppercase">Caronas Disponíveis</h2>
        <button onClick={fetchAvailable} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed p-20 text-center text-gray-400">
          <Truck className="mx-auto mb-4 opacity-20" size={60} />
          <p className="font-medium">Nenhum registro encontrado na tabela 'envios'.</p>
          <p className="text-xs mt-2">Verifique se existem linhas com status 'disponivel'.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border-l-8 border-beirario shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-black uppercase text-gray-800 text-sm">
                    <User size={16}/> ID SOLICITANTE: {envio.solicitante_id.substring(0,8)}...
                  </div>
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full font-bold text-gray-500">
                    {new Date(envio.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2 text-xs font-bold text-gray-600">
                    <Building2 size={14} className="text-beirario"/> UNIDADE ID: {envio.unidade_id}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed font-medium">"{envio.descricao}"</p>
                </div>

                <button 
                  onClick={() => handleAccept(envio.id)} 
                  className="w-full bg-black hover:bg-beirario text-white py-4 rounded-2xl font-black uppercase transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Truck size={18} />
                  Aceitar Carona
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;

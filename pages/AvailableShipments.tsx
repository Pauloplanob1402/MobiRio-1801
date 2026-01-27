import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Truck, User, Building2, RefreshCw, MapPin } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailable = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      // AGORA COM JOINS: Buscando nomes reais em vez de IDs
      const { data, error } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios!solicitante_id(nome, endereco),
          unidade:unidades(nome)
        `) 
        .eq('status', 'disponivel')
        .is('fornecedor_id', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Filtra para não ver os próprios pedidos
      const filtered = user ? (data || []).filter(item => item.solicitante_id !== user.id) : (data || []);
      setEnvios(filtered);
    } catch (err) {
      console.error("Erro na busca de caronas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    const channel = supabase.channel('realtime_available')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => fetchAvailable())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAvailable]);

  const handleAccept = async (envioId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('envios')
        .update({ 
          fornecedor_id: user.id, 
          status: 'em_transito'
        })
        .eq('id', envioId)
        .select();

      if (error) throw error;
      
      alert('✅ Carona aceita! Vá em "Minhas Atividades" para ver os detalhes de entrega.');
      fetchAvailable();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20 text-beirario">
      <RefreshCw className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Caronas Disponíveis</h2>
        <button onClick={fetchAvailable} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed p-20 text-center text-gray-400">
          <Truck className="mx-auto mb-4 opacity-10" size={64} />
          <p className="font-bold uppercase tracking-widest text-xs">Nenhuma carona no radar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all border-t-8 border-t-beirario">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-black uppercase text-gray-800 text-[11px]">
                    <User size={14} className="text-beirario"/> 
                    {envio.solicitante?.nome || 'Usuário'}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2 text-[10px] font-black text-gray-600 uppercase">
                    <MapPin size={14} className="text-red-500 shrink-0"/> 
                    <span>COLETA: {envio.solicitante?.endereco || 'Endereço não informado'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px] font-black text-gray-600 uppercase">
                    <Building2 size={14} className="text-blue-500 shrink-0"/> 
                    <span>DESTINO: {envio.unidade?.nome || 'Unidade Beira Rio'}</span>
                  </div>
                </div>
                
                <div className="p-3 border-l-4 border-gray-200 bg-gray-50/30">
                  <p className="text-xs text-gray-700 font-bold italic">"{envio.descricao}"</p>
                </div>

                <button 
                  onClick={() => handleAccept(envio.id)} 
                  className="w-full bg-black hover:bg-beirario text-white py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <Truck size={18} />
                  Aceitar e Transportar
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

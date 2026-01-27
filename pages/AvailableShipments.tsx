
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Truck, User, Building2, RefreshCw } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailable = useCallback(async () => {
    try {
      console.log('Iniciando busca de caronas...');
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      // Simplificação total: select('*') sem joins para evitar erro 400
      const { data, error } = await supabase
        .from('envios')
        .select('*') 
        .eq('status', 'disponivel')
        .is('fornecedor_id', null)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erro 400 detectado:", error);
        throw error;
      }
      
      // Filtragem manual do solicitante no frontend para manter query simples
      const filtered = user ? (data || []).filter(item => item.solicitante_id !== user.id) : (data || []);
      
      console.log('Caronas carregadas:', filtered);
      setEnvios(filtered);
    } catch (err) {
      console.error("Erro na busca simplificada:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();

    const channel = supabase.channel('realtime_available_simple')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => {
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

    try {
      // Adicionado .select() no final para evitar erro 400
      const { error } = await supabase
        .from('envios')
        .update({ 
          fornecedor_id: user.id, 
          status: 'em_transito',
          aceito_por: user.id,
          aceito_em: new Date().toISOString()
        })
        .eq('id', envioId)
        .select();

      if (error) throw error;
      
      alert('✅ Carona aceita! Verifique em "Minhas Atividades".');
      fetchAvailable();
    } catch (err: any) {
      console.error('Erro ao aceitar carona:', err);
      alert('Erro: ' + err.message);
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
          <p className="font-medium">Nenhuma carona disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border-l-8 border-beirario shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 font-black uppercase text-gray-800 text-[10px] tracking-tighter">
                    <User size={14}/> SOLICITANTE: {envio.solicitante_id.substring(0,8)}...
                  </div>
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full font-bold text-gray-500">
                    {new Date(envio.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-tighter">
                    <Building2 size={14} className="text-beirario"/> UNIDADE DESTINO: {envio.unidade_id.substring(0,8)}...
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-700 font-medium">"{envio.descricao}"</p>
                </div>

                <button 
                  onClick={() => handleAccept(envio.id)} 
                  className="w-full bg-black hover:bg-beirario text-white py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-2 active:scale-95"
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

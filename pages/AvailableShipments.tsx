import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, MapPin, User, Building2, RefreshCw } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailable = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('envios')
        .select(`*, solicitante:usuarios!solicitante_id(nome, endereco), unidade:unidades(nome)`) 
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
  }, []);

  useEffect(() => {
    fetchAvailable();

    // REALTIME: Escuta qualquer mudança na tabela 'envios'
    const channel = supabase.channel('available_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => fetchAvailable())
      .subscribe();

    window.addEventListener('focus', fetchAvailable);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', fetchAvailable);
    };
  }, [fetchAvailable]);

  const handleAccept = async (envioId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('envios')
      .update({ fornecedor_id: user.id, status: 'em_transito' })
      .eq('id', envioId);

    if (error) {
      alert('Erro ao aceitar: ' + error.message);
    } else {
      alert('✅ Carona aceita!');
      fetchAvailable();
    }
  };

  if (loading) return <div className="p-10 text-center"><RefreshCw className="animate-spin mx-auto text-beirario" /></div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-black text-gray-900 uppercase">Caronas Disponíveis</h2>
      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed p-20 text-center text-gray-400">
          <Truck className="mx-auto mb-4 opacity-20" size={60} />
          <p>Nenhuma carona no radar no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border-l-8 border-beirario shadow-md">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-black uppercase text-gray-800"><User size={18}/> {envio.solicitante?.nome}</div>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <div className="flex items-start gap-2 text-xs font-bold"><MapPin size={14} className="text-red-500"/> COLETAR: {envio.solicitante?.endereco}</div>
                  <div className="flex items-start gap-2 text-xs font-bold"><Building2 size={14} className="text-blue-500"/> DESTINO: {envio.unidade?.nome}</div>
                </div>
                <p className="text-sm italic text-gray-600">"{envio.descricao}"</p>
                <button onClick={() => handleAccept(envio.id)} className="w-full bg-black hover:bg-beirario text-white py-4 rounded-2xl font-black uppercase transition-all shadow-lg active:scale-95">Aceitar e Iniciar Rota</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;
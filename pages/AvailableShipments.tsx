import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, MapPin, CheckCircle2 } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailable = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // QUERY ULTRA SIMPLES PARA MATAR O ERRO 400
    const { data, error } = await supabase
      .from('envios')
      .select('*') 
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false });
    
    if (!error) setEnvios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAvailable();
    const channel = supabase.channel('realt').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'envios' }, () => fetchAvailable()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAccept = async (envio: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // CHAMA A RPC DO SÊNIOR EXATAMENTE COMO ELE MANDOU
    const { data, error } = await supabase.rpc('rpc_confirmar_entrega', {
      p_solicitante_id: envio.solicitante_id,
      p_motorista_id: user.id
    });

    if (error) {
      alert('Erro no Crédito: ' + error.message);
    } else {
      alert('SUCESSO! Crédito transferido (+1/-1).');
      fetchAvailable();
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando conexões...</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-black">Caronas Disponíveis (MODO RESGATE)</h2>
      <div className="grid grid-cols-1 gap-4">
        {envios.map((envio) => (
          <div key={envio.id} className="bg-white p-6 rounded-2xl border shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <Package className="text-beirario" />
              <span className="text-xs font-mono">{envio.id.slice(0,8)}</span>
            </div>
            <p className="font-bold">Solicitante ID: {envio.solicitante_id.slice(0,8)}...</p>
            <p className="text-sm text-gray-600 mb-4">{envio.descricao}</p>
            <button 
              onClick={() => handleAccept(envio)}
              className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800"
            >
              Confirmar Entrega e Ganhar MOVE
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableShipments;

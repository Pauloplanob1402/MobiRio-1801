import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, CheckCircle, MapPin, Building2, RefreshCw } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [emTransporte, setEmTransporte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pedidos } = await supabase.from('envios').select(`*, unidade:unidades(nome), fornecedor:usuarios!fornecedor_id(nome)`)
        .eq('solicitante_id', user.id).order('created_at', { ascending: false });
      setSolicitados(pedidos || []);

      const { data: transporte } = await supabase.from('envios').select(`*, solicitante:usuarios!solicitante_id(nome, endereco), unidade:unidades(nome)`)
        .eq('fornecedor_id', user.id).eq('status', 'em_transito');
      setEmTransporte(transporte || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('my_activities_realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => fetchData()).subscribe();
    window.addEventListener('focus', fetchData);
    return () => { supabase.removeChannel(channel); window.removeEventListener('focus', fetchData); };
  }, [fetchData]);

  const handleConfirmDelivery = async (envio: any) => {
    if (!window.confirm("Confirmar entrega?")) return;
    try {
      const { error } = await supabase.rpc('rpc_confirmar_entrega', { p_solicitante_id: envio.solicitante_id, p_motorista_id: envio.fornecedor_id });
      if (error) throw error;
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      alert('✅ Entrega realizada!');
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="p-10 text-center"><RefreshCw className="animate-spin mx-auto text-beirario" /></div>;

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-3xl font-black uppercase">Minhas Atividades</h2>
      <section className="space-y-4">
        <h3 className="font-bold text-beirario uppercase border-l-4 border-beirario pl-2">Estou Transportando</h3>
        {emTransporte.map(envio => (
          <div key={envio.id} className="bg-white p-6 rounded-3xl border-2 border-beirario shadow-lg flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <p className="font-black text-sm uppercase">PARA: {envio.solicitante?.nome}</p>
              <p className="text-xs text-gray-500">{envio.solicitante?.endereco} → {envio.unidade?.nome}</p>
            </div>
            <button onClick={() => handleConfirmDelivery(envio)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs">Finalizar Entrega</button>
          </div>
        ))}
      </section>
    </div>
  );
};

export default MyShipments;

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, RefreshCw, User, Building2, Package, AlertTriangle } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [emTransporte, setEmTransporte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: pedidos, error: err1 } = await supabase
        .from('envios')
        .select('*, unidade:unidades(nome), fornecedor:usuarios!fornecedor_id(nome)')
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });

      if (err1) {
        console.error("Erro em pedidos:", err1);
        pedidos = [];
      }

      let { data: transporte, error: err2 } = await supabase
        .from('envios')
        .select('*, solicitante:usuarios!solicitante_id(nome, endereco), unidade:unidades(nome)')
        .eq('fornecedor_id', user.id)
        .eq('status', 'em_transito');

      if (err2) {
        console.error("Erro em transporte:", err2);
        transporte = [];
      }

      setSolicitados(pedidos || []);
      setEmTransporte(transporte || []);
    } catch (err) {
      console.error("Erro MyShipments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmDelivery = async (envio: any) => {
    if (!window.confirm("Confirmar entrega?")) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.rpc('rpc_confirmar_entrega', { 
        solicitante_id: envio.solicitante_id, 
        motorista_id: user?.id 
      });
      if (error) throw error;
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      alert('✅ Entrega finalizada!');
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-beirario" size={32} /></div>;

  return (
    <div className="p-6 space-y-10 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black uppercase">Minhas Atividades</h2>
      </div>
      
      <section className="space-y-4">
        <h3 className="font-bold text-beirario border-l-4 border-beirario pl-3 uppercase">Em Transporte</h3>
        {emTransporte.map(envio => (
          <div key={envio.id} className="bg-white p-6 rounded-3xl border-2 border-beirario shadow-lg flex flex-col md:flex-row gap-4 items-center border-l-[12px]">
            <div className="flex-1 space-y-2">
              <p className="font-black text-[10px] uppercase text-gray-500">
                PARA: {envio.solicitante?.nome || `ID: ${envio.solicitante_id?.substring(0,8)}`}
              </p>
              <div className="p-3 bg-gray-50 rounded-xl text-xs font-bold italic">"{envio.descricao}"</div>
            </div>
            <button onClick={() => handleConfirmDelivery(envio)} className="bg-green-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs transition-all">
              Finalizar Entrega
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-4 pt-10 border-t">
        <h3 className="font-bold text-gray-400 border-l-4 border-gray-300 pl-3 uppercase">Meus Pedidos</h3>
        {solicitados.map(envio => (
          <div key={envio.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-gray-800 text-sm uppercase">{envio.descricao}</p>
              <p className="text-[10px] text-gray-400 font-black">
                {envio.unidade?.nome || `UNIDADE: ${envio.unidade_id?.substring(0,8)}`} | {envio.status}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default MyShipments;

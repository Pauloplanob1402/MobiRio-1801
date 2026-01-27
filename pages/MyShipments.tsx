
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, RefreshCw, User, Building2 } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [emTransporte, setEmTransporte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Buscando minhas atividades...');

      // Query simples select('*') sem joins para evitar erro 400
      const { data: pedidos, error: err1 } = await supabase
        .from('envios')
        .select('*')
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });
      
      if (err1) console.error("Erro 400 busca pedidos:", err1);
      setSolicitados(pedidos || []);

      const { data: transporte, error: err2 } = await supabase
        .from('envios')
        .select('*')
        .eq('fornecedor_id', user.id)
        .eq('status', 'em_transito');
      
      if (err2) console.error("Erro 400 busca transporte:", err2);
      setEmTransporte(transporte || []);
    } catch (err) { 
      console.error("Erro geral no MyShipments:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('my_activities_simple')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleConfirmDelivery = async (envio: any) => {
    if (!window.confirm("Confirmar entrega?")) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      console.log('Chamando RPC rpc_confirmar_entrega...');
      
      // Chamada RPC conforme instrução: p_solicitante_id e p_motorista_id
      const { data, error } = await supabase.rpc('rpc_confirmar_entrega', { 
        p_solicitante_id: envio.solicitante_id, 
        p_motorista_id: user.id 
      });

      if (error) {
        console.error("Erro na RPC:", error);
        throw error;
      }
      
      console.log('RPC resposta:', data);
      
      // Notificar atualização global de saldo
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      
      alert('✅ Entrega confirmada! Saldo MOVE atualizado.');
      fetchData();
    } catch (err: any) { 
      console.error("Falha ao confirmar entrega:", err);
      alert('Erro na transação: ' + err.message); 
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-beirario" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-10 max-w-5xl mx-auto">
      <h2 className="text-3xl font-black uppercase text-gray-900">Minhas Atividades</h2>
      
      <section className="space-y-4">
        <h3 className="font-bold text-beirario uppercase border-l-4 border-beirario pl-3">Em Transporte</h3>
        {emTransporte.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum volume em transporte.</p>
        ) : (
          emTransporte.map(envio => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border-2 border-beirario shadow-lg flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 space-y-2">
                <p className="font-black text-[10px] uppercase text-gray-500">SOLICITANTE: {envio.solicitante_id}</p>
                <div className="p-3 bg-gray-50 rounded-xl text-xs font-bold">"{envio.descricao}"</div>
              </div>
              <button 
                onClick={() => handleConfirmDelivery(envio)} 
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
              >
                <CheckCircle size={18} />
                Confirmar Entrega
              </button>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4 pt-10 border-t border-gray-100">
        <h3 className="font-bold text-gray-400 uppercase border-l-4 border-gray-300 pl-3">Meus Pedidos</h3>
        {solicitados.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Nenhum pedido criado.</p>
        ) : (
          <div className="grid gap-4">
            {solicitados.map(envio => (
              <div key={envio.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{envio.descricao}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Unidade: {envio.unidade_id.substring(0,8)}... | {new Date(envio.created_at).toLocaleDateString()}</p>
                </div>
                <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${envio.status === 'entregue' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {envio.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MyShipments;

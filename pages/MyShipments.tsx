
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, Truck, CheckCircle, Clock, Building2, RefreshCw, Phone, MapPin } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [emTransporte, setEmTransporte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      // MEUS ENVIOS: Filtro correto onde solicitante_id é igual ao ID do usuário logado
      const { data: dataSolicitados } = await supabase
        .from('envios')
        .select(`
          *,
          unidade:unidades(nome),
          fornecedor:usuarios!fornecedor_id(nome, telefone)
        `)
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });

      setSolicitados(dataSolicitados || []);

      // TRANSPORTANDO: Envios aceitos pelo usuário logado
      const { data: dataTransporte } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios!solicitante_id(nome, telefone, endereco),
          unidade:unidades(nome)
        `)
        .eq('fornecedor_id', user.id)
        .eq('status', 'em_transito')
        .order('created_at', { ascending: false });

      setEmTransporte(dataTransporte || []);
    } catch (err) {
      console.error("Erro ao carregar atividades:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('my-activities-realtime')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'envios' }, 
        () => fetchData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleConfirmDelivery = async (envioId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    
    if (!window.confirm("Confirmar entrega? Isso gera +1 MOVE para você e debita 1 MOVE do solicitante.")) return;

    setProcessingId(envioId);
    try {
      // CONFIRMAÇÃO: Uso da função RPC rpc_confirmar_entrega para transação atômica
      const { data, error } = await supabase.rpc('rpc_confirmar_entrega', {
        p_envio_id: envioId,
        p_driver_user_id: auth.user.id
      });

      if (error) throw error;
      
      const result = data as any;
      if (result && result.success === false) {
        alert(result.message);
      } else {
        // Notifica outros componentes da mudança de saldo
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        alert("Entrega confirmada com sucesso!");
        fetchData();
      }
    } catch (err: any) {
      alert("Erro ao confirmar entrega: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 font-sans pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Minhas Atividades</h2>
          <p className="text-gray-500 mt-1">Volumes sob sua responsabilidade e solicitações criadas.</p>
        </div>
        <button onClick={fetchData} disabled={refreshing} className="p-3 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-beirario transition-all shadow-sm">
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      <section className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-beirario pl-4">Caronas que estou transportando</h3>
        <div className="grid gap-4">
          {emTransporte.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed text-center text-gray-400 text-sm">Nenhuma carona em transporte no momento.</div>
          ) : (
            emTransporte.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">
                <div className="w-12 h-12 bg-beirario-light text-beirario rounded-xl flex items-center justify-center shrink-0">
                  <Truck size={24} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 uppercase text-sm">{envio.solicitante?.nome}</h4>
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Em Trânsito</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">"{envio.descricao}"</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-gray-600">
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-orange-400" /> <b>RETIRADA:</b> {envio.solicitante?.endereco}</span>
                    <span className="flex items-center gap-1.5"><Building2 size={14} className="text-beirario" /> <b>DESTINO:</b> {envio.unidade?.nome}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <button onClick={() => handleConfirmDelivery(envio.id)} disabled={processingId === envio.id} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-black py-3 px-6 rounded-xl text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                    {processingId === envio.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                    Confirmar Entrega
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-gray-300 pl-4">Meus Envios Solicitados</h3>
        <div className="grid gap-4">
          {solicitados.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed text-center text-gray-400 text-sm">Você ainda não solicitou caronas.</div>
          ) : (
            solicitados.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center opacity-90 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={24} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 text-base">{envio.descricao}</h4>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${envio.status === 'disponivel' ? 'bg-gray-100 text-gray-500' : envio.status === 'entregue' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {envio.status === 'disponivel' ? 'Aguardando Coleta' : envio.status === 'entregue' ? 'Entregue' : 'Em Rota'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1.5 font-bold"><Building2 size={14} /> DESTINO: {envio.unidade?.nome}</span>
                    {envio.fornecedor && <span className="flex items-center gap-1.5 text-blue-600 font-bold uppercase tracking-tighter"><Truck size={14} /> TRANSPORTADO POR: {envio.fornecedor.nome}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default MyShipments;

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, CheckCircle, Building2, RefreshCw, MapPin, User } from 'lucide-react';

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
      const user = auth?.user;
      if (!user) return;

      // 1. CARONAS QUE EU PEDI (Solicitante)
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

      // 2. CARONAS QUE ESTOU LEVANDO (Motorista/Fornecedor)
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
      console.error("Erro na busca de atividades:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('my-activities-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleConfirmDelivery = async (envio: any) => {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;
    
    if (!window.confirm("Você confirma que entregou este volume? 1 MOVE será transferido para você.")) return;

    setProcessingId(envio.id);
    try {
      // CHAMADA DA RPC DO SÊNIOR COM OS PARÂMETROS CERTOS
      const { data, error } = await supabase.rpc('rpc_confirmar_entrega', {
        p_solicitante_id: envio.solicitante_id,
        p_motorista_id: user.id
      });

      if (error) throw error;
      
      // DISPARA O EVENTO PARA O SALDO NO HEADER/WALLET ATUALIZAR
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      
      alert('✅ SUCESSO! Você recebeu seu MOVE por esta entrega.');
      fetchData();
    } catch (err: any) {
      console.error("Erro ao confirmar:", err);
      alert("Erro no processo: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-beirario" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 font-sans pb-10 px-4">
      <div className="flex justify-between items-center mt-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Minhas Atividades</h2>
          <p className="text-gray-500">Acompanhe seus envios e entregas em curso.</p>
        </div>
        <button onClick={fetchData} className="p-3 bg-white border border-gray-200 rounded-xl hover:text-beirario transition-all shadow-sm">
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* SEÇÃO: ESTOU TRANSPORTANDO */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-beirario pl-4 text-beirario uppercase italic">Caronas que estou levando</h3>
        <div className="grid gap-4">
          {emTransporte.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border-2 border-dashed text-center text-gray-400">Não há caronas em trânsito com você.</div>
          ) : (
            emTransporte.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-3xl border-2 border-beirario shadow-lg flex flex-col md:flex-row gap-6 md:items-center">
                <div className="w-14 h-14 bg-beirario text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                  <Truck size={28} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <h4 className="font-black text-gray-900 uppercase text-sm">PARA: {envio.solicitante?.nome}</h4>
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-black uppercase tracking-widest">Em Rota</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium text-gray-600">
                    <span className="flex items-center gap-2"><MapPin size={14} className="text-red-500" /> <b>ORIGEM:</b> {envio.solicitante?.endereco}</span>
                    <span className="flex items-center gap-2"><Building2 size={14} className="text-blue-500" /> <b>DESTINO:</b> {envio.unidade?.nome}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-black uppercase">Volume:</p>
                    <p className="text-sm italic font-bold text-gray-700">"{envio.descricao}"</p>
                  </div>
                </div>
                <div className="shrink-0">
                  <button 
                    onClick={() => handleConfirmDelivery(envio)} 
                    disabled={processingId === envio.id} 
                    className="w-full md:w-auto bg-green-600 hover:bg-black text-white font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
                  >
                    {processingId === envio.id ? <RefreshCw className="animate-spin" /> : <CheckCircle size={18} />}
                    Finalizar Entrega
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SEÇÃO: MINHAS SOLICITAÇÕES */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-gray-300 pl-4 uppercase">Meus Envios Solicitados</h3>
        <div className="grid gap-4 opacity-80">
          {solicitados.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-dashed text-center text-gray-400">Você ainda não solicitou caronas.</div>
          ) : (
            solicitados.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">
                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 uppercase">{envio.descricao}</h4>
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${
                      envio.status === 'disponivel' ? 'bg-gray-100 text-gray-500' : 
                      envio.status === 'entregue' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {envio.status === 'disponivel' ? 'Aguardando Parceiro' : envio.status === 'entregue' ? 'Entregue' : 'Em Trânsito'}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-[11px] font-bold text-gray-500">
                    <span className="flex items-center gap-1"><Building2 size={12} /> DESTINO: {envio.unidade?.nome}</span>
                    {envio.fornecedor && (
                      <span className="flex items-center gap-1 text-beirario uppercase">
                        <User size={12} /> Condutor: {envio.fornecedor.nome}
                      </span>
                    )}
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

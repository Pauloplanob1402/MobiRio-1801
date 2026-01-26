
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

      // 1. Meus Envios Solicitados (onde eu sou o solicitante)
      const { data: dataSolicitados } = await supabase
        .from('envios')
        .select(`
          *,
          unidade:unidades!unidade_id(nome),
          entregador:usuarios!envios_aceito_por_fkey(nome, telefone)
        `)
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });

      setSolicitados(dataSolicitados || []);

      // 2. Caronas que estou transportando (onde eu sou o fornecedor)
      const { data: dataTransporte } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios!solicitante_id(nome, telefone, endereco),
          unidade:unidades!unidade_id(nome)
        `)
        .eq('fornecedor_id', user.id)
        .neq('status', 'entregue')
        .order('created_at', { ascending: false });

      setEmTransporte(dataTransporte || []);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmDelivery = async (envioId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    
    if (!window.confirm("Confirmar entrega do volume? Isso gerará +1 MOVE para você.")) return;

    setProcessingId(envioId);
    try {
      const { data, error } = await supabase.rpc('rpc_confirmar_entrega', {
        p_envio_id: envioId,
        p_driver_user_id: auth.user.id
      });

      if (error) throw error;
      const result = data as any;

      if (result && result.success === false) {
        alert(result.message);
      } else {
        alert("Entrega confirmada! Você ganhou 1 MOVE.");
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
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
          <h2 className="text-3xl font-black text-gray-900">Minhas Atividades</h2>
          <p className="text-gray-500 mt-1">Gerencie caronas em curso e solicitações pendentes.</p>
        </div>
        <button onClick={fetchData} disabled={refreshing} className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-beirario transition-all shadow-sm">
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* SEÇÃO 1: TRANSPORTANDO */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-beirario pl-4">Caronas que estou transportando</h3>
        <div className="grid gap-4">
          {emTransporte.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed text-center text-gray-400 text-sm">Nenhuma carona em transporte no momento.</div>
          ) : (
            emTransporte.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center">
                <div className="w-12 h-12 bg-beirario-light text-beirario rounded-xl flex items-center justify-center shrink-0">
                  <Truck size={24} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900">{envio.solicitante?.nome}</h4>
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">Em Trânsito</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">"{envio.descricao}"</p>
                  <div className="flex flex-wrap gap-4 text-[11px] text-gray-600">
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-orange-400" /> <b>Retirada:</b> {envio.solicitante?.endereco}</span>
                    <span className="flex items-center gap-1"><Building2 size={12} className="text-beirario" /> <b>Destino:</b> {envio.unidade?.nome}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <button 
                    onClick={() => handleConfirmDelivery(envio.id)}
                    disabled={processingId === envio.id}
                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2"
                  >
                    {processingId === envio.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={16} />}
                    Confirmar Entrega
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* SEÇÃO 2: SOLICITADOS */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-l-4 border-gray-300 pl-4">Meus Envios Solicitados</h3>
        <div className="grid gap-4">
          {solicitados.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed text-center text-gray-400 text-sm">Você ainda não solicitou caronas.</div>
          ) : (
            solicitados.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center opacity-90 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={24} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 truncate max-w-[200px]">{envio.descricao}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      envio.status === 'disponivel' ? 'bg-gray-100 text-gray-500' : 
                      envio.status === 'entregue' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {envio.status === 'disponivel' ? 'Aguardando Coleta' : envio.status === 'entregue' ? 'Entregue' : 'Em Rota'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 font-bold"><Building2 size={12} /> Destino: {envio.unidade?.nome}</span>
                    {envio.entregador && <span className="flex items-center gap-1 text-blue-600"><Truck size={12} /> Transportado por: {envio.entregador.nome}</span>}
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(envio.created_at).toLocaleDateString('pt-BR')}</span>
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

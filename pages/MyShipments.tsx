
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, Truck, CheckCircle, Clock, Building2, RefreshCw, Calendar } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [caronasAceitas, setCaronasAceitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      // 1. Busca envios solicitados pelo usuário LOGADO (solicitante_id)
      // Usando joins explícitos com aliases conforme instrução
      const { data: enviosSolicitados, error: errorSolicitados } = await supabase
        .from('envios')
        .select(`
          *,
          unidade:unidades!unidade_id(nome),
          aceitador:usuarios!envios_aceito_por_fkey(nome)
        `)
        .eq('solicitante_id', user.id)
        .in('status', ['disponivel', 'aceito', 'em_transito', 'PENDENTE'])
        .order('created_at', { ascending: false });

      if (errorSolicitados) throw errorSolicitados;
      setSolicitados(enviosSolicitados || []);

      // 2. Busca caronas que o usuário ACEITOU transportar
      const { data: caronas, error: errorCaronas } = await supabase
        .from('envios')
        .select(`
          *,
          unidade:unidades!unidade_id(nome),
          fornecedor:fornecedores!fornecedor_id(nome_fantasia)
        `)
        .eq('aceito_por', user.id)
        .in('status', ['aceito', 'em_transito'])
        .order('aceito_em', { ascending: false });

      if (errorCaronas) throw errorCaronas;
      setCaronasAceitas(caronas || []);

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
    const user = auth.user;
    if (!user) return alert("Sessão expirada.");
    
    if (!window.confirm("Confirmar que o volume foi entregue? Você ganhará 1 MOVE.")) return;

    setProcessingId(envioId);
    try {
      const { data, error } = await supabase.rpc('rpc_confirmar_entrega', {
        p_envio_id: envioId,
        p_driver_user_id: user.id
      });

      if (error) throw error;
      const result = data as any;

      if (result && result.success === false) {
        alert("Atenção: " + (result.message || "Erro ao confirmar."));
      } else {
        alert("Entrega confirmada! Você ganhou 1 MOVE");
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        await fetchData();
      }
    } catch (err: any) {
      alert("Erro ao processar entrega: " + (err.message || "Erro de conexão."));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel': return 'Aguardando Coleta';
      case 'aceito': return 'Carona Confirmada';
      case 'em_transito': return 'Em Rota';
      case 'entregue': return 'Entregue';
      case 'PENDENTE': return 'Pendente';
      default: return status;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 font-sans pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Minhas Atividades</h2>
          <p className="text-gray-500 mt-1">Gerencie suas solicitações e caronas aceitas.</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <section>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Caronas que estou transportando</h3>
        </div>

        <div className="space-y-4">
          {caronasAceitas.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center">
              <Truck className="mx-auto text-gray-300 mb-4" size={40} />
              <p className="text-gray-500 text-sm">Nenhuma carona em trânsito.</p>
            </div>
          ) : (
            caronasAceitas.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-beirario hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-beirario-light text-beirario flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{envio.fornecedor?.nome_fantasia || 'Remetente Mobirio'}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 italic line-clamp-1">"{envio.descricao}"</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destino</p>
                    <p className="text-xs font-bold text-gray-700">{envio.unidade?.nome}</p>
                  </div>
                  
                  <div className="pl-4 border-l border-gray-100">
                    <button
                      onClick={() => handleConfirmDelivery(envio.id)}
                      disabled={processingId === envio.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {processingId === envio.id ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                      Confirmar Entrega
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900">Meus Envios Solicitados</h3>
        </div>

        <div className="space-y-4">
          {solicitados.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-dashed border-gray-200 text-center">
              <Package className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 text-sm">Nenhum envio solicitado no momento.</p>
            </div>
          ) : (
            solicitados.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${envio.status === 'disponivel' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                    {envio.status === 'disponivel' ? <Clock size={28} /> : <CheckCircle size={28} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{envio.descricao}</h4>
                    <div className="flex flex-wrap gap-4 mt-1">
                      <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                        <Building2 size={14} className="text-beirario" />
                        Destino: <span className="text-gray-800">{envio.unidade?.nome}</span>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                        <Calendar size={14} />
                        Solicitado em: {new Date(envio.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {envio.aceitador && (
                      <p className="text-[10px] text-blue-600 font-bold uppercase mt-2 flex items-center gap-1">
                        <Truck size={12} /> Transportado por: {envio.aceitador?.nome}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                  <p className={`text-xs font-black uppercase mt-0.5 ${envio.status === 'disponivel' ? 'text-orange-500' : 'text-blue-600'}`}>
                    {getStatusLabel(envio.status)}
                  </p>
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

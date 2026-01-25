
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, Truck, CheckCircle, Clock, MapPin, Building2, User, AlertCircle } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<Envio[]>([]);
  const [caronasAceitas, setCaronasAceitas] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('fornecedor_id')
        .eq('id', user.id)
        .maybeSingle();

      if (usuario) {
        const { data: enviosProprios } = await supabase
          .from('envios')
          .select(`
            *,
            unidades(nome),
            aceitador:usuarios!envios_aceito_por_fkey(nome)
          `)
          .eq('fornecedor_id', usuario.fornecedor_id)
          .in('status', ['disponivel', 'aceito', 'em_transito'])
          .order('created_at', { ascending: false });

        if (enviosProprios) setSolicitados(enviosProprios || []);

        const { data: caronas } = await supabase
          .from('envios')
          .select(`
            *,
            unidades(nome),
            fornecedores:fornecedor_id(nome_fantasia)
          `)
          .eq('aceito_por', user.id)
          .in('status', ['aceito', 'em_transito'])
          .order('aceito_em', { ascending: false });

        if (caronas) setCaronasAceitas(caronas || []);
      }
    } catch (err) {
      console.error("Erro ao buscar seus envios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmDelivery = async (envioId: string) => {
    // 1. Obter usuário logado na hora do clique para garantir validade
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      alert("Sessão não encontrada. Por favor, faça login novamente.");
      return;
    }
    
    if (!window.confirm("Confirmar que o volume foi entregue no destino? Você ganhará 1 MOVE.")) {
      return;
    }

    setProcessingId(envioId);

    try {
      // 2. Chamar a RPC que processa toda a lógica de crédito no banco
      const { data, error } = await supabase.rpc('rpc_confirmar_entrega', {
        p_envio_id: envioId,
        p_driver_user_id: user.id
      });

      if (error) throw error;

      const result = data as any;

      if (result && result.success === false) {
        alert("Erro: " + (result.message || "Não foi possível confirmar. Verifique o saldo do remetente."));
      } else {
        // 3. Sucesso: Feedback e atualização
        alert("Entrega confirmada! Você ganhou 1 MOVE.");
        
        // Notifica outros componentes sobre a mudança no saldo (Wallet, etc)
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        
        // Recarrega a lista
        await fetchData();
      }
    } catch (err: any) {
      console.error("Erro ao confirmar entrega:", err);
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
      default: return status;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 font-sans pb-10">
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Minhas Atividades (Caronas que Aceitei)</h2>
          <p className="text-gray-500 mt-1">Volumes de terceiros que você está transportando.</p>
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
                    <h4 className="font-bold text-gray-900">{(envio.fornecedores as any)?.nome_fantasia}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 italic truncate max-w-xs">"{envio.descricao}"</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destino</p>
                    <p className="text-xs font-bold text-gray-700">{(envio.unidades as any)?.nome}</p>
                  </div>
                  
                  <div className="pl-4 border-l border-gray-100">
                    <button
                      onClick={() => handleConfirmDelivery(envio.id)}
                      disabled={processingId === envio.id}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {processingId === envio.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
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
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Meus Envios Solicitados</h2>
          <p className="text-gray-500 mt-1">Volumes da sua empresa aguardando transporte ou em trânsito.</p>
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
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
                      <Building2 size={14} className="text-beirario" />
                      Destino: <span className="text-gray-800">{(envio.unidades as any)?.nome}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
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

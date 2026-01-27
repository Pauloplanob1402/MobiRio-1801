
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, RefreshCw, User, Building2, MapPin, Package } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [emTransporte, setEmTransporte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      // 1. MEUS PEDIDOS - TENTATIVA COM JOIN
      const { data: pedidos, error: err1 } = await supabase
        .from('envios')
        .select(`
          *,
          unidade:unidades(nome),
          fornecedor:usuarios!fornecedor_id(nome)
        `)
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });
      
      if (err1) {
        console.warn("Join pedidos falhou, tentando fallback...");
        const { data: fallbackPedidos } = await supabase
          .from('envios')
          .select('*')
          .eq('solicitante_id', user.id)
          .order('created_at', { ascending: false });
        setSolicitados(fallbackPedidos || []);
        setIsFallback(true);
      } else {
        setSolicitados(pedidos || []);
      }

      // 2. EM TRANSPORTE - TENTATIVA COM JOIN
      const { data: transporte, error: err2 } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios!solicitante_id(nome, endereco),
          unidade:unidades(nome)
        `)
        .eq('fornecedor_id', user.id)
        .eq('status', 'em_transito');
      
      if (err2) {
        console.warn("Join transporte falhou, tentando fallback...");
        const { data: fallbackTransporte } = await supabase
          .from('envios')
          .select('*')
          .eq('fornecedor_id', user.id)
          .eq('status', 'em_transito');
        setEmTransporte(fallbackTransporte || []);
        setIsFallback(true);
      } else {
        setEmTransporte(transporte || []);
      }
    } catch (err) { 
      console.error("Erro ao carregar atividades:", err); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('my_activities_resilient')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleConfirmDelivery = async (envio: any) => {
    if (!window.confirm("Você confirma que entregou este volume?")) return;
    
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("Usuário não autenticado");

      // RPC rpc_confirmar_entrega(p_solicitante_id, p_motorista_id)
      const { data, error } = await supabase.rpc('rpc_confirmar_entrega', { 
        p_solicitante_id: envio.solicitante_id, 
        p_motorista_id: user.id 
      });

      if (error) throw error;
      
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      alert('✅ Sucesso! Entrega finalizada e MOVE transferido.');
      fetchData();
    } catch (err: any) { 
      console.error("Erro na confirmação:", err);
      alert('Erro na confirmação: ' + err.message); 
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-beirario" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-10 max-w-5xl mx-auto font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase text-gray-900 tracking-tighter">Minhas Atividades</h2>
          {isFallback && <p className="text-[10px] text-orange-500 font-bold uppercase">⚠️ Dados em modo simplificado</p>}
        </div>
        <button onClick={fetchData} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
           <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>
      
      <section className="space-y-4">
        <h3 className="font-bold text-beirario uppercase border-l-4 border-beirario pl-3 italic">Caronas que estou levando</h3>
        {emTransporte.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border-2 border-dashed text-center text-gray-300 text-sm italic">
            Nenhuma carona em trânsito com você.
          </div>
        ) : (
          emTransporte.map(envio => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border-2 border-beirario shadow-lg flex flex-col md:flex-row gap-6 items-center border-l-[12px]">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-beirario" />
                  <p className="font-black text-xs uppercase text-gray-800">PARA: {envio.solicitante?.nome || `Usuário ID: ${envio.solicitante_id.substring(0,8)}`}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-2 bg-gray-50 p-3 rounded-2xl">
                  <div className="flex items-start gap-2 text-[10px] font-bold text-gray-600 uppercase">
                    <MapPin size={14} className="text-red-500 shrink-0" />
                    <span>COLETA: {envio.solicitante?.endereco || 'Consultar solicitante'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px] font-bold text-gray-600 uppercase">
                    <Building2 size={14} className="text-blue-500 shrink-0" />
                    <span>DESTINO: {envio.unidade?.nome || `Unidade ID: ${envio.unidade_id.substring(0,8)}`}</span>
                  </div>
                </div>

                <div className="text-sm font-medium italic text-gray-700">"{envio.descricao}"</div>
              </div>

              <button 
                onClick={() => handleConfirmDelivery(envio)} 
                className="w-full md:w-auto bg-green-600 hover:bg-black text-white px-10 py-5 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
              >
                <CheckCircle size={20} />
                Finalizar Entrega
              </button>
            </div>
          ))
        )}
      </section>

      <section className="space-y-4 pt-10 border-t border-gray-100">
        <h3 className="font-bold text-gray-500 uppercase border-l-4 border-gray-300 pl-3">Meus Envios Solicitados</h3>
        {solicitados.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Você ainda não solicitou caronas.</p>
        ) : (
          <div className="grid gap-3">
            {solicitados.map(envio => (
              <div key={envio.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm uppercase leading-tight">{envio.descricao}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                      {envio.unidade?.nome || `Unidade ID: ${envio.unidade_id.substring(0,8)}`} | {new Date(envio.created_at).toLocaleDateString()}
                    </p>
                    {envio.fornecedor_id && (
                       <p className="text-[10px] text-beirario font-black uppercase mt-1">
                         Motorista: {envio.fornecedor?.nome || envio.fornecedor_id.substring(0,8)}
                       </p>
                    )}
                  </div>
                </div>
                <div className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest ${
                  envio.status === 'entregue' ? 'bg-green-100 text-green-600' : 
                  envio.status === 'em_transito' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                }`}>
                  {envio.status === 'disponivel' ? 'Aguardando' : envio.status}
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

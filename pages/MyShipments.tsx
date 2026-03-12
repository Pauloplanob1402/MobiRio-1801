import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle, RefreshCw, Package } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Aguardando',
  aceito: 'Em Rota',
  retirado: 'Retirado',
  entregue: 'Entregue',
};

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [emTransporte, setEmTransporte] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pedidos, error: err1 } = await supabase
        .from('envios')
        .select('id, descricao, status, created_at, unidade_id, unidade:unidades!envios_unidade_id_fkey(nome)')
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });

      if (err1) console.error("Erro em pedidos:", err1);

      // CORRIGIDO: status 'aceito' e 'retirado' (não 'em_transito')
      const { data: transporte, error: err2 } = await supabase
        .from('envios')
        .select(`
          id, descricao, status, solicitante_id, unidade_id,
          solicitante:usuarios!envios_solicitante_fkey(nome, endereco),
          unidade:unidades!envios_unidade_id_fkey(nome)
        `)
        .eq('entregador_id', user.id)
        .in('status', ['aceito', 'retirado']);

      if (err2) console.error("Erro em transporte:", err2);

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
    const channel = supabase.channel('myshipments_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleConfirmDelivery = async (envio: any) => {
    if (!window.confirm("Confirmar entrega realizada?")) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setConfirmando(envio.id);
    try {
      const { error: updateError } = await supabase
        .from('envios')
        .update({ status: 'entregue' })
        .eq('id', envio.id);

      if (updateError) throw updateError;

      const { error: moveError } = await supabase.rpc('confirmar_entrega_segura', {
        p_usuario_de: envio.solicitante_id,
        p_usuario_para: user.id,
        p_quantidade: 1,
      });

      if (moveError) throw moveError;

      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      alert('✅ Entrega finalizada! +1 MOVE creditado.');
      fetchData();
    } catch (err: any) {
      alert('Erro ao confirmar entrega: ' + err.message);
    } finally {
      setConfirmando(null);
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
        <h2 className="text-3xl font-black uppercase">Minhas Atividades</h2>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {/* CARONAS QUE ESTOU TRANSPORTANDO */}
      <section className="space-y-4">
        <h3 className="font-bold text-beirario border-l-4 border-beirario pl-3 uppercase text-sm">
          Em Transporte
        </h3>
        {emTransporte.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border-2 border-dashed text-center text-gray-300">
            <Package className="mx-auto mb-2 opacity-10" size={40} />
            <p className="text-xs font-bold uppercase">Nenhuma carona em andamento.</p>
          </div>
        ) : (
          emTransporte.map(envio => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border-2 border-beirario shadow-lg flex flex-col md:flex-row gap-4 items-center border-l-[12px]">
              <div className="flex-1 space-y-2">
                <p className="font-black text-[10px] uppercase text-gray-500">
                  PARA: {envio.solicitante?.nome || `Solicitante ${envio.solicitante_id?.substring(0, 8)}`}
                </p>
                {envio.solicitante?.endereco && (
                  <p className="font-black text-[10px] uppercase text-gray-400">
                    ENDEREÇO: {envio.solicitante.endereco}
                  </p>
                )}
                <p className="font-black text-[10px] uppercase text-gray-400">
                  DESTINO: {envio.unidade?.nome || `Unidade ${envio.unidade_id?.substring(0, 8)}`}
                </p>
                <div className="p-3 bg-gray-50 rounded-xl text-xs font-bold italic">
                  "{envio.descricao}"
                </div>
              </div>
              <button
                onClick={() => handleConfirmDelivery(envio)}
                disabled={confirmando === envio.id}
                className="bg-green-600 hover:bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {confirmando === envio.id
                  ? <RefreshCw className="animate-spin" size={16} />
                  : <CheckCircle size={16} />
                }
                {confirmando === envio.id ? 'Confirmando...' : 'Finalizar Entrega'}
              </button>
            </div>
          ))
        )}
      </section>

      {/* MEUS PEDIDOS */}
      <section className="space-y-4 pt-10 border-t">
        <h3 className="font-bold text-gray-400 border-l-4 border-gray-300 pl-3 uppercase text-sm">
          Meus Pedidos
        </h3>
        {solicitados.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border-2 border-dashed text-center text-gray-300">
            <Package className="mx-auto mb-2 opacity-10" size={40} />
            <p className="text-xs font-bold uppercase">Nenhum pedido ainda.</p>
          </div>
        ) : (
          solicitados.map(envio => (
            <div key={envio.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center shadow-sm">
              <div>
                <p className="font-bold text-gray-800 text-sm uppercase">{envio.descricao}</p>
                <p className="text-[10px] text-gray-400 font-black uppercase mt-1">
                  {envio.unidade?.nome || `Unidade ${envio.unidade_id?.substring(0, 8)}`}
                  {' | '}
                  {STATUS_LABEL[envio.status] ?? envio.status}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                envio.status === 'entregue' ? 'bg-green-50 text-green-700' :
                envio.status === 'aceito' || envio.status === 'retirado' ? 'bg-blue-50 text-blue-700' :
                'bg-orange-50 text-orange-700'
              }`}>
                {STATUS_LABEL[envio.status] ?? envio.status}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default MyShipments;

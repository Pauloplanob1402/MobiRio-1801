import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Clock, RefreshCw, Package, Truck, MapPin, ArrowRight, XCircle, User } from 'lucide-react';

type Tab = 'solicitados' | 'transportando';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  disponivel: { label: 'Aguardando motorista', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  aceito:     { label: 'A caminho', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  retirado:   { label: 'Retirado', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  entregue:   { label: 'Entregue ✓', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelado:  { label: 'Cancelado', color: 'bg-red-50 text-red-600 border-red-200' },
};

const MyShipments: React.FC = () => {
  const [tab, setTab] = useState<Tab>('solicitados');
  const [solicitados, setSolicitados] = useState<any[]>([]);
  const [transportando, setTransportando] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Pedidos feitos por mim
      const { data: sol } = await supabase
        .from('envios')
        .select(`
          id, descricao, destino_livre, status, created_at, entregador_id,
          entregador:usuarios!envios_entregador_fkey(nome)
        `)
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });

      // Entregas que eu aceitei
      const { data: trans } = await supabase
        .from('envios')
        .select(`
          id, descricao, destino_livre, status, created_at, solicitante_id,
          solicitante:usuarios!envios_solicitante_fkey(nome, endereco)
        `)
        .eq('entregador_id', user.id)
        .order('created_at', { ascending: false });

      setSolicitados(sol || []);
      setTransportando(trans || []);
    } catch (err) {
      console.error('Erro ao buscar atividades:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('myshipments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const confirmarEntrega = async (envio: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setConfirmando(envio.id);
    try {
      const { data: result, error } = await supabase.rpc('confirmar_entrega_por_id', {
        p_envio_id: envio.id,
        p_entregador_id: user.id,
      });

      if (error) throw error;
      if (!result?.success) throw new Error(result?.message);

      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      alert('🎉 Entrega confirmada! +1 MOVE creditado na sua carteira.');
      fetchData();
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setConfirmando(null);
    }
  };

  const cancelarEnvio = async (envioId: string) => {
    if (!confirm('Cancelar este pedido? O MOVE será devolvido.')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      // Cancelar o envio (só funciona se ainda 'disponivel')
      const { error: cancelErr } = await supabase
        .from('envios')
        .update({ status: 'cancelado' })
        .eq('id', envioId)
        .eq('status', 'disponivel')
        .eq('solicitante_id', user.id);

      if (cancelErr) throw new Error('Não foi possível cancelar — o pedido pode já ter sido aceito.');

      // Devolver 1 MOVE via RPC de estorno
      await supabase.rpc('estornar_move', { p_usuario_id: user.id }).catch(() => null);

      window.dispatchEvent(new CustomEvent('balanceUpdated'));
      alert('Pedido cancelado. 1 MOVE devolvido.');
      fetchData();
    } catch (err: any) {
      alert('Erro ao cancelar: ' + err.message);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20 text-movendo">
      <RefreshCw className="animate-spin" size={32} />
    </div>
  );

  const tabData = tab === 'solicitados' ? solicitados : transportando;
  const ativos = tab === 'solicitados'
    ? solicitados.filter(e => e.status !== 'entregue' && e.status !== 'cancelado').length
    : transportando.filter(e => e.status !== 'entregue' && e.status !== 'cancelado').length;

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Minhas Atividades</h2>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {(['solicitados', 'transportando'] as Tab[]).map((t) => {
          const count = t === 'solicitados' ? solicitados.filter(e => e.status !== 'entregue' && e.status !== 'cancelado').length : transportando.filter(e => e.status !== 'entregue' && e.status !== 'cancelado').length;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t === 'solicitados' ? <Package size={14} /> : <Truck size={14} />}
              {t === 'solicitados' ? 'Meus Pedidos' : 'Transportando'}
              {count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${tab === t ? 'bg-movendo text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {tabData.length === 0 ? (
        <div className="bg-white border-2 border-dashed rounded-3xl p-20 text-center text-gray-300">
          {tab === 'solicitados' ? <Package className="mx-auto mb-4 opacity-10" size={48} /> : <Truck className="mx-auto mb-4 opacity-10" size={48} />}
          <p className="text-xs font-bold uppercase tracking-widest">
            {tab === 'solicitados' ? 'Nenhum pedido feito ainda.' : 'Você não está transportando nada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tabData.map((envio) => {
            const st = STATUS_LABEL[envio.status] || { label: envio.status, color: 'bg-gray-50 text-gray-600 border-gray-200' };
            const isAtivo = envio.status !== 'entregue' && envio.status !== 'cancelado';

            return (
              <div key={envio.id} className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${envio.status === 'entregue' ? 'opacity-70' : ''}`}>
                {/* Status bar */}
                <div className={`px-5 py-2 flex items-center justify-between ${envio.status === 'entregue' ? 'bg-green-500' : envio.status === 'cancelado' ? 'bg-gray-300' : 'bg-movendo'}`}>
                  <span className="text-white text-[10px] font-black uppercase">{st.label}</span>
                  <span className="text-white/60 text-[9px]">
                    {new Date(envio.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Rota */}
                  <div className="space-y-2">
                    {tab === 'transportando' && (
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={10} className="text-red-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase">Coleta</p>
                          <p className="text-xs font-bold text-gray-700">{envio.solicitante?.endereco || '—'}</p>
                          <p className="text-[10px] text-gray-400">Solicitante: {envio.solicitante?.nome || '—'}</p>
                        </div>
                      </div>
                    )}
                    {tab === 'transportando' && <div className="ml-2.5 w-0.5 h-3 bg-gray-200"></div>}
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin size={10} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase">Destino</p>
                        <p className="text-xs font-bold text-gray-700">{envio.destino_livre}</p>
                      </div>
                    </div>
                    {tab === 'solicitados' && envio.entregador && (
                      <div className="flex items-center gap-2 mt-2 bg-blue-50 px-3 py-2 rounded-xl">
                        <User size={12} className="text-blue-500" />
                        <p className="text-[10px] font-bold text-blue-700">Transportador: {envio.entregador.nome}</p>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-3">"{envio.descricao}"</p>

                  {/* Ações */}
                  {isAtivo && tab === 'transportando' && (envio.status === 'aceito' || envio.status === 'retirado') && (
                    <button
                      onClick={() => confirmarEntrega(envio)}
                      disabled={confirmando === envio.id}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-100"
                    >
                      {confirmando === envio.id
                        ? <RefreshCw className="animate-spin" size={16} />
                        : <CheckCircle2 size={16} />}
                      {confirmando === envio.id ? 'Confirmando...' : 'Confirmar Entrega (+1 MOVE)'}
                    </button>
                  )}

                  {isAtivo && tab === 'solicitados' && envio.status === 'disponivel' && (
                    <button
                      onClick={() => cancelarEnvio(envio.id)}
                      className="w-full border border-red-200 text-red-500 hover:bg-red-50 py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all"
                    >
                      <XCircle size={14} />
                      Cancelar pedido
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyShipments;


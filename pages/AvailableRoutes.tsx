import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Navigation, MapPin, Clock, RefreshCw, Package, Users, ChevronRight, CheckCircle } from 'lucide-react';

const JANELA_LABEL: Record<string, { label: string; color: string }> = {
  hoje:        { label: 'Hoje',        color: 'bg-green-100 text-green-700' },
  amanha:      { label: 'Amanhã',      color: 'bg-blue-100 text-blue-700' },
  essa_semana: { label: 'Essa semana', color: 'bg-orange-100 text-orange-700' },
};

const AvailableRoutes: React.FC = () => {
  const [rotas, setRotas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [meusPedidos, setMeusPedidos] = useState<any[]>([]);
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Rotas ativas (exceto as minhas)
      const { data: rotasData } = await supabase
        .from('rotas')
        .select(`
          id, destino, janela, observacao, created_at,
          usuario:usuarios!rotas_usuario_id_fkey(nome, endereco)
        `)
        .eq('status', 'ativa')
        .neq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      // Meus pedidos ainda disponíveis (sem rota vinculada)
      const { data: pedidosData } = await supabase
        .from('envios')
        .select('id, descricao, destino_livre')
        .eq('solicitante_id', user.id)
        .eq('status', 'disponivel')
        .is('rota_id', null);

      // Contar pedidos vinculados por rota
      const rotasComPedidos = await Promise.all((rotasData || []).map(async (rota) => {
        const { count } = await supabase
          .from('envios')
          .select('id', { count: 'exact', head: true })
          .eq('rota_id', rota.id)
          .eq('status', 'aceito');
        return { ...rota, pedidos_vinculados: count || 0 };
      }));

      setRotas(rotasComPedidos);
      setMeusPedidos(pedidosData || []);
    } catch (err) {
      console.error('Erro ao buscar rotas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('rotas_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rotas' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  const vincularPedido = async (rotaId: string, envioId: string) => {
    if (!userId) return;
    setVinculando(envioId);
    try {
      const { data: result, error } = await supabase.rpc('vincular_envio_a_rota', {
        p_envio_id:      envioId,
        p_rota_id:       rotaId,
        p_entregador_id: (await supabase.from('rotas').select('usuario_id').eq('id', rotaId).single()).data?.usuario_id,
      });
      if (error) throw error;
      if (!result?.success) throw new Error(result?.message);
      alert('✅ Pedido vinculado! O transportador foi notificado.');
      fetchData();
      setExpanded(null);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setVinculando(null);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  };

  if (loading) return (
    <div className="flex justify-center py-20 text-movendo">
      <RefreshCw className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Rotas Ativas</h2>
          <p className="text-gray-400 text-xs font-bold mt-1 uppercase">
            {rotas.length} pessoa{rotas.length !== 1 ? 's' : ''} declarou uma rota
          </p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Aviso se não tem pedidos disponíveis */}
      {meusPedidos.length === 0 && (
        <div className="bg-movendo-light border border-orange-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <Package size={16} className="text-movendo mt-0.5 shrink-0" />
          <p className="text-xs text-orange-800 font-medium">
            Você não tem pedidos disponíveis para vincular. 
            <a href="#/criar" className="font-black ml-1 underline">Criar um pedido</a>
          </p>
        </div>
      )}

      {rotas.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed p-20 text-center text-gray-300">
          <Navigation className="mx-auto mb-4 opacity-10" size={64} />
          <p className="font-bold uppercase tracking-widest text-xs">Nenhuma rota declarada ainda.</p>
          <p className="text-[10px] mt-2">Rotas aparecem aqui em tempo real.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rotas.map(rota => {
            const jl = JANELA_LABEL[rota.janela] || { label: rota.janela, color: 'bg-gray-100 text-gray-600' };
            const isOpen = expanded === rota.id;

            return (
              <div key={rota.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-slate-950 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-movendo/20 rounded-full flex items-center justify-center">
                      <Navigation size={14} className="text-movendo" />
                    </div>
                    <div>
                      <p className="text-white font-black text-sm">{rota.usuario?.nome || 'Usuário'}</p>
                      <p className="text-white/40 text-[10px]">{timeAgo(rota.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${jl.color}`}>
                      <Clock size={10} className="inline mr-1" />{jl.label}
                    </span>
                    {rota.pedidos_vinculados > 0 && (
                      <span className="text-[10px] font-black px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {rota.pedidos_vinculados} vinculado{rota.pedidos_vinculados !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Rota */}
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={10} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Saindo de</p>
                      <p className="text-xs font-bold text-gray-700">{rota.usuario?.endereco || 'Localização não informada'}</p>
                    </div>
                  </div>
                  <div className="ml-2.5 w-0.5 h-3 bg-gray-200"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-movendo/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={10} className="text-movendo" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Indo para</p>
                      <p className="text-sm font-black text-gray-900">{rota.destino}</p>
                    </div>
                  </div>

                  {rota.observacao && (
                    <div className="bg-gray-50 rounded-xl border-l-4 border-gray-200 px-4 py-3">
                      <p className="text-xs text-gray-500 italic">"{rota.observacao}"</p>
                    </div>
                  )}

                  {/* Vincular pedido */}
                  {meusPedidos.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpanded(isOpen ? null : rota.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-movendo-light border border-orange-200 rounded-2xl text-xs font-black text-movendo uppercase transition-all hover:bg-orange-100"
                      >
                        <div className="flex items-center gap-2">
                          <Package size={14} />
                          Vincular meu pedido a esta rota
                        </div>
                        <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase ml-1">Escolha qual pedido vincular:</p>
                          {meusPedidos.map(pedido => (
                            <div key={pedido.id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                              <div className="flex-1 min-w-0 mr-3">
                                <p className="text-xs font-bold text-gray-800 truncate">{pedido.descricao}</p>
                                <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                  <MapPin size={9} /> {pedido.destino_livre}
                                </p>
                              </div>
                              <button
                                onClick={() => vincularPedido(rota.id, pedido.id)}
                                disabled={vinculando === pedido.id}
                                className="bg-slate-950 text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 disabled:opacity-50 hover:bg-movendo transition-colors"
                              >
                                {vinculando === pedido.id
                                  ? <RefreshCw size={12} className="animate-spin" />
                                  : <CheckCircle size={12} />
                                }
                                Vincular
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

export default AvailableRoutes;

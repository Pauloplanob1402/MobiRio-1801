import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Navigation, MapPin, Clock, RefreshCw, Package, ChevronRight, CheckCircle, Search, X } from 'lucide-react';

const JANELA_LABEL: Record<string, { label: string; color: string }> = {
  hoje:        { label: 'Hoje',        color: 'bg-green-100 text-green-700' },
  amanha:      { label: 'Amanhã',      color: 'bg-blue-100 text-blue-700' },
  essa_semana: { label: 'Essa semana', color: 'bg-orange-100 text-orange-700' },
};

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const AvailableRoutes: React.FC = () => {
  const [rotas, setRotas]           = useState<any[]>([]);
  const [minhasRotas, setMinhasRotas] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [meusPedidos, setMeusPedidos] = useState<any[]>([]);
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [filtro, setFiltro]         = useState('');
  const [tab, setTab]               = useState<'disponiveis' | 'minhas'>('disponiveis');
  const [userId, setUserId]         = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Rotas de outros usuários
      const { data: rotasData } = await supabase
        .from('rotas')
        .select(`id, destino, janela, observacao, created_at,
          usuario:usuarios!rotas_usuario_id_fkey(nome, endereco)`)
        .eq('status', 'ativa')
        .neq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      // Minhas rotas declaradas
      const { data: minhasData } = await supabase
        .from('rotas')
        .select('id, destino, janela, observacao, created_at, status')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      // Meus pedidos disponíveis sem rota
      const { data: pedidosData } = await supabase
        .from('envios')
        .select('id, descricao, destino_livre')
        .eq('solicitante_id', user.id)
        .eq('status', 'disponivel')
        .is('rota_id', null);

      // Contar pedidos vinculados por rota
      const rotasComCount = await Promise.all((rotasData || []).map(async rota => {
        const { count } = await supabase
          .from('envios').select('id', { count: 'exact', head: true })
          .eq('rota_id', rota.id).eq('status', 'aceito');
        return { ...rota, pedidos_vinculados: count || 0 };
      }));

      setRotas(rotasComCount);
      setMinhasRotas(minhasData || []);
      setMeusPedidos(pedidosData || []);
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

  // Filtro por proximidade textual
  const rotasFiltradas = rotas.filter(r => {
    if (!filtro.trim()) return true;
    const q = normalize(filtro);
    return normalize(r.destino).includes(q) ||
      normalize(r.usuario?.endereco || '').includes(q) ||
      normalize(r.usuario?.nome || '').includes(q);
  });

  const vincularPedido = async (rotaId: string, envioId: string, entregadorId: string) => {
    setVinculando(envioId);
    try {
      const { data: result, error } = await supabase.rpc('vincular_envio_a_rota', {
        p_envio_id: envioId,
        p_rota_id: rotaId,
        p_entregador_id: entregadorId,
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

  const cancelarRota = async (rotaId: string) => {
    if (!confirm('Cancelar esta rota? Ela deixará de aparecer para outros usuários.')) return;
    setCancelando(rotaId);
    try {
      const { error } = await supabase
        .from('rotas').update({ status: 'cancelada' }).eq('id', rotaId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert('Erro ao cancelar: ' + err.message);
    } finally {
      setCancelando(null);
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
    <div className="max-w-4xl mx-auto font-sans space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Rotas</h2>
          <p className="text-gray-400 text-xs font-bold mt-1 uppercase">
            {rotasFiltradas.length} rota{rotasFiltradas.length !== 1 ? 's' : ''} ativa{rotasFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl">
        {(['disponiveis', 'minhas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
              tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}>
            <Navigation size={14} />
            {t === 'disponiveis' ? 'Disponíveis' : `Minhas rotas${minhasRotas.filter(r => r.status === 'ativa').length > 0 ? ` (${minhasRotas.filter(r => r.status === 'ativa').length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'disponiveis' && (
        <>
          {/* Filtro */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrar por bairro, cidade ou destino..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo shadow-sm transition-all"
            />
            {filtro && (
              <button onClick={() => setFiltro('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Aviso sem pedidos */}
          {meusPedidos.length === 0 && (
            <div className="bg-movendo-light border border-orange-200 rounded-2xl px-5 py-3 flex items-center gap-3">
              <Package size={14} className="text-movendo shrink-0" />
              <p className="text-xs text-orange-800 font-medium">
                Sem pedidos disponíveis para vincular.{' '}
                <a href="#/criar" className="font-black underline">Criar pedido</a>
              </p>
            </div>
          )}

          {/* Lista de rotas */}
          {rotasFiltradas.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed p-16 text-center text-gray-300">
              <Navigation className="mx-auto mb-3 opacity-10" size={48} />
              <p className="font-bold uppercase tracking-widest text-xs">
                {filtro ? `Nenhuma rota para "${filtro}"` : 'Nenhuma rota declarada ainda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rotasFiltradas.map(rota => {
                const jl = JANELA_LABEL[rota.janela] || { label: rota.janela, color: 'bg-gray-100 text-gray-600' };
                const isOpen = expanded === rota.id;
                return (
                  <div key={rota.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Header do card */}
                    <div className="bg-slate-950 px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-movendo/20 rounded-full flex items-center justify-center shrink-0">
                          <Navigation size={14} className="text-movendo" />
                        </div>
                        <div>
                          <p className="text-white font-black text-sm">{rota.usuario?.nome || 'Usuário'}</p>
                          <p className="text-white/40 text-[10px]">{timeAgo(rota.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${jl.color}`}>
                          <Clock size={9} className="inline mr-1" />{jl.label}
                        </span>
                        {rota.pedidos_vinculados > 0 && (
                          <span className="text-[10px] font-black px-2 py-1 rounded-full bg-green-100 text-green-700">
                            {rota.pedidos_vinculados} vinculado{rota.pedidos_vinculados !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Rota visual */}
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin size={10} className="text-red-500" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Saindo de</p>
                            <p className="text-xs font-bold text-gray-700">{rota.usuario?.endereco || '—'}</p>
                          </div>
                        </div>
                        <div className="ml-2.5 w-0.5 h-3 bg-gray-200" />
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-movendo/20 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin size={10} className="text-movendo" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Indo para</p>
                            <p className="text-sm font-black text-gray-900">{rota.destino}</p>
                          </div>
                        </div>
                      </div>

                      {rota.observacao && (
                        <div className="bg-gray-50 rounded-xl border-l-4 border-gray-100 px-4 py-3">
                          <p className="text-xs text-gray-500 italic">"{rota.observacao}"</p>
                        </div>
                      )}

                      {/* Vincular */}
                      {meusPedidos.length > 0 && (
                        <div>
                          <button
                            onClick={() => setExpanded(isOpen ? null : rota.id)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-movendo-light border border-orange-200 rounded-2xl text-xs font-black text-movendo uppercase hover:bg-orange-100 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <Package size={13} />
                              Vincular meu pedido a esta rota
                            </div>
                            <ChevronRight size={13} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </button>

                          {isOpen && (
                            <div className="mt-3 space-y-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Escolha o pedido:</p>
                              {meusPedidos.map(pedido => (
                                <div key={pedido.id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                  <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-xs font-bold text-gray-800 truncate">{pedido.descricao}</p>
                                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                      <MapPin size={9} /> {pedido.destino_livre}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => vincularPedido(rota.id, pedido.id, rota.usuario?.id || '')}
                                    disabled={vinculando === pedido.id}
                                    className="bg-slate-950 hover:bg-movendo text-white text-[10px] font-black uppercase px-3 py-2 rounded-xl flex items-center gap-1 shrink-0 disabled:opacity-50 transition-colors"
                                  >
                                    {vinculando === pedido.id
                                      ? <RefreshCw size={11} className="animate-spin" />
                                      : <CheckCircle size={11} />}
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
        </>
      )}

      {tab === 'minhas' && (
        <div className="space-y-4">
          {minhasRotas.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed p-16 text-center text-gray-300">
              <Navigation className="mx-auto mb-3 opacity-10" size={48} />
              <p className="font-bold uppercase tracking-widest text-xs">Você não declarou nenhuma rota.</p>
              <a href="#/declarar-rota" className="inline-block mt-3 text-xs text-movendo font-black hover:underline">
                Declarar rota →
              </a>
            </div>
          ) : (
            minhasRotas.map(rota => {
              const jl = JANELA_LABEL[rota.janela] || { label: rota.janela, color: 'bg-gray-100 text-gray-600' };
              const ativa = rota.status === 'ativa';
              return (
                <div key={rota.id} className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${!ativa ? 'opacity-50' : ''}`}>
                  <div className={`${ativa ? 'bg-slate-950' : 'bg-gray-300'} px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Navigation size={14} className={ativa ? 'text-movendo' : 'text-white'} />
                      <span className="text-white font-black text-xs uppercase">{rota.destino}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${jl.color}`}>
                        {jl.label}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${ativa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {ativa ? 'Ativa' : rota.status}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">{rota.observacao || 'Sem observações'}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{timeAgo(rota.created_at)}</p>
                    </div>
                    {ativa && (
                      <button
                        onClick={() => cancelarRota(rota.id)}
                        disabled={cancelando === rota.id}
                        className="shrink-0 flex items-center gap-1.5 text-[11px] font-black text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-3 py-2 rounded-xl transition-all disabled:opacity-50"
                      >
                        {cancelando === rota.id
                          ? <RefreshCw size={12} className="animate-spin" />
                          : <X size={12} />}
                        Cancelar rota
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AvailableRoutes;

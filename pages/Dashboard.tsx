import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  Package, Truck, CheckCircle2, Clock,
  ChevronRight, RefreshCw, Navigation, ArrowRight, AlertCircle
} from 'lucide-react';
import RadarAtividade from '../components/RadarAtividade';
import RotasFrequentes from '../components/RotasFrequentes';

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  disponivel: { label: 'Aguardando',  dot: 'bg-orange-400' },
  aceito:     { label: 'Em Rota',     dot: 'bg-blue-400'   },
  retirado:   { label: 'Retirado',    dot: 'bg-purple-400' },
  entregue:   { label: 'Entregue',    dot: 'bg-green-400'  },
};

const Dashboard: React.FC = () => {
  const [stats, setStats]     = useState({ pendentes: 0, emTransito: 0, concluidos: 0 });
  const [nome, setNome]       = useState('');
  const [recent, setRecent]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState<string | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErro(null);

    // Timeout de segurança: se o Supabase travar (RLS, rede, etc.)
    // a tela nunca mais fica girando para sempre.
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    safetyTimer.current = setTimeout(() => {
      setLoading(false);
      setErro('A conexão demorou demais para responder. Verifique sua internet ou tente novamente.');
    }, 8000);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: perfil, error: perfilErr } = await supabase
        .from('usuarios').select('nome').eq('id', user.id).maybeSingle();
      if (perfilErr) throw perfilErr;
      setNome(perfil?.nome?.split(' ')[0] || '');

      const { data: envios, error: enviosErr } = await supabase
        .from('envios')
        .select('id, descricao, status, created_at, destino_livre')
        .eq('solicitante_id', user.id)
        .order('created_at', { ascending: false });
      if (enviosErr) throw enviosErr;

      const list = envios || [];
      setStats({
        pendentes:  list.filter(e => e.status === 'disponivel').length,
        emTransito: list.filter(e => ['aceito','retirado'].includes(e.status)).length,
        concluidos: list.filter(e => e.status === 'entregue').length,
      });
      setRecent(list.slice(0, 3));
    } catch (err: any) {
      console.error('Dashboard fetchData:', err);
      setErro(err?.message || 'Não foi possível carregar seus dados agora.');
    } finally {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('dash')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, fetchData)
      .subscribe();
    return () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      supabase.removeChannel(ch);
    };
  }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-24">
      <RefreshCw className="animate-spin text-movendo" size={28} />
    </div>
  );

  if (erro) return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={28} />
      </div>
      <p className="text-sm font-bold text-gray-700 mb-1">Não foi possível carregar o painel</p>
      <p className="text-xs text-gray-400 mb-6 max-w-xs">{erro}</p>
      <button
        onClick={fetchData}
        className="px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase rounded-2xl transition-all"
      >
        Tentar novamente
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
          {nome ? `Olá, ${nome} 👋` : 'Painel'}
        </h2>
        <p className="text-gray-400 mt-1 text-sm">O que você precisa hoje?</p>
      </div>

      {/* CTAs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/criar"
          className="group relative bg-movendo hover:bg-movendo-dark rounded-3xl p-6 overflow-hidden transition-all active:scale-[0.98] shadow-lg shadow-movendo/20"
        >
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-2 -bottom-8 w-16 h-16 bg-white/5 rounded-full" />
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center mb-5">
            <Package size={20} className="text-white" />
          </div>
          <p className="text-white font-black text-xl leading-tight mb-1">Preciso trazer algo</p>
          <p className="text-white/60 text-xs font-medium">Publique um pedido · 1 MOVE</p>
          <ArrowRight size={18} className="text-white/40 mt-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link to="/declarar-rota"
          className="group relative bg-slate-950 hover:bg-slate-800 rounded-3xl p-6 overflow-hidden transition-all active:scale-[0.98] shadow-lg"
        >
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-movendo/10 rounded-full" />
          <div className="absolute -right-2 -bottom-8 w-16 h-16 bg-movendo/5 rounded-full" />
          <div className="w-10 h-10 bg-movendo/20 rounded-2xl flex items-center justify-center mb-5">
            <Navigation size={20} className="text-movendo" />
          </div>
          <p className="text-white font-black text-xl leading-tight mb-1">Vou passar por lá</p>
          <p className="text-white/40 text-xs font-medium">Declare sua rota · Ganhe MOVE</p>
          <ArrowRight size={18} className="text-white/30 mt-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aguardando', value: stats.pendentes,  icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Em Rota',    value: stats.emTransito, icon: Truck,        color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { label: 'Concluído',  value: stats.concluidos, icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-50'  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Radar + Recentes — lado a lado em telas maiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Radar de atividade */}
        <RadarAtividade />

        {/* Atividade recente */}
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Meus Pedidos</h3>
            <Link to="/meus-envios"
              className="text-[11px] text-movendo font-black hover:underline uppercase flex items-center gap-1"
            >
              Ver tudo <ChevronRight size={11} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Package size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Nenhum pedido ainda.</p>
              <Link to="/criar" className="inline-block mt-3 text-xs text-movendo font-black hover:underline">
                Criar primeiro pedido →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(envio => {
                const st = STATUS_LABEL[envio.status] || { label: envio.status, dot: 'bg-gray-300' };
                return (
                  <div key={envio.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Package size={14} className="text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{envio.descricao}</p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{envio.destino_livre}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Rotas frequentes */}
      <RotasFrequentes />

      {/* Atalhos secundários */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/disponiveis', label: 'Pedidos disponíveis', icon: Truck,        color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { to: '/rotas',       label: 'Rotas ativas',        icon: Navigation,   color: 'text-movendo',    bg: 'bg-orange-50' },
          { to: '/historico',   label: 'Histórico',           icon: Clock,        color: 'text-purple-500', bg: 'bg-purple-50' },
          { to: '/carteira',    label: 'Carteira',            icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-50'  },
        ].map(({ to, label, icon: Icon, color, bg }) => (
          <Link key={to} to={to}
            className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-xs font-bold text-gray-700 leading-snug">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

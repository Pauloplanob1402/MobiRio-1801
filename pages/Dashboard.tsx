import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, CheckCircle2, Clock, ChevronRight, RefreshCw, Navigation, Coins, ArrowRight } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Aguardando',
  aceito:     'Em Rota',
  retirado:   'Retirado',
  entregue:   'Entregue',
};

const Dashboard: React.FC = () => {
  const [stats, setStats]           = useState({ pendentes: 0, emTransito: 0, concluidos: 0 });
  const [saldo, setSaldo]           = useState<number | null>(null);
  const [nome, setNome]             = useState('');
  const [recentEnvios, setRecentEnvios] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('creditos, nome')
        .eq('id', user.id)
        .single();

      setSaldo(perfil?.creditos ?? 0);
      setNome(perfil?.nome?.split(' ')[0] || '');

      const { data: envios } = await supabase
        .from('envios')
        .select('id, descricao, status, created_at, destino_livre')
        .eq('solicitante_id', user.id);

      const safeEnvios = envios || [];
      const counts = safeEnvios.reduce((acc: any, curr: any) => {
        if (curr.status === 'disponivel') acc.pendentes++;
        if (curr.status === 'aceito' || curr.status === 'retirado') acc.emTransito++;
        if (curr.status === 'entregue') acc.concluidos++;
        return acc;
      }, { pendentes: 0, emTransito: 0, concluidos: 0 });

      setStats(counts);
      setRecentEnvios(
        [...safeEnvios]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4)
      );
    } catch (err) {
      console.error('Erro no Dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('balanceUpdated', fetchData);
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, fetchData)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('balanceUpdated', fetchData);
    };
  }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-movendo" size={32} />
    </div>
  );

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto font-sans">

      {/* Saudação + saldo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase">
            {nome ? `Olá, ${nome}` : 'Painel'}
          </h2>
          <p className="text-gray-400 mt-1 font-medium text-sm">Sua rede colaborativa de fretes.</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-950 px-5 py-3 rounded-2xl">
          <Coins size={18} className="text-movendo" />
          <div>
            <p className="text-[10px] font-black text-white/40 uppercase">Saldo</p>
            <p className="text-2xl font-black text-white leading-none">{saldo ?? '—'} <span className="text-movendo text-sm">MOVE</span></p>
          </div>
        </div>
      </div>

      {/* Dois CTAs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Preciso trazer algo */}
        <Link to="/criar" className="group bg-movendo hover:bg-movendo-dark text-white rounded-3xl p-6 shadow-xl shadow-movendo/20 transition-all active:scale-95 flex flex-col justify-between min-h-[140px]">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
            <Package size={22} />
          </div>
          <div>
            <p className="font-black text-lg uppercase tracking-tight leading-tight">Preciso trazer algo</p>
            <p className="text-white/70 text-xs mt-1 font-medium">Publique um pedido. Custa 1 MOVE.</p>
          </div>
          <div className="flex justify-end mt-3">
            <ArrowRight size={18} className="opacity-60 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Vou passar por lá */}
        <Link to="/declarar-rota" className="group bg-slate-950 hover:bg-slate-800 text-white rounded-3xl p-6 shadow-xl transition-all active:scale-95 flex flex-col justify-between min-h-[140px]">
          <div className="w-10 h-10 bg-movendo/20 rounded-xl flex items-center justify-center mb-4">
            <Navigation size={22} className="text-movendo" />
          </div>
          <div>
            <p className="font-black text-lg uppercase tracking-tight leading-tight">Vou passar por lá</p>
            <p className="text-white/50 text-xs mt-1 font-medium">Declare sua rota. Atraia pedidos. Ganhe MOVE.</p>
          </div>
          <div className="flex justify-end mt-3">
            <ArrowRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: 'Aguardando', value: stats.pendentes,   icon: Clock,        color: 'text-orange-500', bg: 'bg-orange-50' },
          { title: 'Em Rota',    value: stats.emTransito,  icon: Truck,        color: 'text-blue-500',   bg: 'bg-blue-50'   },
          { title: 'Concluído',  value: stats.concluidos,  icon: CheckCircle2, color: 'text-green-500',  bg: 'bg-green-50'  },
        ].map(({ title, value, icon: Icon, color, bg }) => (
          <div key={title} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-1">{title}</p>
          </div>
        ))}
      </div>

      {/* Atividade recente */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Atividade Recente</h3>
          <Link to="/meus-envios" className="text-xs text-movendo font-black hover:underline uppercase flex items-center gap-1">
            Ver tudo <ChevronRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentEnvios.length === 0 ? (
            <div className="p-12 text-center text-gray-300 text-sm italic">Nenhum pedido ainda.</div>
          ) : recentEnvios.map(envio => (
            <div key={envio.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
                  <Package size={16} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{envio.descricao}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5 flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${envio.status === 'entregue' ? 'bg-green-400' : envio.status === 'aceito' ? 'bg-blue-400' : 'bg-orange-400'}`}></span>
                    {STATUS_LABEL[envio.status] ?? envio.status}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-gray-300 font-bold">
                {new Date(envio.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


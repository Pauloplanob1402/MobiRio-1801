import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, CheckCircle2, Clock, ChevronRight, RefreshCw } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  disponivel: 'Disponível',
  em_transito: 'Em Rota',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ pendentes: 0, emTransito: 0, concluidos: 0 });
  const [recentEnvios, setRecentEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: envios, error } = await supabase
        .from('envios')
        .select('*, fornecedor:fornecedores(nome_fantasia)')
        .eq('solicitante_id', user.id);

      if (error) throw error;

      const safeEnvios = envios || [];
      const counts = safeEnvios.reduce((acc: any, curr: any) => {
        if (curr.status === 'disponivel') acc.pendentes++;
        if (curr.status === 'em_transito') acc.emTransito++;
        if (curr.status === 'entregue') acc.concluidos++;
        return acc;
      }, { pendentes: 0, emTransito: 0, concluidos: 0 });

      setStats(counts);
      setRecentEnvios(
        [...safeEnvios]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Erro no Dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Atualiza em tempo real quando qualquer envio mudar
    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{value}</h3>
        </div>
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
          <Icon size={28} />
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-beirario" size={32} />
    </div>
  );

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Painel de Controle</h2>
          <p className="text-gray-500 mt-1 font-medium">Ecossistema logístico Grupo Beira Rio.</p>
        </div>
        <Link
          to="/criar"
          className="bg-beirario hover:bg-beirario-dark text-white px-8 py-4 rounded-2xl font-black uppercase shadow-xl shadow-beirario/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Package size={20} />
          Solicitar Carona
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Pendente" value={stats.pendentes} icon={Clock} color="bg-orange-500" />
        <StatCard title="Em Rota" value={stats.emTransito} icon={Truck} color="bg-blue-500" />
        <StatCard title="Concluído" value={stats.concluidos} icon={CheckCircle2} color="bg-green-500" />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-black text-gray-900 uppercase text-xs tracking-tight">Atividade Recente</h3>
          <Link to="/meus-envios" className="text-xs text-beirario font-black hover:underline uppercase flex items-center gap-1">
            Ver tudo <ChevronRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentEnvios.length === 0 ? (
            <div className="p-16 text-center text-gray-400 text-sm italic">Nenhum dado para exibir.</div>
          ) : (
            recentEnvios.map((envio) => (
              <div key={envio.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{envio.descricao}</p>
                    {/* Status traduzido para português */}
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      {STATUS_LABEL[envio.status] ?? envio.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 font-bold block">
                    {new Date(envio.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

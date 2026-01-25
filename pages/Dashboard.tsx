
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  MapPin
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    pendentes: 0,
    emTransito: 0,
    concluidos: 0,
  });
  const [recentEnvios, setRecentEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Busca todos os envios onde o usuário é o SOLICITANTE
        const { data: envios, error } = await supabase
          .from('envios')
          .select(`
            *,
            unidades(nome)
          `)
          .eq('solicitante_id', user.id);

        if (error) throw error;

        const safeEnvios = envios || [];
        const counts = safeEnvios.reduce((acc: any, curr: any) => {
          if (curr.status === 'disponivel') acc.pendentes++;
          if (curr.status === 'aceito' || curr.status === 'em_transito') acc.emTransito++;
          if (curr.status === 'entregue') acc.concluidos++;
          return acc;
        }, { pendentes: 0, emTransito: 0, concluidos: 0 });

        setStats(counts);
        setRecentEnvios([...safeEnvios].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-3xl font-black text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-lg`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Painel do Parceiro</h2>
          <p className="text-gray-500 mt-1">Bem-vindo à rede de logística Beira Rio.</p>
        </div>
        <Link 
          to="/criar" 
          className="bg-beirario hover:bg-beirario-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-beirario/10 transition-all flex items-center justify-center gap-2"
        >
          <Package size={20} />
          Solicitar Carona
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard title="Aguardando" value={stats.pendentes} icon={Clock} color="bg-orange-500" />
        <StatCard title="Em Rota" value={stats.emTransito} icon={Truck} color="bg-blue-500" />
        <StatCard title="Concluídos" value={stats.concluidos} icon={CheckCircle2} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Suas Solicitações Recentes</h3>
            <Link to="/meus-envios" className="text-sm text-beirario font-bold hover:underline flex items-center gap-1">
              Ver tudo <ChevronRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEnvios.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Nenhum envio registrado ainda.</div>
            ) : (
              recentEnvios.map((envio) => (
                <div key={envio.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 truncate max-w-[200px] text-sm">{envio.descricao}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                        <MapPin size={10} /> {(envio.unidades as any)?.nome}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${envio.status === 'disponivel' ? 'bg-orange-100 text-orange-600' : (envio.status === 'aceito' || envio.status === 'em_transito') ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {envio.status === 'disponivel' ? 'Aguardando' : envio.status === 'aceito' ? 'Aceito' : envio.status === 'em_transito' ? 'Em Rota' : 'Entregue'}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {new Date(envio.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform">
            <Truck size={200} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Logística Colaborativa</h3>
            <p className="text-gray-500 text-sm font-light leading-relaxed mb-6">
              A Mobirio facilita a movimentação de amostras e volumes entre sua empresa e as unidades Beira Rio. 
              Aproveite a rede para reduzir custos e agilizar processos.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-beirario-light flex items-center justify-center text-beirario">
                  <Package size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-700">Amostras e pequenos volumes</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-beirario-light flex items-center justify-center text-beirario">
                  <Truck size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-700">Rastreabilidade em tempo real</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

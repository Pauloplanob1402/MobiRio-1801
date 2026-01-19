
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Coins 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    pendentes: 0,
    emTransito: 0,
    concluidos: 0,
    saldo: 0
  });
  const [recentEnvios, setRecentEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id, empresas(creditos_saldo)')
        .eq('id', user.id)
        .single();

      if (usuario) {
        const empresaId = usuario.empresa_id;
        const saldo = (usuario.empresas as any)?.creditos_saldo || 0;

        // Stats
        const { data: envios } = await supabase
          .from('envios')
          .select('status')
          .or(`solicitante_id.eq.${empresaId},transportador_id.eq.${empresaId}`);

        const counts = (envios || []).reduce((acc: any, curr: any) => {
          if (curr.status === 'PENDENTE') acc.pendentes++;
          if (curr.status === 'EM_TRANSITO') acc.emTransito++;
          if (curr.status === 'ENTREGUE') acc.concluidos++;
          return acc;
        }, { pendentes: 0, emTransito: 0, concluidos: 0 });

        setStats({ ...counts, saldo });

        // Recent
        const { data: recent } = await supabase
          .from('envios')
          .select('*')
          .or(`solicitante_id.eq.${empresaId},transportador_id.eq.${empresaId}`)
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentEnvios(recent || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white`}>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Visão Geral</h2>
          <p className="text-gray-500 mt-1">Bem-vindo ao centro de controle Mobirio.</p>
        </div>
        <Link 
          to="/criar" 
          className="bg-beirario hover:bg-beirario-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-beirario/10 transition-all flex items-center justify-center gap-2"
        >
          <Package size={20} />
          Solicitar Novo Envio
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Pendentes" value={stats.pendentes} icon={Clock} color="bg-orange-500" />
        <StatCard title="Em Trânsito" value={stats.emTransito} icon={Truck} color="bg-blue-500" />
        <StatCard title="Entregues" value={stats.concluidos} icon={CheckCircle2} color="bg-green-500" />
        <StatCard title="Saldo Créditos" value={stats.saldo} icon={Coins} color="bg-beirario" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Shipments */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Atividades Recentes</h3>
            <Link to="/meus-envios" className="text-sm text-beirario font-bold hover:underline">Ver tudo</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentEnvios.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Nenhuma atividade recente encontrada.</div>
            ) : (
              recentEnvios.map((envio) => (
                <div key={envio.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 truncate max-w-[200px]">{envio.descricao}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {envio.origem} <ArrowRight size={10} /> {envio.destino}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`
                      text-[10px] font-bold px-2 py-1 rounded-full uppercase
                      ${envio.status === 'PENDENTE' ? 'bg-orange-100 text-orange-600' : ''}
                      ${envio.status === 'EM_TRANSITO' ? 'bg-blue-100 text-blue-600' : ''}
                      ${envio.status === 'ENTREGUE' ? 'bg-green-100 text-green-600' : ''}
                    `}>
                      {envio.status}
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

        {/* Info Card */}
        <div className="bg-beirario rounded-2xl p-8 text-white flex flex-col justify-between shadow-xl shadow-beirario/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Truck size={120} />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">Dica de Rota</h3>
            <p className="text-white/80 font-light leading-relaxed">
              Sabia que 90% das nossas caronas ocorrem entre Fornecedores e a Unidade Beira Rio 20? 
              Aproveite essas rotas para ganhar mais créditos rapidamente!
            </p>
          </div>
          <div className="relative z-10 mt-8">
            <Link 
              to="/disponiveis" 
              className="bg-white text-beirario px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all inline-block"
            >
              Explorar Rotas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

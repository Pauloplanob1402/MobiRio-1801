import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Truck, User, RefreshCw, MapPin, ArrowRight, Package } from 'lucide-react';

interface Envio {
  id: string;
  descricao: string;
  solicitante_id: string;
  destino_livre: string;
  created_at: string;
  solicitante: { nome: string; endereco: string } | null;
}

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [aceitando, setAceitando] = useState<string | null>(null);

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('envios')
        .select(`
          id, descricao, solicitante_id, destino_livre, created_at,
          solicitante:usuarios!envios_solicitante_fkey(nome, endereco)
        `)
        .eq('status', 'disponivel')
        .is('entregador_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filtered = (data || []).filter(item => item.solicitante_id !== user.id);
      setEnvios(filtered as Envio[]);
    } catch (err) {
      console.error('Erro na busca de caronas:', err);
      setEnvios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    const channel = supabase.channel('realtime_available')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, fetchAvailable)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAvailable]);

  const handleAccept = async (envio: Envio) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setAceitando(envio.id);
    try {
      const { error } = await supabase
        .from('envios')
        .update({
          entregador_id: user.id,
          aceito_por: user.id,
          aceito_em: new Date().toISOString(),
          status: 'aceito',
        })
        .eq('id', envio.id)
        .eq('status', 'disponivel'); // proteção contra race condition

      if (error) throw error;

      alert('✅ Carona aceita! Vá em "Minhas Atividades" para confirmar a entrega e ganhar +1 MOVE.');
      fetchAvailable();
    } catch (err: any) {
      alert('Erro ao aceitar carona: ' + err.message);
    } finally {
      setAceitando(null);
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
    <div className="flex justify-center py-20 text-beirario">
      <RefreshCw className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Caronas Disponíveis</h2>
          <p className="text-gray-400 text-xs font-bold mt-1 uppercase">{envios.length} pedido{envios.length !== 1 ? 's' : ''} aguardando</p>
        </div>
        <button onClick={fetchAvailable} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed p-20 text-center text-gray-400">
          <Truck className="mx-auto mb-4 opacity-10" size={64} />
          <p className="font-bold uppercase tracking-widest text-xs">Nenhuma carona no radar.</p>
          <p className="text-[10px] mt-2 text-gray-300">Novas solicitações aparecem aqui em tempo real.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden">

              {/* Header */}
              <div className="bg-beirario px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-white font-black text-xs uppercase truncate">
                    {envio.solicitante?.nome || 'Usuário'}
                  </span>
                </div>
                <span className="text-[9px] text-white/70 font-bold">{timeAgo(envio.created_at)}</span>
              </div>

              {/* Rota */}
              <div className="px-5 py-5 space-y-3 flex-1">
                <div className="space-y-2">
                  {/* Origem */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={12} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Coleta</p>
                      <p className="text-xs font-bold text-gray-700 leading-snug">
                        {envio.solicitante?.endereco || 'Endereço não informado'}
                      </p>
                    </div>
                  </div>

                  {/* Linha conectora */}
                  <div className="ml-3 w-0.5 h-3 bg-gray-200"></div>

                  {/* Destino */}
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={12} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase">Destino</p>
                      <p className="text-xs font-bold text-gray-700 leading-snug">{envio.destino_livre}</p>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div className="mt-3 p-3 bg-gray-50 rounded-xl border-l-4 border-gray-200">
                  <p className="text-xs text-gray-600 font-medium italic leading-relaxed">
                    "{envio.descricao}"
                  </p>
                </div>
              </div>

              {/* Recompensa + botão */}
              <div className="px-5 pb-5 space-y-3">
                <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-100 rounded-xl py-2">
                  <Package size={14} className="text-green-600" />
                  <span className="text-xs font-black text-green-700 uppercase">+1 MOVE ao entregar</span>
                </div>
                <button
                  onClick={() => handleAccept(envio)}
                  disabled={aceitando === envio.id}
                  className="w-full bg-black hover:bg-beirario text-white py-4 rounded-2xl font-black uppercase text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {aceitando === envio.id
                    ? <RefreshCw className="animate-spin" size={16} />
                    : <ArrowRight size={16} />
                  }
                  {aceitando === envio.id ? 'Processando...' : 'Aceitar e Transportar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;

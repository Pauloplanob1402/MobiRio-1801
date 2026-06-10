import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Clock, RefreshCw, Package, MapPin, Truck, User } from 'lucide-react';

const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('envios')
        .select(`
          id, descricao, destino_livre, status, created_at,
          solicitante_id, entregador_id,
          solicitante:usuarios!envios_solicitante_fkey(nome, endereco),
          entregador:usuarios!envios_entregador_fkey(nome)
        `)
        .eq('status', 'entregue')
        .or(`solicitante_id.eq.${user.id},entregador_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Erro Histórico:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const channel = supabase.channel('history_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'envios' }, fetchHistory)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchHistory]);

  if (loading) return (
    <div className="flex justify-center py-20 text-beirario">
      <RefreshCw className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Histórico</h2>
          <p className="text-gray-400 text-xs font-bold mt-1 uppercase">{history.length} entrega{history.length !== 1 ? 's' : ''} concluída{history.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchHistory} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-20 rounded-3xl border-2 border-dashed text-center text-gray-300">
          <Package className="mx-auto mb-4 opacity-10" size={48} />
          <p className="text-xs font-bold uppercase tracking-widest">Nenhuma entrega finalizada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(item => (
            <div key={item.id} className="bg-white rounded-3xl border border-l-4 border-l-green-500 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-3 bg-green-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span className="text-[10px] font-black text-green-700 uppercase">Entrega concluída</span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="p-5 space-y-3">
                {/* Rota */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={10} className="text-red-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-600">{item.solicitante?.endereco || '—'}</p>
                  </div>
                  <div className="ml-2.5 w-0.5 h-2 bg-gray-200"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={10} className="text-blue-500" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">{item.destino_livre}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-3">"{item.descricao}"</p>

                <div className="flex gap-3 text-[10px] text-gray-400">
                  {item.solicitante?.nome && (
                    <div className="flex items-center gap-1">
                      <User size={10} /> {item.solicitante.nome}
                    </div>
                  )}
                  {item.entregador?.nome && (
                    <div className="flex items-center gap-1">
                      <Truck size={10} /> {item.entregador.nome}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

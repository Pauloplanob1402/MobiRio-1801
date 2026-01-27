
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Clock, RefreshCw } from 'lucide-react';

const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simplificação total: select('*') sem joins para evitar erro 400
      const { data, error } = await supabase.from('envios')
        .select('*')
        .eq('status', 'entregue')
        .or(`solicitante_id.eq.${user.id},fornecedor_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Erro busca histórico (Bad Request?):", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    const channel = supabase.channel('history_simple')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios', filter: "status=eq.entregue" }, () => fetchHistory())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchHistory]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-beirario" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-900 uppercase">Histórico</h2>
        <button onClick={fetchHistory} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border-2 border-dashed text-center text-gray-400">
            <Clock className="mx-auto mb-4 opacity-10" size={60} />
            <p className="font-medium italic">Nenhuma entrega finalizada.</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-center shadow-sm hover:shadow-md transition-all gap-4">
              <div className="flex-1">
                <p className="font-black text-gray-900 uppercase text-xs leading-tight mb-2">{item.descricao}</p>
                <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 uppercase font-black tracking-widest">
                  <span className="flex items-center gap-1"><Clock size={12}/> {new Date(item.created_at).toLocaleDateString()}</span>
                  <span>ID: {item.id.substring(0,8)}...</span>
                </div>
              </div>
              <div className="shrink-0 bg-green-50 text-green-600 font-black text-[10px] uppercase px-6 py-2 rounded-full border border-green-100 flex items-center gap-2">
                <CheckCircle2 size={16}/> 
                Concluído
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;

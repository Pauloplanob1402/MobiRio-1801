import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Clock, RefreshCw, User, Building2 } from 'lucide-react';

const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // BUSCA COM JOINS: Trazendo nomes de usuários e unidades
      const { data, error } = await supabase
        .from('envios')
        .select(`
          *,
          unidade:unidades(nome),
          fornecedor:usuarios!fornecedor_id(nome),
          solicitante:usuarios!solicitante_id(nome)
        `)
        .eq('status', 'entregue')
        .or(`solicitante_id.eq.${user.id},fornecedor_id.eq.${user.id}`)
        .order('updated_at', { ascending: false }); // Ordena pelo mais recente entregue

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Erro busca histórico:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    // Realtime para quando uma entrega for finalizada, o histórico atualizar sozinho
    const channel = supabase.channel('history_updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'envios'
      }, () => fetchHistory())
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
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Histórico</h2>
          <p className="text-gray-500 text-sm">Registros de entregas concluídas.</p>
        </div>
        <button onClick={fetchHistory} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      <div className="grid gap-4">
        {history.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border-2 border-dashed text-center text-gray-400">
            <Clock className="mx-auto mb-4 opacity-10" size={64} />
            <p className="font-bold uppercase tracking-widest text-xs">Nenhuma carona finalizada encontrada.</p>
          </div>
        ) : (
          history.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col md:flex-row justify-between items-center shadow-sm hover:shadow-md transition-all gap-6 border-l-8 border-l-green-500">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <p className="font-black text-gray-900 uppercase text-sm leading-tight italic">"{item.descricao}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase">
                    <User size={14} className="text-beirario"/> 
                    <span>Motorista: {item.fornecedor?.nome || 'Sistema'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase">
                    <Building2 size={14} className="text-blue-500"/> 
                    <span>Destino: {item.unidade?.nome || 'Unidade Beira Rio'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2 text-[9px] text-gray-400 uppercase font-black tracking-widest border-t border-gray-50">
                  <span className="flex items-center gap-1"><Clock size={12}/> {new Date(item.updated_at).toLocaleDateString()}</span>
                  <span>Ref: {item.id.substring(0,8)}</span>
                </div>
              </div>

              <div className="shrink-0 bg-green-50 text-green-600 font-black text-[10px] uppercase px-6 py-3 rounded-2xl border border-green-100 flex items-center gap-2 shadow-sm">
                <CheckCircle2 size={16}/> 
                Entrega Concluída
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;

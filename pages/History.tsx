import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Clock, RefreshCw, Package, AlertTriangle } from 'lucide-react';

const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSimplified, setIsSimplified] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      // PLANO A: Tenta buscar com nomes
      let { data, error } = await supabase
        .from('envios')
        .select('*, unidade:unidades(nome), fornecedor:usuarios!fornecedor_id(nome), solicitante:usuarios!solicitante_id(nome)')
        .eq('status', 'entregue')
        .or(`solicitante_id.eq.${auth.user.id},fornecedor_id.eq.${auth.user.id}`)
        .order('updated_at', { ascending: false });

      // PLANO B: Fallback para IDs se o banco der erro 400
      if (error) {
        const { data: sD, error: sE } = await supabase
          .from('envios')
          .select('*')
          .eq('status', 'entregue')
          .or(`solicitante_id.eq.${auth.user.id},fornecedor_id.eq.${auth.user.id}`)
          .order('updated_at', { ascending: false });
        
        if (sE) throw sE;
        data = sD;
        setIsSimplified(true);
      }

      setHistory(data || []);
    } catch (err) {
      console.error("Erro Histórico:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  if (loading) return <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-beirario" size={32} /></div>;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black uppercase">Histórico</h2>
        {isSimplified && <span className="text-[10px] text-orange-500 font-bold uppercase flex items-center gap-1"><AlertTriangle size={12}/> Dados Resumidos</span>}
      </div>

      {history.length === 0 ? (
        <div className="bg-white p-20 rounded-3xl border-2 border-dashed text-center text-gray-300">
          <Package className="mx-auto mb-4 opacity-10" size={48} />
          <p className="text-xs font-bold uppercase">Nenhuma entrega finalizada encontrada.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map(item => (
            <div key={item.id} className="bg-white p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 border-l-8 border-l-green-500 shadow-sm">
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">"{item.descricao}"</p>
                <div className="flex gap-4 mt-2 text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                  <span><Clock size={10} className="inline mr-1"/>{new Date(item.updated_at).toLocaleDateString()}</span>
                  <span>Unidade: {item.unidade?.nome || item.unidade_id?.substring(0,8)}</span>
                </div>
              </div>
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-[10px] font-black uppercase border border-green-100">
                Concluído
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;

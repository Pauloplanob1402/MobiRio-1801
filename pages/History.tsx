import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CheckCircle2, Building2, Clock } from 'lucide-react';

const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.from('envios')
      .select(`*, unidade:unidades(nome), fornecedor:usuarios!fornecedor_id(nome), solicitante:usuarios!solicitante_id(nome)`)
      .eq('status', 'entregue')
      .or(`solicitante_id.eq.${user.id},fornecedor_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    setHistory(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHistory();
    window.addEventListener('focus', fetchHistory);
    return () => window.removeEventListener('focus', fetchHistory);
  }, [fetchHistory]);

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-black uppercase">Histórico</h2>
      {history.map(item => (
        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
          <div>
            <p className="font-bold text-gray-800 uppercase text-sm">{item.descricao}</p>
            <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(item.updated_at).toLocaleDateString()} | {item.unidade?.nome}</p>
          </div>
          <div className="text-green-500 font-black text-xs uppercase flex items-center gap-1"><CheckCircle2 size={14}/> Entregue</div>
        </div>
      ))}
    </div>
  );
};

export default History;

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Clock, CheckCircle2, MapPin, Building2, Package } from 'lucide-react';

const History: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca tudo que já foi ENTREGUE onde eu era o solicitante ou o motorista
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
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <div className="p-10 text-center font-bold">Carregando histórico...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Histórico Logístico</h2>
        <p className="text-gray-500 mt-1">Relatório completo de suas solicitações entregues.</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed p-10 text-center text-gray-400">
          <p>Nenhum registro encontrado no histórico.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição do Volume</th>
                <th className="px-6 py-4">Unidade Destino</th>
                <th className="px-6 py-4">Participantes</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(item.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900 leading-none">{item.descricao}</p>
                    <p className="text-[10px] text-gray-400 mt-1">ID: {item.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <Building2 size={14} className="text-beirario" />
                      {item.unidade?.nome || 'Beira Rio'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Solicitante: {item.solicitante?.nome}</p>
                      <p className="text-[10px] text-beirario uppercase font-bold tracking-tighter">Motorista: {item.fornecedor?.nome}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-full text-[10px] font-black uppercase">
                      <CheckCircle2 size={12} /> Entregue
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default History;

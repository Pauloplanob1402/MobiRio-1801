
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, ArrowRight, CheckCircle, Search } from 'lucide-react';

const History: React.FC = () => {
  const [history, setHistory] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (usuario) {
        const { data } = await supabase
          .from('envios')
          .select('*')
          .or(`solicitante_id.eq.${usuario.empresa_id},transportador_id.eq.${usuario.empresa_id}`)
          .eq('status', 'ENTREGUE')
          .order('data_entrega', { ascending: false });
        
        setHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.origem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.destino.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Histórico</h2>
          <p className="text-gray-500 mt-1">Todos os seus envios finalizados e entregues.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar histórico..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/10 focus:border-beirario"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Data Entrega</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Rota</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhum registro encontrado no histórico.</td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {item.data_entrega ? new Date(item.data_entrega).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                          <Package size={16} />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">{item.descricao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.origem}</span>
                        <ArrowRight size={10} className="text-gray-300" />
                        <span>{item.destino}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">{item.volume_tipo}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
                        <CheckCircle size={14} />
                        ENTREGUE
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;

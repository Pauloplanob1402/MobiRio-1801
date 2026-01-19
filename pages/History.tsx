
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, Building2, CheckCircle, Search, MapPin } from 'lucide-react';

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
        .select('fornecedor_id')
        .eq('id', user.id)
        .single();

      if (usuario) {
        const { data } = await supabase
          .from('envios')
          .select(`
            *,
            unidades(nome)
          `)
          .eq('fornecedor_id', usuario.fornecedor_id)
          .eq('status', 'entregue')
          .order('created_at', { ascending: false });
        
        setHistory(data || []);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.unidades as any)?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Histórico Logístico</h2>
          <p className="text-gray-500 mt-1">Relatório completo de entregas finalizadas.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Buscar por descrição ou destino..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-beirario/10 focus:border-beirario text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">Data Solicitação</th>
                <th className="px-6 py-4">Descrição do Volume</th>
                <th className="px-6 py-4">Unidade Destino</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">Nenhum registro encontrado no histórico.</td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                          <Package size={16} />
                        </div>
                        <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{item.descricao}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                        <Building2 size={14} className="text-beirario" />
                        <span>{(item.unidades as any)?.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase">
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
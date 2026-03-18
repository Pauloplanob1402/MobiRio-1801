import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar, TrendingUp, RefreshCw } from 'lucide-react';

const Wallet: React.FC = () => {
  const [saldo, setSaldo] = useState(0);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const { data: movs, error: movError } = await supabase
        .from('movimentos_credito')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (movError) throw movError;

      const transactions = movs || [];

      const calculatedBalance = transactions.reduce((acc, mov) => {
        return acc + (mov.quantidade ?? 0);
      }, 0);

      setSaldo(calculatedBalance);
      setMovimentos(transactions);
    } catch (err) {
      console.error("Erro na carteira:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('wallet_updates_simple')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movimentos_credito' }, () => fetchData())
      .subscribe();

    window.addEventListener('balanceUpdated', fetchData);

    return () => {
      window.removeEventListener('balanceUpdated', fetchData);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <RefreshCw className="animate-spin text-beirario" size={32} />
    </div>
  );

  const isCredito = (mov: any) => (mov.quantidade ?? 0) > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans p-6">
      <h2 className="text-3xl font-black text-gray-900 uppercase">Meu Saldo MOVE</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-black rounded-3xl p-8 text-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Coins size={100} />
          </div>
          <p className="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-2">Disponível</p>
          <h3 className="text-7xl font-black tracking-tighter">{saldo}</h3>
          <p className="mt-4 text-[10px] font-black text-beirario bg-white px-4 py-1.5 rounded-full uppercase">Créditos MOVE</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-center space-y-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><ArrowUpRight size={20} /></div>
            <div>
              <p className="font-bold text-gray-900 text-sm uppercase">Entregue Caronas</p>
              <p className="text-xs text-gray-500 mt-1">Ao finalizar uma entrega, você ganha +1 MOVE.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 border-t border-gray-50 pt-6">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ArrowDownLeft size={20} /></div>
            <div>
              <p className="font-bold text-gray-900 text-sm uppercase">Solicite Caronas</p>
              <p className="text-xs text-gray-500 mt-1">Cada pedido realizado consome 1 MOVE do seu saldo.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-gray-400" />
            <h3 className="font-black text-gray-900 uppercase text-xs tracking-tight">Histórico de Movimentações</h3>
          </div>
          <button onClick={fetchData} className="text-[10px] font-black text-beirario uppercase">Recarregar</button>
        </div>
        <div className="divide-y divide-gray-50">
          {movimentos.length === 0 ? (
            <div className="p-16 text-center text-gray-400 text-sm italic">Nenhum registro encontrado.</div>
          ) : (
            movimentos.map((mov) => (
              <div key={mov.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredito(mov) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {isCredito(mov) ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase">
                      {isCredito(mov) ? 'Recebido' : 'Utilizado'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">
                      <Calendar size={10} className="inline mr-1" />
                      {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={`font-black text-xl ${isCredito(mov) ? 'text-green-600' : 'text-red-600'}`}>
                  {(mov.quantidade ?? 0) > 0 ? '+' : ''}{mov.quantidade}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;

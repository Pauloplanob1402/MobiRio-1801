import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar, Info, TrendingUp, RefreshCw } from 'lucide-react';

const Wallet: React.FC = () => {
  const [saldo, setSaldo] = useState(0);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      // 1. BUSCA O SALDO REAL NA TABELA USUARIOS
      const { data: userData } = await supabase
        .from('usuarios')
        .select('creditos')
        .eq('id', user.id)
        .single();
      
      if (userData) setSaldo(userData.creditos);

      // 2. BUSCA O HISTÓRICO (EXTRATO) - Simplificado para evitar Erro 400
      const { data: movs, error: movError } = await supabase
        .from('movimentos_credito')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });
      
      if (movError) throw movError;
      setMovimentos(movs || []);

    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // REALTIME: Escuta qualquer mudança de crédito ou novo movimento
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('wallet-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'movimentos_credito', filter: `usuario_id=eq.${user.id}` }, () => fetchData())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'usuarios', filter: `id=eq.${user.id}` }, () => fetchData())
        .subscribe();
      
      return channel;
    };

    const channelPromise = setupRealtime();
    window.addEventListener('balanceUpdated', fetchData);

    return () => { 
      window.removeEventListener('balanceUpdated', fetchData);
      channelPromise.then(c => c && supabase.removeChannel(c)); 
    };
  }, [fetchData]);

  if (loading) return <div className="flex justify-center py-12"><RefreshCw className="animate-spin text-beirario" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans p-4">
      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Saldo MOVE</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD DE SALDO */}
        <div className="lg:col-span-1 bg-black rounded-3xl p-8 text-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <p className="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-2">Saldo Atual</p>
          <h3 className="text-7xl font-black tracking-tighter">{saldo}</h3>
          <p className="mt-4 text-xs font-medium text-beirario bg-white px-3 py-1 rounded-full">MOVE Disponíveis</p>
        </div>

        {/* EXPLICAÇÃO */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-center space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <ArrowUpRight className="text-green-600 shrink-0" />
            <p className="text-sm text-gray-600"><b>Ganhe MOVE:</b> Entregue uma carona de outro parceiro.</p>
          </div>
          <div className="flex items-start gap-3 border-t pt-4">
            <ArrowDownLeft className="text-red-600 shrink-0" />
            <p className="text-sm text-gray-600"><b>Use MOVE:</b> Solicite uma carona para seus volumes.</p>
          </div>
        </div>
      </div>

      {/* EXTRATO */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2 font-bold">
          <TrendingUp size={18} /> Extrato de Movimentações
        </div>
        <div className="divide-y divide-gray-50">
          {movimentos.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Nenhuma movimentação ainda.</div>
          ) : (
            movimentos.map((mov) => (
              <div key={mov.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mov.tipo === 'CREDITO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {mov.tipo === 'CREDITO' ? <ArrowUpRight /> : <ArrowDownLeft />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{mov.tipo === 'CREDITO' ? 'Crédito por Entrega' : 'Débito por Solicitação'}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar size={10} /> {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={`font-black text-xl ${mov.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.tipo === 'CREDITO' ? '+' : '-'}{mov.quantidade}
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

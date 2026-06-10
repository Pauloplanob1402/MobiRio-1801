import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RefreshCw, TrendingUp, TrendingDown, Gift, Coins } from 'lucide-react';

interface Movimento {
  id: string;
  quantidade: number;
  tipo: 'CREDITO' | 'DEBITO';
  created_at: string;
  envios?: { descricao: string; destino_livre: string } | null;
}

const Wallet: React.FC = () => {
  const [saldo, setSaldo] = useState<number | null>(null);
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Saldo direto do perfil (fonte da verdade)
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('creditos')
        .eq('id', user.id)
        .single();

      setSaldo(perfil?.creditos ?? 0);

      // Histórico de movimentos
      const { data: hist } = await supabase
        .from('movimentos_credito')
        .select(`
          id, quantidade, tipo, created_at,
          envios(descricao, destino_livre)
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setMovimentos(hist || []);
    } catch (err) {
      console.error('Erro ao carregar carteira:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    // Ouvir evento de atualização de saldo
    window.addEventListener('balanceUpdated', fetchWallet);
    const channel = supabase.channel('wallet_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movimentos_credito' }, fetchWallet)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'usuarios' }, fetchWallet)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('balanceUpdated', fetchWallet);
    };
  }, [fetchWallet]);

  const totalCreditado = movimentos.filter(m => m.quantidade > 0).reduce((s, m) => s + m.quantidade, 0);
  const totalDebitado = movimentos.filter(m => m.quantidade < 0).reduce((s, m) => s + Math.abs(m.quantidade), 0);

  const labelMovimento = (m: Movimento) => {
    if (m.quantidade === 12 || (m.quantidade > 0 && !m.envios)) return 'Bônus de boas-vindas';
    if (m.quantidade > 0) return `Entrega realizada${m.envios?.destino_livre ? ' → ' + m.envios.destino_livre : ''}`;
    return `Frete solicitado${m.envios?.destino_livre ? ' → ' + m.envios.destino_livre : ''}`;
  };

  if (loading) return (
    <div className="flex justify-center py-20 text-beirario">
      <RefreshCw className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto font-sans space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Carteira MOVE</h2>
        <button onClick={fetchWallet} className="p-2 hover:bg-gray-100 rounded-full">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Saldo principal */}
      <div className="bg-beirario rounded-[2.5rem] p-8 text-white shadow-2xl shadow-beirario/30">
        <div className="flex items-center gap-3 mb-2">
          <Coins size={20} className="opacity-70" />
          <p className="text-xs font-black uppercase opacity-70 tracking-widest">Saldo disponível</p>
        </div>
        <p className="text-7xl font-black leading-none tracking-tighter">
          {saldo ?? '—'}
        </p>
        <p className="text-lg font-bold opacity-60 mt-1">MOVE</p>
        <p className="text-xs opacity-50 mt-4 font-medium">
          Cada entrega aceita vale +1 MOVE · Cada frete solicitado custa -1 MOVE
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <TrendingUp size={16} className="text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-black text-green-700">+{totalCreditado}</p>
          <p className="text-[9px] font-black uppercase text-green-500 tracking-wider">Total creditado</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <TrendingDown size={16} className="text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-black text-red-600">-{totalDebitado}</p>
          <p className="text-[9px] font-black uppercase text-red-400 tracking-wider">Total debitado</p>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Extrato</h3>

        {movimentos.length === 0 ? (
          <div className="bg-white border-2 border-dashed rounded-3xl p-12 text-center text-gray-300">
            <Coins className="mx-auto mb-3 opacity-10" size={40} />
            <p className="text-xs font-bold uppercase">Nenhuma movimentação ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {movimentos.map((m) => {
              const isCredito = m.quantidade > 0;
              const isBonusBoas = m.quantidade === 12 && !m.envios;
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isBonusBoas ? 'bg-yellow-100' : isCredito ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {isBonusBoas
                      ? <Gift size={16} className="text-yellow-600" />
                      : isCredito
                        ? <TrendingUp size={16} className="text-green-600" />
                        : <TrendingDown size={16} className="text-red-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{labelMovimento(m)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(m.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`text-sm font-black shrink-0 ${isCredito ? 'text-green-600' : 'text-red-500'}`}>
                    {isCredito ? '+' : ''}{m.quantidade} MOVE
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;

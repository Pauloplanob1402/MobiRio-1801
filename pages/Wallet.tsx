
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MovimentoCredito } from '../types';
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar, Info, TrendingUp } from 'lucide-react';

const Wallet: React.FC = () => {
  const [saldo, setSaldo] = useState(0);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      // 1. Saldo do Usuário
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('creditos')
        .eq('id', auth.user.id)
        .single();
      
      if (usuario) setSaldo(usuario.creditos);

      // 2. Extrato
      const { data: movs } = await supabase
        .from('movimentos_credito')
        .select(`
          *,
          envios:envio_id(descricao, unidade:unidades(nome))
        `)
        .eq('usuario_id', auth.user.id)
        .order('created_at', { ascending: false });
      
      setMovimentos(movs || []);
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let user_id: string;
    
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      user_id = user.id;

      // Carga inicial
      fetchData();

      // REALTIME: Escuta atualizações na tabela 'usuarios' para o saldo específico deste usuário
      const channel = supabase
        .channel('user-credits')
        .on(
          'postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'usuarios', 
            filter: `id=eq.${user_id}` 
          },
          (payload) => { 
            setSaldo(payload.new.creditos); 
            // Recarrega o extrato também quando o saldo muda
            fetchData();
          }
        )
        .subscribe();
      
      return channel;
    };

    const channelPromise = setupRealtime();
    
    // Suporte ao evento customizado para compatibilidade legada se necessário
    window.addEventListener('balanceUpdated', fetchData);

    return () => { 
      window.removeEventListener('balanceUpdated', fetchData);
      channelPromise.then(c => c && supabase.removeChannel(c)); 
    };
  }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Saldo MOVE</h2>
          <p className="text-gray-500 mt-1">Sua participação na logística colaborativa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-beirario rounded-3xl p-8 text-white shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Coins size={120} />
          </div>
          <p className="text-white/70 font-bold uppercase tracking-widest text-[10px] mb-2">Seu Saldo Atual</p>
          <h3 className="text-7xl font-black tracking-tighter">{saldo}</h3>
          <p className="mt-4 text-xs font-medium text-white/80">MOVE disponíveis</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-gray-100 flex flex-col justify-center space-y-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center shrink-0"><ArrowUpRight size={20} /></div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Ganhe MOVE oferecendo</h4>
              <p className="text-xs text-gray-500">Cada carona de volume que você realiza para um parceiro gera +1 MOVE.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0"><ArrowDownLeft size={20} /></div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Utilize MOVE solicitando</h4>
              <p className="text-xs text-gray-500">Cada carona de volume que você utiliza de um parceiro consome 1 MOVE.</p>
            </div>
          </div>
          <div className="pt-2 bg-gray-50 p-4 rounded-xl flex items-center gap-3 text-xs text-gray-600">
            <Info size={16} className="text-beirario" />
            <span>O sistema MOVE equilibra o ecossistema e garante a reciprocidade entre os parceiros.</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
          <TrendingUp size={18} className="text-gray-400" />
          <h3 className="font-bold text-gray-900">Extrato de Movimentação</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {movimentos.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Nenhuma movimentação registrada.</div>
          ) : (
            movimentos.map((mov) => (
              <div key={mov.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mov.tipo === 'CREDITO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {mov.tipo === 'CREDITO' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{mov.envios?.descricao || 'Carga Inicial Mobirio'}</p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                      <Calendar size={10} /> {new Date(mov.created_at).toLocaleDateString('pt-BR')} 
                      {mov.envios?.unidade && ` • Destino: ${mov.envios.unidade.nome}`}
                    </p>
                  </div>
                </div>
                <div className={`font-black text-lg ${mov.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
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

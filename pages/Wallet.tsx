
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MovimentoCredito } from '../types';
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar, Info } from 'lucide-react';

const Wallet: React.FC = () => {
  const [saldo, setSaldo] = useState(0);
  const [movimentos, setMovimentos] = useState<MovimentoCredito[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obter saldo direto da tabela 'usuarios'
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('fornecedor_id, creditos')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!usuario) return;

      if (typeof usuario.creditos === 'number') {
        setSaldo(usuario.creditos);
      }

      // Buscar histórico filtrando por usuario_id ou fornecedor_id
      const { data: movs } = await supabase
        .from('movimentos_credito')
        .select('*, envios:envio_id(descricao)')
        .eq('fornecedor_id', usuario.fornecedor_id)
        .order('created_at', { ascending: false });
      
      if (movs) {
        setMovimentos(movs as MovimentoCredito[]);
      }
    } catch (err) {
      console.error("Erro ao carregar carteira:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Ouvinte de atualização global de saldo
    window.addEventListener('balanceUpdated', fetchData);
    return () => window.removeEventListener('balanceUpdated', fetchData);
  }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans text-gray-900">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Meus MOVE</h2>
          <p className="text-gray-500 mt-1">Extrato de participação colaborativa.</p>
        </div>
        <div className="bg-beirario-light text-beirario px-4 py-2 rounded-xl border border-beirario/10 flex items-center gap-2 text-xs font-bold">
          <Info size={16} />
          <span>MOVE é gerado ao oferecer carona. Receber carona consome MOVE.</span>
        </div>
      </div>

      <div className="bg-beirario rounded-3xl p-10 text-white shadow-xl shadow-beirario/20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <Coins size={32} />
        </div>
        <p className="text-white/60 font-medium uppercase tracking-widest text-xs mb-2">Saldo de MOVE</p>
        <h3 className="text-6xl font-black">{saldo}</h3>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Histórico de MOVE</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {movimentos.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">Nenhuma movimentação registrada.</div>
          ) : (
            movimentos.map((mov) => (
              <div key={mov.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mov.tipo === 'CREDITO' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {mov.tipo === 'CREDITO' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{mov.envios?.descricao || 'Movimentação Mobirio'}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(mov.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className={`font-bold text-lg ${mov.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.tipo === 'CREDITO' ? '+' : '-'}{mov.quantidade}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
        <p className="text-sm text-gray-500 leading-relaxed text-center">
          Cada carona concluída equilibra o ecossistema Mobirio.<br />
          Os créditos iniciais garantem suas primeiras solicitações de carona.
        </p>
      </div>
    </div>
  );
};

export default Wallet;

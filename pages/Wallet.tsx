
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { MovimentoCredito } from '../types';
import { Coins, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react';

const Wallet: React.FC = () => {
  const [saldo, setSaldo] = useState(0);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('empresa_id, empresas(creditos_saldo)')
        .eq('id', user.id)
        .single();

      if (usuario) {
        setSaldo((usuario.empresas as any)?.creditos_saldo || 0);
        
        const { data: movs } = await supabase
          .from('movimentos_credito')
          .select('*, envios(descricao)')
          .eq('empresa_id', usuario.empresa_id)
          .order('created_at', { ascending: false });
        
        setMovimentos(movs || []);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Minha Carteira</h2>
        <p className="text-gray-500 mt-1">Gerencie seu saldo de créditos corporativos.</p>
      </div>

      <div className="bg-beirario rounded-3xl p-10 text-white shadow-xl shadow-beirario/20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
          <Coins size={32} />
        </div>
        <p className="text-white/60 font-medium uppercase tracking-widest text-xs mb-2">Saldo Atual</p>
        <h3 className="text-6xl font-black">{saldo}</h3>
        <p className="mt-4 text-white/80 font-light max-w-xs">
          Créditos são utilizados para solicitar caronas e ganhos ao realizar transportes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Extrato de Movimentações</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {movimentos.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Nenhuma movimentação registrada.</div>
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
                      {new Date(mov.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className={`font-bold text-lg ${mov.tipo === 'CREDITO' ? 'text-green-600' : 'text-red-600'}`}>
                  {mov.tipo === 'CREDITO' ? '+' : ''}{mov.quantidade}
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

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Truck, User, Building2, RefreshCw, MapPin } from 'lucide-react';

interface Envio {
  id: string;
  descricao: string;
  solicitante_id: string;
  unidade_id: string;
  created_at: string;
  solicitante: { nome: string; endereco: string } | null;
  unidade: { nome: string } | null;
}

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [aceitando, setAceitando] = useState<string | null>(null);

  const fetchAvailable = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // CORRIGIDO: hints explícitos com nome da FK para evitar PGRST201
      const { data, error } = await supabase
        .from('envios')
        .select(`
          id, descricao, solicitante_id, unidade_id, created_at,
          solicitante:usuarios!envios_solicitante_fkey(nome, endereco),
          unidade:unidades!envios_unidade_id_fkey(nome)
        `)
        .eq('status', 'disponivel')
        .is('entregador_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const filtered = (data || []).filter(item => item.solicitante_id !== user.id);
      setEnvios(filtered as Envio[]);
    } catch (err) {
      console.error("Erro na busca de caronas:", err);
      setEnvios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    const channel = supabase.channel('realtime_available')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'envios' }, fetchAvailable)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAvailable]);

  const handleAccept = async (envio: Envio) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setAceitando(envio.id);
    try {
      // 1. Verifica saldo MOVE
      const { data: movs, error: saldoError } = await supabase
        .from('movimentos_credito')
        .select('quantidade')
        .eq('usuario_id', user.id);

      if (saldoError) throw saldoError;

      const saldo = (movs || []).reduce((acc, m) => acc + (m.quantidade ?? 0), 0);

      if (saldo < 1) {
        alert('⚠️ Saldo MOVE insuficiente para aceitar esta carona.');
        return;
      }

      // 2. Atualiza o envio
      const { error: updateError } = await supabase
        .from('envios')
        .update({
          entregador_id: user.id,
          aceito_por: user.id,
          aceito_em: new Date().toISOString(),
          status: 'em_transito',
        })
        .eq('id', envio.id);

      if (updateError) throw updateError;

      // 3. Debita 1 MOVE
      const { error: moveError } = await supabase
        .from('movimentos_credito')
        .insert({
          usuario_id: user.id,
          quantidade: -1,
          tipo: 'DEBITO_ENTREGA',
        });

      if (moveError) throw moveError;

      alert('✅ Carona aceita! Vá em "Minhas Atividades" para ver os detalhes.');
      fetchAvailable();
    } catch (err: any) {
      alert('Erro ao aceitar carona: ' + err.message);
    } finally {
      setAceitando(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20 text-beirario">
      <RefreshCw className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Caronas Disponíveis</h2>
        <button onClick={fetchAvailable} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCw size={20} className="text-gray-400" />
        </button>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed p-20 text-center text-gray-400">
          <Truck className="mx-auto mb-4 opacity-10" size={64} />
          <p className="font-bold uppercase tracking-widest text-xs">Nenhuma carona no radar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all border-t-8 border-t-beirario">
              <div className="space-y-4">
                <div className="flex items-center gap-2 font-black uppercase text-gray-800 text-[11px]">
                  <User size={14} className="text-beirario" />
                  {envio.solicitante?.nome || 'Sem Nome'}
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2 text-[10px] font-black text-gray-600 uppercase">
                    <MapPin size={14} className="text-red-500 shrink-0" />
                    <span>COLETA: {envio.solicitante?.endereco || 'Verificar via contato'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px] font-black text-gray-600 uppercase">
                    <Building2 size={14} className="text-blue-500 shrink-0" />
                    <span>DESTINO: {envio.unidade?.nome || `Unidade ${envio.unidade_id?.substring(0, 8)}`}</span>
                  </div>
                </div>

                <div className="p-3 border-l-4 border-gray-200 bg-gray-50/30">
                  <p className="text-xs text-gray-700 font-bold italic">"{envio.descricao}"</p>
                </div>

                <button
                  onClick={() => handleAccept(envio)}
                  disabled={aceitando === envio.id}
                  className="w-full bg-black hover:bg-beirario text-white py-4 rounded-2xl font-black uppercase transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {aceitando === envio.id
                    ? <RefreshCw className="animate-spin" size={18} />
                    : <Truck size={18} />
                  }
                  {aceitando === envio.id ? 'Processando...' : 'Aceitar e Transportar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;

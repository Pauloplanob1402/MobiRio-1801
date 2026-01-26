import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, MapPin, User, Building2 } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAvailable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // MELHORIA: Agora buscamos também a unidade de destino para o motorista saber para onde vai
      const { data, error } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios!solicitante_id(nome, endereco, telefone),
          unidade:unidades(nome)
        `) 
        .eq('status', 'disponivel')
        .is('fornecedor_id', null)
        .neq('solicitante_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEnvios(data || []);
    } catch (err) {
      console.error("Erro na busca:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
    const channel = supabase.channel('available_realtime').on('postgres_changes', 
      { event: '*', schema: 'public', table: 'envios' }, () => fetchAvailable()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAccept = async (envioId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('envios')
      .update({
        fornecedor_id: user.id,
        status: 'em_transito'
      })
      .eq('id', envioId);

    if (error) {
      alert('Erro ao aceitar: ' + error.message);
    } else {
      alert('✅ Carona aceita! Vá em "Minhas Atividades" para entregar e ganhar seu MOVE.');
      fetchAvailable();
    }
  };

  if (loading) return <div className="p-10 text-center font-bold text-beirario">Buscando caronas disponíveis...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="border-b pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase">Caronas Disponíveis</h2>
          <p className="text-gray-500 font-medium">Ajude um parceiro e ganhe créditos MOVE.</p>
        </div>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed p-20 text-center text-gray-400">
          <Truck className="mx-auto mb-4 opacity-30" size={60} />
          <p className="font-bold">Nenhuma carona disponível no momento.</p>
          <p className="text-sm">Tente novamente mais tarde ou peça uma carona!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-md hover:shadow-xl transition-all border-l-8 border-l-beirario">
              <div className="flex justify-between mb-6">
                <div className="bg-beirario/10 p-3 rounded-xl text-beirario"><Package size={24} /></div>
                <div className="text-right">
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-black uppercase tracking-widest">Aguardando Coleta</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-beirario" />
                  <p className="font-black text-gray-800 uppercase">{envio.solicitante?.nome || 'Fornecedor Parceiro'}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-red-500 mt-1" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase">Coleta (Origem)</p>
                      <p className="text-xs font-bold text-gray-700">{envio.solicitante?.endereco || 'Endereço do Solicitante'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 border-t pt-2">
                    <Building2 size={16} className="text-blue-500 mt-1" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase">Destino (Entrega)</p>
                      <p className="text-xs font-bold text-gray-700">{envio.unidade?.nome || 'Unidade Beira Rio'}</p>
                    </div>
                  </div>
                </div>

                <div className="px-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Conteúdo do Volume</p>
                  <p className="text-sm font-medium text-gray-600 italic">"{envio.descricao}"</p>
                </div>
              </div>

              <button 
                onClick={() => handleAccept(envio.id)}
                className="w-full mt-8 bg-black hover:bg-beirario text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg active:scale-95"
              >
                Aceitar e Iniciar Rota
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableShipments;
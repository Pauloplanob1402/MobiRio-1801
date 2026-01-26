
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, Building2, MapPin, CheckCircle2, Phone } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAvailable = useCallback(async () => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      // QUERY SIMPLIFICADA: Reset para evitar Erro 400. 
      // Buscamos os dados base e as relações de forma direta.
      const { data, error } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios(nome, endereco, telefone),
          unidade:unidades(nome)
        `)
        .eq('status', 'disponivel')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Filtro de visibilidade apenas no mapeamento para garantir que a query base funcione
      const filteredData = (data || []).filter(item => item.solicitante_id !== user.id);
      setEnvios(filteredData);
    } catch (err) {
      console.error("Erro na comunicação (Status 400?):", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();

    // REALTIME: Subscrição direta na tabela 'envios'
    const channel = supabase
      .channel('realtime-available-global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'envios' },
        () => {
          fetchAvailable();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAvailable]);

  const handleAccept = async (envioId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setProcessingId(envioId);
    try {
      const { error } = await supabase
        .from('envios')
        .update({
          fornecedor_id: user.id,
          status: 'em_transito',
          aceito_por: user.id,
          aceito_em: new Date().toISOString()
        })
        .eq('id', envioId)
        .eq('status', 'disponivel');

      if (error) throw error;
      
      alert('Carona aceita com sucesso!');
      fetchAvailable();
    } catch (err: any) {
      alert('Erro ao processar: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Caronas Disponíveis</h2>
        <p className="text-gray-500 mt-1">Volumes de outros parceiros aguardando transporte.</p>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
          <Truck className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900">Tudo em dia!</h3>
          <p className="text-gray-500 text-sm mt-2">Não há novas solicitações de carona no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all group">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-gray-50 text-gray-400 group-hover:text-beirario group-hover:bg-beirario-light rounded-lg flex items-center justify-center transition-colors">
                    <Package size={20} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Publicado em</p>
                    <p className="text-[10px] font-bold text-gray-900">{new Date(envio.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-tight line-clamp-1">SOLICITANTE: {envio.solicitante?.nome || 'Não informado'}</h4>
                  <p className="text-xs text-gray-500 italic mt-1 font-medium">DESCRIÇÃO: "{envio.descricao}"</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ORIGEM (RETIRADA)</p>
                      <p className="text-xs font-semibold text-gray-700">{envio.solicitante?.endereco || 'Endereço não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 size={14} className="text-beirario mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">DESTINO</p>
                      <p className="text-xs font-semibold text-gray-700">{envio.unidade?.nome || 'Unidade Beira Rio'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">TELEFONE</p>
                      <p className="text-xs font-semibold text-gray-700">{envio.solicitante?.telefone || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleAccept(envio.id)}
                  disabled={processingId === envio.id}
                  className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === envio.id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Aceitar Carona
                    </>
                  )}
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

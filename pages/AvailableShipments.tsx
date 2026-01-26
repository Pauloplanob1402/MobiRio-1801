
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Package, Truck, Building2, MapPin, CheckCircle2, Phone } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAvailable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca envios DISPONÍVEIS onde o fornecedor é NULL e o solicitante NÃO é o usuário logado
      const { data, error } = await supabase
        .from('envios')
        .select(`
          *,
          solicitante:usuarios!solicitante_id(nome, endereco, telefone),
          unidade:unidades!unidade_id(nome)
        `)
        .eq('status', 'disponivel')
        .is('fornecedor_id', null)
        .neq('solicitante_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEnvios(data || []);
    } catch (err) {
      console.error("Erro ao buscar caronas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailable();
  }, []);

  const handleAccept = async (envioId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setProcessingId(envioId);
    try {
      const { error } = await supabase
        .from('envios')
        .update({
          fornecedor_id: user.id, // O usuário logado assume o transporte como fornecedor
          status: 'em_transito',
          aceito_por: user.id,
          aceito_em: new Date().toISOString()
        })
        .eq('id', envioId);

      if (error) throw error;
      alert('Carona aceita! O volume agora está sob sua responsabilidade.');
      fetchAvailable();
    } catch (err: any) {
      alert('Erro ao aceitar carona: ' + err.message);
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
        <p className="text-gray-500 mt-1">Ajude outros parceiros transportando volumes em sua rota.</p>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
          <Truck className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900">Tudo em dia!</h3>
          <p className="text-gray-500 text-sm mt-2">Não há solicitações de carona pendentes no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {envios.map((envio) => (
            <div key={envio.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
              <div className="p-6 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(envio.created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-sm uppercase tracking-tight line-clamp-1">{envio.solicitante?.nome}</h4>
                  <p className="text-xs text-gray-500 italic mt-1">"{envio.descricao}"</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-gray-50">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-orange-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Origem (Retirada)</p>
                      <p className="text-xs font-medium text-gray-700">{envio.solicitante?.endereco}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building2 size={14} className="text-beirario mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Destino (Entrega)</p>
                      <p className="text-xs font-medium text-gray-700">{envio.unidade?.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone size={14} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Contato</p>
                      <p className="text-xs font-medium text-gray-700">{envio.solicitante?.telefone}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleAccept(envio.id)}
                  disabled={processingId === envio.id}
                  className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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

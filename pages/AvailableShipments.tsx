
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, Truck, Building2, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchEnvios = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setUserId(user.id);

        const { data: usuario } = await supabase
          .from('usuarios')
          .select('fornecedor_id')
          .eq('id', user.id)
          .maybeSingle();

        if (usuario) {
          const { data } = await supabase
            .from('envios')
            .select(`
              *,
              fornecedores:fornecedor_id(nome_fantasia, endereco),
              unidades(nome)
            `)
            .eq('status', 'disponivel')
            .neq('fornecedor_id', usuario.fornecedor_id)
            .order('created_at', { ascending: false });
          
          setEnvios(data || []);
        }
      } catch (err) {
        console.error("Erro ao buscar caronas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnvios();
  }, []);

  const handleAccept = async (envioId: string) => {
    if (!userId) return;
    setProcessingId(envioId);

    try {
      const { error } = await supabase
        .from('envios')
        .update({
          status: 'aceito',
          aceito_por: userId,
          aceito_em: new Date().toISOString()
        })
        .eq('id', envioId)
        .eq('status', 'disponivel');

      if (error) throw error;

      // Sucesso: Remove o card da lista e mostra feedback
      setEnvios(prev => prev.filter(e => e.id !== envioId));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
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
    <div className="space-y-8 font-sans relative">
      {/* Toast Simples */}
      {showToast && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300">
          <CheckCircle2 size={20} />
          <span className="font-bold">Carona aceita com sucesso!</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Caronas Disponíveis</h2>
          <p className="text-gray-500 mt-1">Veja volumes de outros parceiros aguardando transporte.</p>
        </div>
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
            <div key={envio.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-lg transition-all flex flex-col group">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-50 group-hover:bg-beirario-light group-hover:text-beirario rounded-xl flex items-center justify-center transition-colors">
                    <Package size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Publicado em</p>
                    <p className="text-[10px] font-bold text-gray-900">{new Date(envio.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <h4 className="font-bold text-gray-900 mb-2 line-clamp-2">{(envio.fornecedores as any)?.nome_fantasia}</h4>
                <p className="text-xs text-gray-500 mb-6 italic">"{envio.descricao}"</p>
                
                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={12} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Origem (Retirada)</p>
                      <p className="text-[11px] font-semibold text-gray-700">{(envio.fornecedores as any)?.endereco}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-beirario-light text-beirario flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 size={12} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Destino Beira Rio</p>
                      <p className="text-[11px] font-semibold text-gray-700">{(envio.unidades as any)?.nome}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleAccept(envio.id)}
                  disabled={processingId === envio.id}
                  className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
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

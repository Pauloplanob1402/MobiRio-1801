
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, MapPin, ArrowRight, Truck, Info, CheckCircle } from 'lucide-react';

const AvailableShipments: React.FC = () => {
  const [envios, setEnvios] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmpresaId, setUserEmpresaId] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnvios = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('empresa_id')
          .eq('id', user.id)
          .single();
        if (usuario) setUserEmpresaId(usuario.empresa_id);
      }

      const { data } = await supabase
        .from('envios')
        .select('*')
        .eq('status', 'PENDENTE')
        .order('created_at', { ascending: false });
      
      setEnvios((data || []).filter(e => e.solicitante_id !== userEmpresaId));
      setLoading(false);
    };

    fetchEnvios();
  }, [userEmpresaId]);

  const handleAccept = async (envioId: string) => {
    setProcessingId(envioId);
    const { error } = await supabase
      .from('envios')
      .update({ 
        transportador_id: userEmpresaId,
        status: 'EM_TRANSITO',
        data_coleta: new Date().toISOString()
      })
      .eq('id', envioId);

    if (error) {
      alert('Erro ao aceitar envio: ' + error.message);
      setProcessingId(null);
    } else {
      setEnvios(envios.filter(e => e.id !== envioId));
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Caronas Disponíveis</h2>
          <p className="text-gray-500 mt-1">Veja o que precisa ser transportado e ganhe créditos.</p>
        </div>
        <div className="bg-beirario-light text-beirario px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <Info size={18} />
          Transportar garante +1 crédito
        </div>
      </div>

      {envios.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-20 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Truck size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Nenhuma carona disponível</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">No momento não há solicitações pendentes de outros usuários.</p>
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
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full">
                    {envio.volume_tipo}
                  </span>
                </div>
                
                <h4 className="font-bold text-gray-900 mb-4 line-clamp-2">{envio.descricao}</h4>
                
                <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-gray-100">
                  <div className="flex items-center gap-4 pl-6 relative">
                    <div className="absolute left-1 w-2 h-2 rounded-full bg-gray-300"></div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">De</p>
                      <p className="text-sm font-medium text-gray-700">{envio.origem}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-6 relative">
                    <div className="absolute left-1 w-2 h-2 rounded-full bg-beirario"></div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Para</p>
                      <p className="text-sm font-medium text-gray-700">{envio.destino}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => handleAccept(envio.id)}
                  disabled={processingId === envio.id}
                  className="w-full bg-beirario hover:bg-beirario-dark text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {processingId === envio.id ? 'Processando...' : 'Aceitar Carona'}
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

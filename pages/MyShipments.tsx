
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, Truck, CheckCircle, Clock, MapPin, Building2 } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('fornecedor_id')
      .eq('id', user.id)
      .single();

    if (usuario) {
      const { data: envios } = await supabase
        .from('envios')
        .select(`
          *,
          unidades(nome)
        `)
        .eq('fornecedor_id', usuario.fornecedor_id)
        .in('status', ['disponivel', 'em_transito'])
        .order('created_at', { ascending: false });

      if (envios) setSolicitados(envios);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Meus Envios</h2>
        <p className="text-gray-500 mt-1">Gestão de volumes ativos para as Unidades Beira Rio.</p>
      </div>

      <div className="space-y-4">
        {solicitados.length === 0 ? (
          <div className="bg-white p-16 rounded-3xl border border-dashed border-gray-200 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-gray-900">Nenhum envio ativo</h3>
            <p className="text-gray-500 text-sm mt-2">Você ainda não solicitou transportes.</p>
          </div>
        ) : (
          solicitados.map(envio => (
            <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${envio.status === 'disponivel' ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                  {envio.status === 'disponivel' ? <Clock size={28} /> : <Truck size={28} />}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{envio.descricao}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
                    <Building2 size={14} className="text-beirario" />
                    Destino: <span className="text-gray-800">{(envio.unidades as any)?.nome}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                  <p className={`text-xs font-black uppercase mt-0.5 ${envio.status === 'disponivel' ? 'text-orange-500' : 'text-blue-500'}`}>
                    {envio.status === 'disponivel' ? 'Aguardando Coleta' : 'Em Rota'}
                  </p>
                </div>
                <div className="w-1 h-8 bg-gray-100 rounded-full" />
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Criado em</p>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">
                    {new Date(envio.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyShipments;
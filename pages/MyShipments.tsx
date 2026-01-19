
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, Truck, CheckCircle, Clock, MapPin, Building2, User } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<Envio[]>([]);
  const [caronasAceitas, setCaronasAceitas] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Busca perfil do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('fornecedor_id')
      .eq('id', user.id)
      .single();

    if (usuario) {
      // 1. Envios que EU solicitei (Meus Envios)
      // Incluímos um join fictício com 'usuarios' via 'aceito_por' para ver quem aceitou
      const { data: enviosProprios } = await supabase
        .from('envios')
        .select(`
          *,
          unidades(nome),
          aceitador:usuarios!envios_aceito_por_fkey(nome)
        `)
        .eq('fornecedor_id', usuario.fornecedor_id)
        .in('status', ['disponivel', 'aceito', 'em_transito'])
        .order('created_at', { ascending: false });

      if (enviosProprios) setSolicitados(enviosProprios);

      // 2. Envios que EU aceitei levar (Minhas Atividades / Caronas)
      const { data: caronas } = await supabase
        .from('envios')
        .select(`
          *,
          unidades(nome),
          fornecedores:fornecedor_id(nome_fantasia)
        `)
        .eq('aceito_por', user.id)
        .in('status', ['aceito', 'em_transito'])
        .order('aceito_em', { ascending: false });

      if (caronas) setCaronasAceitas(caronas);
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
    <div className="max-w-5xl mx-auto space-y-12 font-sans pb-10">
      
      {/* Seção 1: Caronas que vou levar */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900">Minhas Atividades (Caronas)</h2>
          <p className="text-gray-500 mt-1">Volumes de terceiros que você se comprometeu a transportar.</p>
        </div>

        <div className="space-y-4">
          {caronasAceitas.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl border border-dashed border-gray-200 text-center">
              <Truck className="mx-auto text-gray-300 mb-4" size={40} />
              <p className="text-gray-500 text-sm">Você não aceitou nenhuma carona recentemente.</p>
            </div>
          ) : (
            caronasAceitas.map(envio => (
              <div key={envio.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-beirario">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-beirario-light text-beirario flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{(envio.fornecedores as any)?.nome_fantasia}</h4>
                    <p className="text-xs text-gray-500 mt-0.5 italic">"{envio.descricao}"</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destino</p>
                    <p className="text-xs font-bold text-gray-700">{(envio.unidades as any)?.nome}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 uppercase">Aceito</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Seção 2: Meus Envios Solicitados */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Meus Envios</h2>
          <p className="text-gray-500 mt-1">Gestão de volumes da sua empresa aguardando ou em trânsito.</p>
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
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${envio.status === 'disponivel' ? 'bg-orange-50 text-orange-500 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {envio.status === 'disponivel' ? <Clock size={28} /> : <CheckCircle size={28} />}
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
                  {envio.status === 'aceito' && (
                    <div className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
                      <User size={16} className="text-blue-500" />
                      <div>
                        <p className="text-[9px] font-bold text-blue-400 uppercase leading-none">Aceito por</p>
                        <p className="text-xs font-bold text-blue-700 leading-tight">{(envio as any).aceitador?.nome || 'Usuário Mobirio'}</p>
                      </div>
                    </div>
                  )}

                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</p>
                    <p className={`text-xs font-black uppercase mt-0.5 ${envio.status === 'disponivel' ? 'text-orange-500' : 'text-green-600'}`}>
                      {envio.status === 'disponivel' ? 'Aguardando Coleta' : envio.status === 'aceito' ? 'Carona Confirmada' : 'Em Rota'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default MyShipments;

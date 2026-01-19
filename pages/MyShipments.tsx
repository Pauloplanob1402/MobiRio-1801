
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Envio } from '../types';
import { Package, MapPin, ArrowRight, Truck, CheckCircle, Clock } from 'lucide-react';

const MyShipments: React.FC = () => {
  const [solicitados, setSolicitados] = useState<Envio[]>([]);
  const [transportando, setTransportando] = useState<Envio[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('id', user.id)
      .single();

    if (usuario) {
      setEmpresaId(usuario.empresa_id);
      
      const { data: allEnvios } = await supabase
        .from('envios')
        .select('*')
        .or(`solicitante_id.eq.${usuario.empresa_id},transportador_id.eq.${usuario.empresa_id}`)
        .in('status', ['PENDENTE', 'EM_TRANSITO'])
        .order('created_at', { ascending: false });

      if (allEnvios) {
        setSolicitados(allEnvios.filter(e => e.solicitante_id === usuario.empresa_id));
        setTransportando(allEnvios.filter(e => e.transportador_id === usuario.empresa_id));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleComplete = async (envio: Envio) => {
    setProcessingId(envio.id);
    
    // Inicia transação de entrega
    // 1. Atualiza status do envio
    const { error: updateError } = await supabase
      .from('envios')
      .update({ 
        status: 'ENTREGUE',
        data_entrega: new Date().toISOString()
      })
      .eq('id', envio.id);

    if (updateError) {
      alert('Erro ao finalizar: ' + updateError.message);
      setProcessingId(null);
      return;
    }

    // 2. Lógica de Créditos (+1 para transportador, -1 para solicitante)
    // Registrar movimento Crédito para o Transportador
    await supabase.from('movimentos_credito').insert({
      empresa_id: envio.transportador_id,
      envio_id: envio.id,
      quantidade: 1,
      tipo: 'CREDITO'
    });

    // Registrar movimento Débito para o Solicitante
    await supabase.from('movimentos_credito').insert({
      empresa_id: envio.solicitante_id,
      envio_id: envio.id,
      quantidade: -1,
      tipo: 'DEBITO'
    });

    // 3. Atualizar Saldos nas empresas
    // Incrementa Transportador
    const { data: transportadorData } = await supabase.from('empresas').select('creditos_saldo').eq('id', envio.transportador_id!).single();
    await supabase.from('empresas').update({ creditos_saldo: (transportadorData?.creditos_saldo || 0) + 1 }).eq('id', envio.transportador_id!);

    // Decrementa Solicitante
    const { data: solicitanteData } = await supabase.from('empresas').select('creditos_saldo').eq('id', envio.solicitante_id).single();
    await supabase.from('empresas').update({ creditos_saldo: (solicitanteData?.creditos_saldo || 0) - 1 }).eq('id', envio.solicitante_id);

    await fetchData();
    setProcessingId(null);
  };

  const ShipmentCard = ({ envio, role }: { envio: Envio, role: 'solicitante' | 'transportador' }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${envio.status === 'PENDENTE' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
          {envio.status === 'PENDENTE' ? <Clock size={24} /> : <Truck size={24} />}
        </div>
        <div>
          <h4 className="font-bold text-gray-900">{envio.descricao}</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
            <span>{envio.origem}</span>
            <ArrowRight size={10} />
            <span>{envio.destino}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
          <p className={`text-sm font-bold ${envio.status === 'PENDENTE' ? 'text-orange-500' : 'text-blue-500'}`}>
            {envio.status === 'PENDENTE' ? 'Aguardando Carona' : 'Em Trânsito'}
          </p>
        </div>

        {role === 'transportador' && envio.status === 'EM_TRANSITO' && (
          <button 
            onClick={() => handleComplete(envio)}
            disabled={processingId === envio.id}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <CheckCircle size={20} />
            {processingId === envio.id ? 'Finalizando...' : 'Entregue'}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beirario"></div>
    </div>
  );

  return (
    <div className="space-y-12">
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Em Transporte</h2>
          <p className="text-gray-500">Caronas que você está realizando atualmente.</p>
        </div>
        <div className="space-y-4">
          {transportando.length === 0 ? (
            <p className="text-gray-400 italic bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center">Nenhuma carona em andamento.</p>
          ) : (
            transportando.map(e => <ShipmentCard key={e.id} envio={e} role="transportador" />)
          )}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Meus Pedidos</h2>
          <p className="text-gray-500">Solicitações de carona feitas pela sua empresa.</p>
        </div>
        <div className="space-y-4">
          {solicitados.length === 0 ? (
            <p className="text-gray-400 italic bg-white p-8 rounded-2xl border border-dashed border-gray-200 text-center">Nenhuma solicitação pendente.</p>
          ) : (
            solicitados.map(e => <ShipmentCard key={e.id} envio={e} role="solicitante" />)
          )}
        </div>
      </section>
    </div>
  );
};

export default MyShipments;

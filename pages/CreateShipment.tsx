import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Package, MapPin, CheckCircle, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';

const CreateShipment: React.FC = () => {
  const [descricao, setDescricao] = useState('');
  const [destino, setDestino] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setErro(null);
    if (!descricao.trim()) return setErro('Descreva o que você precisa trazer.');
    if (!destino.trim()) return setErro('Informe o destino da entrega.');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('envios').insert({
        solicitante_id: user.id,
        descricao:      descricao.trim(),
        destino_livre:  destino.trim(),
        status:         'disponivel',
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/meus-envios'), 1800);
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
        <CheckCircle size={48} />
      </div>
      <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Pedido publicado!</h2>
      <p className="text-gray-500 font-medium">Quem passar pelo seu caminho vai ver o pedido agora.</p>
      <p className="text-xs text-movendo font-black mt-3 uppercase">Redirecionando para suas atividades...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-movendo" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Preciso trazer algo</h2>
            <p className="text-gray-400 text-xs font-bold">Publique seu pedido e alguém no caminho pode levar</p>
          </div>
        </div>

        <div className="bg-movendo-light border border-orange-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <ChevronRight size={16} className="text-movendo mt-0.5 shrink-0" />
          <p className="text-xs text-orange-800 font-medium leading-relaxed">
            Seu pedido aparece para quem já vai passar por essa rota.
            Custa <strong>1 MOVE</strong> quando alguém confirmar a entrega.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 space-y-7">

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">O que você precisa trazer?</label>
          <textarea
            className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo min-h-[100px] text-sm font-medium text-gray-700"
            placeholder="Ex: Uma caixa de remédios da farmácia tal, um pacote da loja X..."
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Para onde precisa ir?</label>
          <div className="relative">
            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-movendo" />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo text-sm font-bold text-gray-700"
              placeholder="Ex: Zona Sul, Bairro Moinhos, Centro de POA..."
              value={destino}
              onChange={e => setDestino(e.target.value)}
            />
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-3 rounded-xl">
            <AlertCircle size={16} /> {erro}
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] bg-slate-950 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-40 shadow-xl"
          >
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Package size={20} />}
            {loading ? 'Publicando...' : 'Publicar meu pedido'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateShipment;

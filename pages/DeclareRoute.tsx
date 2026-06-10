import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Navigation, MapPin, Clock, CheckCircle, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';

const JANELAS = [
  { value: 'hoje',        label: 'Hoje',        desc: 'Vou passar ainda hoje' },
  { value: 'amanha',      label: 'Amanhã',      desc: 'Minha viagem é amanhã' },
  { value: 'essa_semana', label: 'Essa semana', desc: 'Em algum momento essa semana' },
];

const DeclareRoute: React.FC = () => {
  const [destino, setDestino] = useState('');
  const [janela, setJanela] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setErro(null);
    if (!destino.trim()) return setErro('Informe o destino.');
    if (!janela) return setErro('Selecione quando você vai.');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('rotas').insert({
        usuario_id:  user.id,
        destino:     destino.trim(),
        janela,
        observacao:  observacao.trim() || null,
        status:      'ativa',
      });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/disponiveis'), 1800);
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
      <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">Rota publicada!</h2>
      <p className="text-gray-500 font-medium">Pedidos no seu caminho aparecem agora.</p>
      <p className="text-xs text-movendo font-black mt-3 uppercase">Redirecionando para caronas...</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center">
            <Navigation size={20} className="text-movendo" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Vou passar por lá</h2>
            <p className="text-gray-400 text-xs font-bold">Declare sua rota e atraia pedidos no caminho</p>
          </div>
        </div>

        {/* Como funciona */}
        <div className="bg-movendo-light border border-orange-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <ChevronRight size={16} className="text-movendo mt-0.5 shrink-0" />
          <p className="text-xs text-orange-800 font-medium leading-relaxed">
            Ao declarar sua rota, sua viagem aparece para quem precisa enviar algo nessa direção.
            Você ganha <strong>+1 MOVE por entrega confirmada</strong> — sem custo para declarar.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 space-y-7">

        {/* Destino */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Para onde você vai?</label>
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

        {/* Janela de tempo */}
        <div className="space-y-3">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Quando você vai?</label>
          <div className="grid grid-cols-3 gap-3">
            {JANELAS.map(j => (
              <button
                key={j.value}
                onClick={() => setJanela(j.value)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  janela === j.value
                    ? 'border-movendo bg-movendo-light'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className={janela === j.value ? 'text-movendo' : 'text-gray-400'} />
                  <span className={`text-xs font-black uppercase ${janela === j.value ? 'text-movendo' : 'text-gray-500'}`}>
                    {j.label}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-snug">{j.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Observação */}
        <div className="space-y-2">
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Observação <span className="text-gray-300 normal-case font-normal">(opcional)</span>
          </label>
          <textarea
            className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-movendo/20 focus:border-movendo min-h-[90px] text-sm font-medium text-gray-700"
            placeholder="Ex: Passo pela Av. Ipiranga, posso pegar coisas pequenas, saio às 14h..."
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />
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
            {loading ? <RefreshCw size={20} className="animate-spin" /> : <Navigation size={20} />}
            {loading ? 'Publicando...' : 'Publicar minha rota'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeclareRoute;

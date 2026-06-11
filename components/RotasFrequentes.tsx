import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Zap, MapPin, TrendingUp } from 'lucide-react';

interface RotaFrequente {
  destino: string;
  count: number;
}

const RotasFrequentes: React.FC = () => {
  const [rotas, setRotas] = useState<RotaFrequente[]>([]);
  const navigate = useNavigate();

  const fetchRotas = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar histórico de destinos do usuário (envios + rotas declaradas)
    const [{ data: envios }, { data: rotasDeclaradas }] = await Promise.all([
      supabase.from('envios')
        .select('destino_livre')
        .eq('solicitante_id', user.id)
        .not('destino_livre', 'is', null),
      supabase.from('rotas')
        .select('destino')
        .eq('usuario_id', user.id),
    ]);

    // Contar frequência de cada destino (normalizado)
    const freq: Record<string, number> = {};

    (envios || []).forEach(e => {
      if (!e.destino_livre) return;
      const key = e.destino_livre.split(',')[0].trim().toLowerCase();
      freq[key] = (freq[key] || 0) + 1;
    });
    (rotasDeclaradas || []).forEach(r => {
      if (!r.destino) return;
      const key = r.destino.split(',')[0].trim().toLowerCase();
      freq[key] = (freq[key] || 0) + 1;
    });

    // Ordenar por frequência, pegar top 4
    const sorted = Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([destino, count]) => ({
        destino: destino.charAt(0).toUpperCase() + destino.slice(1),
        count,
      }));

    setRotas(sorted);
  }, []);

  useEffect(() => { fetchRotas(); }, [fetchRotas]);

  if (rotas.length === 0) return null;

  const max = rotas[0]?.count || 1;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <TrendingUp size={14} className="text-movendo" />
        <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Seus destinos frequentes</h3>
        <span className="ml-auto text-[10px] text-gray-300 font-bold uppercase flex items-center gap-1">
          <Zap size={10} /> Aprendido
        </span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {rotas.map((rota, i) => (
          <button
            key={rota.destino}
            onClick={() => navigate('/declarar-rota', { state: { destino: rota.destino } })}
            className="w-full group"
          >
            <div className="flex items-center gap-3 mb-1">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                i === 0 ? 'bg-movendo/10' : 'bg-gray-100'
              }`}>
                <MapPin size={12} className={i === 0 ? 'text-movendo' : 'text-gray-400'} />
              </div>
              <span className="text-sm font-semibold text-gray-800 flex-1 text-left group-hover:text-movendo transition-colors">
                {rota.destino}
              </span>
              <span className="text-[10px] text-gray-300 font-bold shrink-0">
                {rota.count}x
              </span>
            </div>
            {/* Barra de frequência */}
            <div className="ml-9 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${i === 0 ? 'bg-movendo' : 'bg-gray-300'}`}
                style={{ width: `${(rota.count / max) * 100}%` }}
              />
            </div>
          </button>
        ))}
      </div>

      <div className="px-5 pb-4">
        <p className="text-[10px] text-gray-300 font-medium">
          Clique em um destino para declarar sua rota rapidamente.
        </p>
      </div>
    </div>
  );
};

export default RotasFrequentes;

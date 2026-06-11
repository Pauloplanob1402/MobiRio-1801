import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Activity, MapPin, Package, Navigation, Clock } from 'lucide-react';

interface EventoRadar {
  id: string;
  tipo: 'pedido' | 'entrega' | 'rota';
  texto: string;
  tempo: Date;
}

const MSGS_PEDIDO = [
  'alguém publicou um novo pedido',
  'um novo frete foi solicitado',
  'novo pedido na rede',
];
const MSGS_ENTREGA = [
  'uma entrega foi confirmada',
  'alguém completou uma entrega',
  'entrega concluída com sucesso',
];
const MSGS_ROTA = [
  'alguém declarou uma rota',
  'nova rota disponível na rede',
  'um usuário vai passar por aí',
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const timeAgo = (d: Date) => {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'agora mesmo';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}min atrás`;
  return `${Math.floor(m / 60)}h atrás`;
};

const ICON_MAP = {
  pedido:   { icon: Package,    color: 'text-movendo',   bg: 'bg-orange-50' },
  entrega:  { icon: Clock,      color: 'text-green-500', bg: 'bg-green-50'  },
  rota:     { icon: Navigation, color: 'text-blue-500',  bg: 'bg-blue-50'   },
};

const RadarAtividade: React.FC = () => {
  const [eventos, setEventos] = useState<EventoRadar[]>([]);
  const [pulsar, setPulsar]   = useState(false);
  const maxItems = 6;
  const containerRef = useRef<HTMLDivElement>(null);

  const addEvento = useCallback((tipo: EventoRadar['tipo'], destino?: string) => {
    const msgs = tipo === 'pedido' ? MSGS_PEDIDO : tipo === 'entrega' ? MSGS_ENTREGA : MSGS_ROTA;
    const texto = destino
      ? `${pick(msgs)} → ${destino.split(',')[0].trim()}`
      : pick(msgs);

    const novo: EventoRadar = { id: crypto.randomUUID(), tipo, texto, tempo: new Date() };

    setEventos(prev => [novo, ...prev].slice(0, maxItems));
    setPulsar(true);
    setTimeout(() => setPulsar(false), 600);
  }, []);

  useEffect(() => {
    // Carregar atividade recente real do banco
    const loadRecent = async () => {
      const { data: envios } = await supabase
        .from('envios')
        .select('id, status, destino_livre, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      const { data: rotas } = await supabase
        .from('rotas')
        .select('id, destino, created_at')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(2);

      const items: EventoRadar[] = [];

      (envios || []).forEach(e => {
        const tipo: EventoRadar['tipo'] = e.status === 'entregue' ? 'entrega' : 'pedido';
        const msgs = tipo === 'entrega' ? MSGS_ENTREGA : MSGS_PEDIDO;
        const destino = e.destino_livre?.split(',')[0]?.trim();
        items.push({
          id: e.id,
          tipo,
          texto: destino ? `${pick(msgs)} → ${destino}` : pick(msgs),
          tempo: new Date(e.created_at),
        });
      });

      (rotas || []).forEach(r => {
        items.push({
          id: r.id,
          tipo: 'rota',
          texto: `${pick(MSGS_ROTA)} → ${r.destino.split(',')[0].trim()}`,
          tempo: new Date(r.created_at),
        });
      });

      // Ordenar por tempo
      items.sort((a, b) => b.tempo.getTime() - a.tempo.getTime());
      setEventos(items.slice(0, maxItems));
    };

    loadRecent();

    // Escutar eventos em tempo real
    const ch = supabase.channel('radar_live')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'envios'
      }, payload => {
        addEvento('pedido', payload.new?.destino_livre);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'envios',
        filter: 'status=eq.entregue'
      }, payload => {
        addEvento('entrega', payload.new?.destino_livre);
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'rotas'
      }, payload => {
        addEvento('rota', payload.new?.destino);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [addEvento]);

  // Atualizar os timestamps a cada minuto
  useEffect(() => {
    const t = setInterval(() => setEventos(p => [...p]), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-3">
        <div className="relative">
          <div className={`w-2 h-2 rounded-full bg-green-400 ${pulsar ? 'animate-ping absolute' : ''}`} />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Radar da Rede</h3>
        <span className="ml-auto text-[10px] text-gray-300 font-bold uppercase">Tempo real</span>
      </div>

      {/* Eventos */}
      <div ref={containerRef} className="divide-y divide-gray-50">
        {eventos.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Activity size={28} className="mx-auto text-gray-200 mb-2" />
            <p className="text-xs text-gray-300 font-medium">Aguardando atividade na rede...</p>
          </div>
        ) : (
          eventos.map((ev, i) => {
            const { icon: Icon, color, bg } = ICON_MAP[ev.tipo];
            return (
              <div
                key={ev.id}
                className={`px-5 py-3 flex items-center gap-3 transition-all ${i === 0 && pulsar ? 'bg-orange-50/50' : 'hover:bg-gray-50/50'}`}
              >
                <div className={`w-7 h-7 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={13} className={color} />
                </div>
                <p className="text-xs text-gray-600 font-medium flex-1 leading-snug">{ev.texto}</p>
                <span className="text-[10px] text-gray-300 font-bold shrink-0 whitespace-nowrap">
                  {timeAgo(ev.tempo)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RadarAtividade;

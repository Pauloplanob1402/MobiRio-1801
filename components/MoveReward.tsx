import React, { useEffect, useState } from 'react';

interface MoveRewardProps {
  show: boolean;
  onDone: () => void;
}

const MoveReward: React.FC<MoveRewardProps> = ({ show, onDone }) => {
  const [phase, setPhase] = useState<'idle' | 'burst' | 'float' | 'done'>('idle');

  useEffect(() => {
    if (!show) return;
    setPhase('burst');
    const t1 = setTimeout(() => setPhase('float'), 200);
    const t2 = setTimeout(() => { setPhase('done'); onDone(); }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show, onDone]);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Overlay escurecido suave */}
      <div className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ${phase === 'float' ? 'opacity-100' : 'opacity-0'}`} />

      {/* Badge central */}
      <div className={`relative flex flex-col items-center transition-all duration-700 ${
        phase === 'burst' ? 'scale-50 opacity-0' :
        phase === 'float' ? 'scale-100 opacity-100 -translate-y-4' : 'opacity-0'
      }`}>

        {/* Círculo pulsante */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30 scale-150" />
          <div className="w-28 h-28 rounded-full bg-green-500 flex flex-col items-center justify-center shadow-2xl shadow-green-500/40 relative z-10">
            <span className="text-4xl font-black text-white leading-none">+1</span>
            <span className="text-xs font-black text-green-200 tracking-widest uppercase mt-0.5">MOVE</span>
          </div>
        </div>

        {/* Partículas */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-green-400 animate-ping"
            style={{
              top: '50%', left: '50%',
              transform: `rotate(${i * 45}deg) translateX(${60 + (i % 3) * 10}px)`,
              animationDelay: `${i * 60}ms`,
              animationDuration: '600ms',
              opacity: 0.6,
            }}
          />
        ))}

        {/* Texto abaixo */}
        <div className={`mt-5 text-center transition-all duration-500 delay-300 ${phase === 'float' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <p className="text-white font-black text-lg drop-shadow-lg">Entrega confirmada!</p>
          <p className="text-white/80 text-sm font-medium drop-shadow">+1 MOVE na sua carteira</p>
        </div>
      </div>
    </div>
  );
};

export default MoveReward;

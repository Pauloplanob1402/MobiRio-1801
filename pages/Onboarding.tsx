import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Navigation, Coins, ArrowRight, Check } from 'lucide-react';

const STEPS = [
  {
    icon: Coins,
    color: 'bg-movendo',
    iconColor: 'text-white',
    tag: 'Bem-vindo',
    title: 'Você ganhou\n12 MOVE',
    subtitle: 'MOVE é a moeda da rede. Você usa para pedir fretes e ganha fazendo entregas.',
    detail: 'Sem dinheiro. Sem taxas. Só colaboração.',
  },
  {
    icon: Package,
    color: 'bg-slate-950',
    iconColor: 'text-movendo',
    tag: 'Pedir',
    title: 'Precisa trazer\nalgo de longe?',
    subtitle: 'Publique um pedido com origem e destino. Quem já vai pra lá leva junto.',
    detail: 'Custa 1 MOVE por pedido. Simples assim.',
  },
  {
    icon: Navigation,
    color: 'bg-slate-950',
    iconColor: 'text-movendo',
    tag: 'Ganhar',
    title: 'Vai passar\npor lá?',
    subtitle: 'Declare sua rota. O app mostra pedidos no seu caminho. Você entrega e ganha +1 MOVE.',
    detail: 'Quanto mais você entrega, mais MOVE você acumula.',
  },
];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const navigate = useNavigate();
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      setExiting(true);
      localStorage.setItem('mj_onboarding_done', '1');
      setTimeout(() => navigate('/'), 300);
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full max-w-sm">

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-movendo' : i < step ? 'w-4 bg-movendo/30' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden">

          {/* Ícone */}
          <div className={`${current.color} p-10 flex flex-col items-center justify-center relative overflow-hidden`}>
            {/* Círculos decorativos */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full" />
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-0 ${
              current.color === 'bg-movendo' ? 'bg-white/20' : 'bg-movendo/20'
            }`}>
              <Icon size={36} className={current.iconColor} />
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-8">
            <span className="text-[10px] font-black text-movendo uppercase tracking-widest">{current.tag}</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight mt-2 whitespace-pre-line">
              {current.title}
            </h2>
            <p className="text-gray-500 mt-4 text-sm leading-relaxed">{current.subtitle}</p>
            <p className="text-[11px] text-gray-300 font-medium mt-3">{current.detail}</p>
          </div>

          {/* Botão */}
          <div className="px-8 pb-8">
            <button
              onClick={next}
              className="w-full bg-movendo hover:bg-movendo-dark text-white font-black py-4 rounded-2xl shadow-lg shadow-movendo/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isLast ? (
                <><Check size={18} /> Começar agora</>
              ) : (
                <>Próximo <ArrowRight size={18} /></>
              )}
            </button>

            {!isLast && (
              <button
                onClick={() => {
                  localStorage.setItem('mj_onboarding_done', '1');
                  navigate('/');
                }}
                className="w-full mt-3 text-xs text-gray-300 font-bold py-2 hover:text-gray-400 transition-colors"
              >
                Pular introdução
              </button>
            )}
          </div>
        </div>

        {/* Step counter */}
        <p className="text-center text-[10px] text-gray-300 font-bold mt-6 uppercase tracking-widest">
          {step + 1} de {STEPS.length}
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
